-- Secure admin foundation for M8
-- Scope: admin-only read/mutation RPCs. No auth cutover or remote application.
-- Money mutations are delegated to the existing M5/M6 RPCs.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Admin user listing and role/status control
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_profiles(
    p_search text DEFAULT NULL,
    p_role text DEFAULT NULL,
    p_status text DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    user_id uuid,
    email text,
    full_name text,
    phone text,
    avatar_url text,
    role text,
    status text,
    balance_vnd bigint,
    created_at timestamptz,
    updated_at timestamptz
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
        p.id,
        u.email::text,
        p.full_name,
        p.phone,
        p.avatar_url,
        p.role,
        p.status,
        COALESCE(w.balance_vnd, 0)::bigint,
        p.created_at,
        p.updated_at
    FROM public.profiles p
    INNER JOIN auth.users u ON u.id = p.id
    LEFT JOIN public.wallets w ON w.user_id = p.id
    WHERE (p_search IS NULL OR p_search = ''
        OR u.email ILIKE '%' || p_search || '%'
        OR COALESCE(p.full_name, '') ILIKE '%' || p_search || '%')
      AND (p_role IS NULL OR p.role = p_role)
      AND (p_status IS NULL OR p.status = p_status)
    ORDER BY p.created_at DESC, p.id
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_profiles(text, text, text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles(text, text, text, integer, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_profile_access(
    p_user_id uuid,
    p_role text,
    p_status text
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_profile public.profiles;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF p_role NOT IN ('user', 'admin') THEN
        RAISE EXCEPTION 'Invalid profile role';
    END IF;

    IF p_status NOT IN ('active', 'suspended', 'banned') THEN
        RAISE EXCEPTION 'Invalid profile status';
    END IF;

    IF p_user_id = auth.uid()
       AND (p_role <> 'admin' OR p_status <> 'active') THEN
        RAISE EXCEPTION 'An admin cannot demote or deactivate the current account';
    END IF;

    UPDATE public.profiles
    SET
        role = p_role,
        status = p_status,
        updated_at = now()
    WHERE id = p_user_id
    RETURNING * INTO v_profile;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_profile_access(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_profile_access(uuid, text, text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. Admin catalog mutations
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_create_platform(
    p_name text,
    p_slug text,
    p_icon text DEFAULT NULL,
    p_sort_order integer DEFAULT 0
)
RETURNS public.platforms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_platform public.platforms;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF p_name IS NULL OR btrim(p_name) = '' OR p_slug IS NULL OR btrim(p_slug) = '' THEN
        RAISE EXCEPTION 'Platform name and slug are required';
    END IF;

    IF p_sort_order < 0 THEN
        RAISE EXCEPTION 'Sort order must be non-negative';
    END IF;

    INSERT INTO public.platforms (name, slug, icon, sort_order)
    VALUES (btrim(p_name), lower(btrim(p_slug)), p_icon, p_sort_order)
    RETURNING * INTO v_platform;

    RETURN v_platform;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_platform(text, text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_platform(text, text, text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_platform(
    p_platform_id uuid,
    p_name text,
    p_slug text,
    p_icon text,
    p_sort_order integer,
    p_is_active boolean
)
RETURNS public.platforms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_platform public.platforms;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF p_name IS NULL OR btrim(p_name) = '' OR p_slug IS NULL OR btrim(p_slug) = '' THEN
        RAISE EXCEPTION 'Platform name and slug are required';
    END IF;

    IF p_sort_order < 0 THEN
        RAISE EXCEPTION 'Sort order must be non-negative';
    END IF;

    UPDATE public.platforms
    SET
        name = btrim(p_name),
        slug = lower(btrim(p_slug)),
        icon = p_icon,
        sort_order = p_sort_order,
        is_active = p_is_active,
        updated_at = now()
    WHERE id = p_platform_id
    RETURNING * INTO v_platform;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Platform not found';
    END IF;

    RETURN v_platform;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_platform(uuid, text, text, text, integer, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_platform(uuid, text, text, text, integer, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_create_category(
    p_platform_id uuid,
    p_name text,
    p_slug text,
    p_icon text DEFAULT NULL,
    p_sort_order integer DEFAULT 0
)
RETURNS public.categories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_category public.categories;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.platforms WHERE id = p_platform_id) THEN
        RAISE EXCEPTION 'Platform not found';
    END IF;

    IF p_name IS NULL OR btrim(p_name) = '' OR p_slug IS NULL OR btrim(p_slug) = '' THEN
        RAISE EXCEPTION 'Category name and slug are required';
    END IF;

    IF p_sort_order < 0 THEN
        RAISE EXCEPTION 'Sort order must be non-negative';
    END IF;

    INSERT INTO public.categories (platform_id, name, slug, icon, sort_order)
    VALUES (p_platform_id, btrim(p_name), lower(btrim(p_slug)), p_icon, p_sort_order)
    RETURNING * INTO v_category;

    RETURN v_category;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_category(uuid, text, text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_category(uuid, text, text, text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_category(
    p_category_id uuid,
    p_platform_id uuid,
    p_name text,
    p_slug text,
    p_icon text,
    p_sort_order integer,
    p_is_active boolean
)
RETURNS public.categories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_category public.categories;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.platforms WHERE id = p_platform_id) THEN
        RAISE EXCEPTION 'Platform not found';
    END IF;

    IF p_name IS NULL OR btrim(p_name) = '' OR p_slug IS NULL OR btrim(p_slug) = '' THEN
        RAISE EXCEPTION 'Category name and slug are required';
    END IF;

    IF p_sort_order < 0 THEN
        RAISE EXCEPTION 'Sort order must be non-negative';
    END IF;

    UPDATE public.categories
    SET
        platform_id = p_platform_id,
        name = btrim(p_name),
        slug = lower(btrim(p_slug)),
        icon = p_icon,
        sort_order = p_sort_order,
        is_active = p_is_active,
        updated_at = now()
    WHERE id = p_category_id
    RETURNING * INTO v_category;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Category not found';
    END IF;

    RETURN v_category;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_category(uuid, uuid, text, text, text, integer, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_category(uuid, uuid, text, text, text, integer, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_create_service(
    p_category_id uuid,
    p_name text,
    p_description text,
    p_selling_rate_vnd bigint,
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

    IF p_selling_rate_vnd < 0 OR p_min_quantity <= 0 OR p_max_quantity < p_min_quantity THEN
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

REVOKE ALL ON FUNCTION public.admin_create_service(uuid, text, text, bigint, integer, integer, boolean, boolean, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_service(uuid, text, text, bigint, integer, integer, boolean, boolean, uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_service(
    p_service_id uuid,
    p_category_id uuid,
    p_name text,
    p_description text,
    p_selling_rate_vnd bigint,
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

    IF p_selling_rate_vnd < 0 OR p_min_quantity <= 0 OR p_max_quantity < p_min_quantity THEN
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

REVOKE ALL ON FUNCTION public.admin_update_service(uuid, uuid, text, text, bigint, integer, integer, boolean, boolean, uuid, boolean, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_service(uuid, uuid, text, text, bigint, integer, integer, boolean, boolean, uuid, boolean, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_create_provider(
    p_name text,
    p_base_url text,
    p_priority integer DEFAULT 100
)
RETURNS public.providers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_provider public.providers;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF p_name IS NULL OR btrim(p_name) = '' OR p_base_url IS NULL OR btrim(p_base_url) = '' THEN
        RAISE EXCEPTION 'Provider name and base URL are required';
    END IF;

    IF p_priority < 0 THEN
        RAISE EXCEPTION 'Priority must be non-negative';
    END IF;

    INSERT INTO public.providers (name, base_url, priority)
    VALUES (btrim(p_name), btrim(p_base_url), p_priority)
    RETURNING * INTO v_provider;

    RETURN v_provider;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_provider(text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_provider(text, text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_provider(
    p_provider_id uuid,
    p_name text,
    p_base_url text,
    p_priority integer,
    p_is_active boolean
)
RETURNS public.providers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_provider public.providers;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF p_name IS NULL OR btrim(p_name) = '' OR p_base_url IS NULL OR btrim(p_base_url) = '' THEN
        RAISE EXCEPTION 'Provider name and base URL are required';
    END IF;

    IF p_priority < 0 THEN
        RAISE EXCEPTION 'Priority must be non-negative';
    END IF;

    UPDATE public.providers
    SET
        name = btrim(p_name),
        base_url = btrim(p_base_url),
        priority = p_priority,
        is_active = p_is_active,
        updated_at = now()
    WHERE id = p_provider_id
    RETURNING * INTO v_provider;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Provider not found';
    END IF;

    RETURN v_provider;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_provider(uuid, text, text, integer, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_provider(uuid, text, text, integer, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_create_provider_service(
    p_provider_id uuid,
    p_provider_service_id text,
    p_raw_name text,
    p_provider_rate numeric,
    p_provider_currency varchar(3),
    p_min_quantity integer,
    p_max_quantity integer,
    p_supports_refill boolean,
    p_supports_cancel boolean
)
RETURNS public.provider_services
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_provider_service public.provider_services;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.providers WHERE id = p_provider_id AND is_active = true) THEN
        RAISE EXCEPTION 'Active provider is required';
    END IF;

    IF p_provider_service_id IS NULL OR btrim(p_provider_service_id) = ''
       OR p_provider_currency !~ '^[A-Z]{3}$'
       OR p_provider_rate IS NULL OR p_provider_rate < 0
       OR p_min_quantity <= 0 OR p_max_quantity < p_min_quantity THEN
        RAISE EXCEPTION 'Invalid provider service configuration';
    END IF;

    INSERT INTO public.provider_services (
        provider_id, provider_service_id, raw_name, provider_rate, provider_currency,
        min_quantity, max_quantity, supports_refill, supports_cancel
    )
    VALUES (
        p_provider_id, btrim(p_provider_service_id), p_raw_name, p_provider_rate, p_provider_currency,
        p_min_quantity, p_max_quantity, p_supports_refill, p_supports_cancel
    )
    RETURNING * INTO v_provider_service;

    RETURN v_provider_service;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_provider_service(uuid, text, text, numeric, varchar, integer, integer, boolean, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_provider_service(uuid, text, text, numeric, varchar, integer, integer, boolean, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_provider_service(
    p_provider_service_uuid uuid,
    p_provider_id uuid,
    p_provider_service_id text,
    p_raw_name text,
    p_provider_rate numeric,
    p_provider_currency varchar(3),
    p_min_quantity integer,
    p_max_quantity integer,
    p_supports_refill boolean,
    p_supports_cancel boolean,
    p_is_active boolean
)
RETURNS public.provider_services
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_provider_service public.provider_services;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.providers WHERE id = p_provider_id AND is_active = true) THEN
        RAISE EXCEPTION 'Active provider is required';
    END IF;

    IF p_provider_service_id IS NULL OR btrim(p_provider_service_id) = ''
       OR p_provider_currency !~ '^[A-Z]{3}$'
       OR p_provider_rate IS NULL OR p_provider_rate < 0
       OR p_min_quantity <= 0 OR p_max_quantity < p_min_quantity THEN
        RAISE EXCEPTION 'Invalid provider service configuration';
    END IF;

    UPDATE public.provider_services
    SET
        provider_id = p_provider_id,
        provider_service_id = btrim(p_provider_service_id),
        raw_name = p_raw_name,
        provider_rate = p_provider_rate,
        provider_currency = p_provider_currency,
        min_quantity = p_min_quantity,
        max_quantity = p_max_quantity,
        supports_refill = p_supports_refill,
        supports_cancel = p_supports_cancel,
        is_active = p_is_active,
        updated_at = now()
    WHERE id = p_provider_service_uuid
    RETURNING * INTO v_provider_service;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Provider service not found';
    END IF;

    RETURN v_provider_service;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_provider_service(uuid, uuid, text, text, numeric, varchar, integer, integer, boolean, boolean, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_provider_service(uuid, uuid, text, text, numeric, varchar, integer, integer, boolean, boolean, boolean) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. Admin deposits, orders, and dashboard inspection
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_deposit_requests(
    p_status text DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    email text,
    full_name text,
    amount_vnd bigint,
    payment_method text,
    payment_reference text,
    status text,
    admin_note text,
    approved_by uuid,
    approved_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz
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
        d.id,
        d.user_id,
        u.email::text,
        p.full_name,
        d.amount_vnd,
        d.payment_method,
        d.payment_reference,
        d.status,
        d.admin_note,
        d.approved_by,
        d.approved_at,
        d.created_at,
        d.updated_at
    FROM public.deposit_requests d
    INNER JOIN auth.users u ON u.id = d.user_id
    INNER JOIN public.profiles p ON p.id = d.user_id
    WHERE p_status IS NULL OR d.status = p_status
    ORDER BY d.created_at DESC, d.id
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_deposit_requests(text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_deposit_requests(text, integer, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_orders(
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
    selling_rate_snapshot_vnd bigint,
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

CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    RETURN jsonb_build_object(
        'users', jsonb_build_object(
            'total', (SELECT count(*) FROM public.profiles),
            'active', (SELECT count(*) FROM public.profiles WHERE status = 'active')
        ),
        'orders', jsonb_build_object(
            'total', (SELECT count(*) FROM public.orders),
            'pending', (SELECT count(*) FROM public.orders WHERE status = 'pending'),
            'processing', (SELECT count(*) FROM public.orders WHERE status IN ('processing', 'in_progress')),
            'today', (SELECT count(*) FROM public.orders WHERE created_at >= date_trunc('day', now())),
            'by_status', COALESCE((
                SELECT jsonb_agg(jsonb_build_object('status', status, 'count', count_value) ORDER BY status)
                FROM (
                    SELECT status, count(*) AS count_value
                    FROM public.orders
                    GROUP BY status
                ) grouped_status
            ), '[]'::jsonb)
        ),
        'revenue', jsonb_build_object(
            'total_vnd', COALESCE((SELECT sum(charge_vnd) FROM public.orders WHERE status NOT IN ('cancelled', 'failed')), 0::bigint),
            'today_vnd', COALESCE((SELECT sum(charge_vnd) FROM public.orders WHERE status NOT IN ('cancelled', 'failed') AND created_at >= date_trunc('day', now())), 0::bigint)
        ),
        'services', jsonb_build_object(
            'total', (SELECT count(*) FROM public.services),
            'active', (SELECT count(*) FROM public.services WHERE is_active = true)
        ),
        'deposits', jsonb_build_object(
            'pending', (SELECT count(*) FROM public.deposit_requests WHERE status = 'pending')
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;

COMMIT;
