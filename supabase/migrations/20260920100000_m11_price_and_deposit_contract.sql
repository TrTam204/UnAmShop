BEGIN;

-- -----------------------------------------------------------------------------
-- M11 alignment: decimal pricing + minimum deposit enforcement + catalog/admin RPCs
-- Scope: one migration to update the authoritative Supabase contract without editing
-- the earlier M4/M5/M6/M9 migrations.
-- -----------------------------------------------------------------------------

UPDATE public.services
SET selling_rate_vnd = selling_rate_vnd::numeric / 1000;

UPDATE public.orders
SET selling_rate_snapshot_vnd = selling_rate_snapshot_vnd::numeric / 1000;

ALTER TABLE public.services
    ALTER COLUMN selling_rate_vnd TYPE numeric(20,8)
    USING selling_rate_vnd::numeric(20,8);

ALTER TABLE public.orders
    ALTER COLUMN selling_rate_snapshot_vnd TYPE numeric(20,8)
    USING selling_rate_snapshot_vnd::numeric(20,8);

DROP FUNCTION IF EXISTS public.get_service_catalog(text, text, text);

CREATE FUNCTION public.get_service_catalog(
    p_platform_slug text DEFAULT NULL,
    p_category_slug text DEFAULT NULL,
    p_search text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    selling_rate_vnd numeric(20,8),
    min_quantity integer,
    max_quantity integer,
    supports_refill boolean,
    supports_cancel boolean,
    category_name text,
    category_slug text,
    platform_name text,
    platform_slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        s.id,
        s.name,
        s.description,
        s.selling_rate_vnd,
        s.min_quantity,
        s.max_quantity,
        s.supports_refill,
        s.supports_cancel,
        c.name AS category_name,
        c.slug AS category_slug,
        p.name AS platform_name,
        p.slug AS platform_slug
    FROM public.services s
    INNER JOIN public.categories c ON c.id = s.category_id
    INNER JOIN public.platforms p ON p.id = c.platform_id
    WHERE p.is_active = true
      AND c.is_active = true
      AND s.is_active = true
      AND (
          p_platform_slug IS NULL
          OR p.slug = p_platform_slug
      )
      AND (
          p_category_slug IS NULL
          OR c.slug = p_category_slug
      )
      AND (
          p_search IS NULL
          OR s.name ILIKE '%' || p_search || '%'
          OR COALESCE(s.description, '') ILIKE '%' || p_search || '%'
      )
    ORDER BY
        p.sort_order,
        p.name,
        c.sort_order,
        c.name,
        s.sort_order,
        s.name,
        s.id;
$$;

REVOKE ALL ON FUNCTION public.get_service_catalog(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_service_catalog(text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_deposit_request(
    p_amount_vnd bigint,
    p_payment_method text
)
RETURNS public.deposit_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_deposit_request public.deposit_requests;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.status = 'active'
    ) THEN
        RAISE EXCEPTION 'Active profile required';
    END IF;

    IF p_amount_vnd IS NULL OR p_amount_vnd < 10000 THEN
        RAISE EXCEPTION 'Deposit amount must be at least 10000 VND';
    END IF;

    IF p_payment_method IS NULL
       OR p_payment_method NOT IN ('vietqr', 'zalo') THEN
        RAISE EXCEPTION 'Unsupported deposit payment method';
    END IF;

    INSERT INTO public.deposit_requests (
        user_id,
        amount_vnd,
        payment_method,
        status
    )
    VALUES (
        auth.uid(),
        p_amount_vnd,
        p_payment_method,
        'pending'
    )
    RETURNING * INTO v_deposit_request;

    UPDATE public.deposit_requests
    SET payment_reference = 'DEP-' || upper(replace(v_deposit_request.id::text, '-', ''))
    WHERE id = v_deposit_request.id
    RETURNING * INTO v_deposit_request;

    RETURN v_deposit_request;
END;
$$;

REVOKE ALL ON FUNCTION public.create_deposit_request(bigint, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_deposit_request(bigint, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_deposit_request(bigint, text) TO authenticated;

DROP FUNCTION IF EXISTS public.create_order(uuid, text, integer, text);

CREATE FUNCTION public.create_order(
    p_service_id uuid,
    p_link text,
    p_quantity integer,
    p_idempotency_key text
)
RETURNS TABLE (
    id uuid,
    service_id uuid,
    link text,
    quantity integer,
    service_name_snapshot text,
    selling_rate_snapshot_vnd numeric(20,8),
    charge_vnd bigint,
    refunded_amount_vnd bigint,
    status text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid;
    v_service public.services;
    v_provider_service public.provider_services;
    v_provider public.providers;
    v_existing_order public.orders;
    v_order public.orders;
    v_balance_before bigint;
    v_balance_after bigint;
    v_charge_vnd bigint;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = v_user_id
          AND p.status = 'active'
    ) THEN
        RAISE EXCEPTION 'Active profile required';
    END IF;

    IF p_service_id IS NULL THEN
        RAISE EXCEPTION 'Service is required';
    END IF;

    IF p_link IS NULL OR btrim(p_link) = '' THEN
        RAISE EXCEPTION 'Order link is required';
    END IF;

    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'Order quantity must be greater than zero';
    END IF;

    IF p_idempotency_key IS NULL OR btrim(p_idempotency_key) = '' THEN
        RAISE EXCEPTION 'Idempotency key is required';
    END IF;

    SELECT s.*
    INTO v_service
    FROM public.services s
    INNER JOIN public.categories c ON c.id = s.category_id
    INNER JOIN public.platforms p ON p.id = c.platform_id
    WHERE s.id = p_service_id
      AND s.is_active = true
      AND c.is_active = true
      AND p.is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service is not available';
    END IF;

    IF v_service.primary_provider_service_id IS NULL THEN
        RAISE EXCEPTION 'Service routing is not configured';
    END IF;

    SELECT ps.*
    INTO v_provider_service
    FROM public.provider_services ps
    WHERE ps.id = v_service.primary_provider_service_id
      AND ps.is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Provider service is not available';
    END IF;

    SELECT p.*
    INTO v_provider
    FROM public.providers p
    WHERE p.id = v_provider_service.provider_id
      AND p.is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Provider is not available';
    END IF;

    IF p_quantity < v_service.min_quantity
       OR p_quantity > v_service.max_quantity THEN
        RAISE EXCEPTION 'Quantity must be between % and %',
            v_service.min_quantity,
            v_service.max_quantity;
    END IF;

    v_charge_vnd := CEIL((v_service.selling_rate_vnd * p_quantity::numeric))::bigint;

    IF v_charge_vnd <= 0 THEN
        RAISE EXCEPTION 'Service charge must be greater than zero';
    END IF;

    SELECT w.balance_vnd
    INTO v_balance_before
    FROM public.wallets w
    WHERE w.user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    SELECT o.*
    INTO v_existing_order
    FROM public.orders o
    WHERE o.user_id = v_user_id
      AND o.idempotency_key = btrim(p_idempotency_key)
    LIMIT 1;

    IF FOUND THEN
        IF v_existing_order.service_id <> p_service_id
           OR v_existing_order.link <> btrim(p_link)
           OR v_existing_order.quantity <> p_quantity THEN
            RAISE EXCEPTION 'Idempotency key already used with different order parameters';
        END IF;

        RETURN QUERY
        SELECT
            o.id,
            o.service_id,
            o.link,
            o.quantity,
            o.service_name_snapshot,
            o.selling_rate_snapshot_vnd,
            o.charge_vnd,
            o.refunded_amount_vnd,
            o.status,
            o.created_at,
            o.updated_at
        FROM public.orders o
        WHERE o.id = v_existing_order.id;
        RETURN;
    END IF;

    IF v_balance_before < v_charge_vnd THEN
        RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;

    INSERT INTO public.orders (
        user_id,
        service_id,
        provider_id,
        provider_service_id,
        link,
        quantity,
        service_name_snapshot,
        selling_rate_snapshot_vnd,
        charge_vnd,
        status,
        provider_submit_status,
        idempotency_key,
        remains
    )
    VALUES (
        v_user_id,
        v_service.id,
        v_provider.id,
        v_provider_service.id,
        btrim(p_link),
        p_quantity,
        v_service.name,
        v_service.selling_rate_vnd,
        v_charge_vnd,
        'pending',
        'not_submitted',
        btrim(p_idempotency_key),
        p_quantity
    )
    RETURNING * INTO v_order;

    v_balance_after := v_balance_before - v_charge_vnd;

    UPDATE public.wallets
    SET
        balance_vnd = v_balance_after,
        updated_at = now()
    WHERE user_id = v_user_id;

    INSERT INTO public.wallet_transactions (
        user_id,
        direction,
        type,
        operation_key,
        amount_vnd,
        balance_before_vnd,
        balance_after_vnd,
        order_id,
        description
    )
    VALUES (
        v_user_id,
        'debit',
        'order',
        v_order.id,
        v_charge_vnd,
        v_balance_before,
        v_balance_after,
        v_order.id,
        'Order charge'
    );

    RETURN QUERY
    SELECT
        o.id,
        o.service_id,
        o.link,
        o.quantity,
        o.service_name_snapshot,
        o.selling_rate_snapshot_vnd,
        o.charge_vnd,
        o.refunded_amount_vnd,
        o.status,
        o.created_at,
        o.updated_at
    FROM public.orders o
    WHERE o.id = v_order.id;
    RETURN;
EXCEPTION
    WHEN unique_violation THEN
        SELECT o.*
        INTO v_existing_order
        FROM public.orders o
        WHERE o.user_id = v_user_id
          AND o.idempotency_key = btrim(p_idempotency_key)
        LIMIT 1;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Duplicate order attempt could not be resolved';
        END IF;

        RETURN QUERY
        SELECT
            o.id,
            o.service_id,
            o.link,
            o.quantity,
            o.service_name_snapshot,
            o.selling_rate_snapshot_vnd,
            o.charge_vnd,
            o.refunded_amount_vnd,
            o.status,
            o.created_at,
            o.updated_at
        FROM public.orders o
        WHERE o.id = v_existing_order.id;
        RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(uuid, text, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_order(uuid, text, integer, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_order(uuid, text, integer, text) TO authenticated;

-- -----------------------------------------------------------------------------
-- Admin order listing (RETURNS TABLE aligned to numeric pricing snapshot)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_list_orders(text, integer, integer);

CREATE FUNCTION public.admin_list_orders(
    p_status text DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    email text,
    full_name text,
    service_id uuid,
    service_name_snapshot text,
    provider_id uuid,
    provider_service_id uuid,
    provider_order_id text,
    link text,
    quantity integer,
    selling_rate_snapshot_vnd numeric(20,8),
    charge_vnd bigint,
    refunded_amount_vnd bigint,
    status text,
    provider_status text,
    provider_submit_status text,
    provider_submit_attempts integer,
    provider_error text,
    created_at timestamptz,
    updated_at timestamptz,
    completed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN
        RAISE EXCEPTION 'Limit must be between 1 and 100';
    END IF;

    IF p_offset IS NULL OR p_offset < 0 THEN
        RAISE EXCEPTION 'Offset must be non-negative';
    END IF;

    RETURN QUERY
    SELECT
        o.id,
        o.user_id,
        u.email::text,
        p.full_name,
        o.service_id,
        o.service_name_snapshot,
        o.provider_id,
        o.provider_service_id,
        o.provider_order_id,
        o.link,
        o.quantity,
        o.selling_rate_snapshot_vnd,
        o.charge_vnd,
        o.refunded_amount_vnd,
        o.status,
        o.provider_status,
        o.provider_submit_status,
        o.provider_submit_attempts,
        o.provider_error,
        o.created_at,
        o.updated_at,
        o.completed_at
    FROM public.orders o
    INNER JOIN auth.users u ON u.id = o.user_id
    INNER JOIN public.profiles p ON p.id = o.user_id
    WHERE p_status IS NULL OR o.status = p_status
    ORDER BY o.created_at DESC, o.id
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_orders(text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_orders(text, integer, integer) TO authenticated;

DROP FUNCTION IF EXISTS public.admin_create_service(
    uuid,
    text,
    text,
    bigint,
    integer,
    integer,
    boolean,
    boolean,
    uuid,
    integer
);

CREATE FUNCTION public.admin_create_service(
    p_category_id uuid,
    p_name text,
    p_description text,
    p_selling_rate_vnd numeric(20,8),
    p_min_quantity integer,
    p_max_quantity integer,
    p_supports_refill boolean,
    p_supports_cancel boolean,
    p_primary_provider_service_id uuid,
    p_sort_order integer DEFAULT 0
)
RETURNS public.services
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_service public.services;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = p_category_id) THEN
        RAISE EXCEPTION 'Category not found';
    END IF;

    IF p_primary_provider_service_id IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM public.provider_services ps
           INNER JOIN public.providers p ON p.id = ps.provider_id
           WHERE ps.id = p_primary_provider_service_id
             AND ps.is_active = true
             AND p.is_active = true
       ) THEN
        RAISE EXCEPTION 'Active provider routing is required';
    END IF;

    IF p_name IS NULL OR btrim(p_name) = '' THEN
        RAISE EXCEPTION 'Service name is required';
    END IF;

    IF p_selling_rate_vnd IS NULL OR p_selling_rate_vnd <= 0 OR p_min_quantity <= 0 OR p_max_quantity < p_min_quantity THEN
        RAISE EXCEPTION 'Invalid service pricing or quantity bounds';
    END IF;

    IF p_sort_order < 0 THEN
        RAISE EXCEPTION 'Sort order must be non-negative';
    END IF;

    INSERT INTO public.services (
        category_id, name, description, selling_rate_vnd, min_quantity, max_quantity,
        supports_refill, supports_cancel, primary_provider_service_id, sort_order
    )
    VALUES (
        p_category_id, btrim(p_name), p_description, p_selling_rate_vnd, p_min_quantity, p_max_quantity,
        p_supports_refill, p_supports_cancel, p_primary_provider_service_id, p_sort_order
    )
    RETURNING * INTO v_service;

    RETURN v_service;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_service(uuid, text, text, numeric, integer, integer, boolean, boolean, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_service(uuid, text, text, numeric, integer, integer, boolean, boolean, uuid, integer) TO authenticated;

DROP FUNCTION IF EXISTS public.admin_update_service(
    uuid,
    uuid,
    text,
    text,
    bigint,
    integer,
    integer,
    boolean,
    boolean,
    uuid,
    boolean,
    integer
);

CREATE FUNCTION public.admin_update_service(
    p_service_id uuid,
    p_category_id uuid,
    p_name text,
    p_description text,
    p_selling_rate_vnd numeric(20,8),
    p_min_quantity integer,
    p_max_quantity integer,
    p_supports_refill boolean,
    p_supports_cancel boolean,
    p_primary_provider_service_id uuid,
    p_is_active boolean,
    p_sort_order integer
)
RETURNS public.services
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_service public.services;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = p_category_id) THEN
        RAISE EXCEPTION 'Category not found';
    END IF;

    IF p_primary_provider_service_id IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM public.provider_services ps
           INNER JOIN public.providers p ON p.id = ps.provider_id
           WHERE ps.id = p_primary_provider_service_id
             AND ps.is_active = true
             AND p.is_active = true
       ) THEN
        RAISE EXCEPTION 'Active provider routing is required';
    END IF;

    IF p_name IS NULL OR btrim(p_name) = '' THEN
        RAISE EXCEPTION 'Service name is required';
    END IF;

    IF p_selling_rate_vnd IS NULL OR p_selling_rate_vnd <= 0 OR p_min_quantity <= 0 OR p_max_quantity < p_min_quantity THEN
        RAISE EXCEPTION 'Invalid service pricing or quantity bounds';
    END IF;

    IF p_sort_order < 0 THEN
        RAISE EXCEPTION 'Sort order must be non-negative';
    END IF;

    UPDATE public.services
    SET
        category_id = p_category_id,
        name = btrim(p_name),
        description = p_description,
        selling_rate_vnd = p_selling_rate_vnd,
        min_quantity = p_min_quantity,
        max_quantity = p_max_quantity,
        supports_refill = p_supports_refill,
        supports_cancel = p_supports_cancel,
        primary_provider_service_id = p_primary_provider_service_id,
        is_active = p_is_active,
        sort_order = p_sort_order,
        updated_at = now()
    WHERE id = p_service_id
    RETURNING * INTO v_service;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service not found';
    END IF;

    RETURN v_service;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_service(uuid, uuid, text, text, numeric, integer, integer, boolean, boolean, uuid, boolean, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_service(uuid, uuid, text, text, numeric, integer, integer, boolean, boolean, uuid, boolean, integer) TO authenticated;

COMMIT;
