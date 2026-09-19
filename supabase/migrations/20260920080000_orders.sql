-- Secure order and refund foundation for M6
-- Scope: atomic order creation and admin refunds only.
-- No provider HTTP calls, frontend auth cutover, or legacy backend changes.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Create an order and debit the wallet atomically
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order(
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
    selling_rate_snapshot_vnd bigint,
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

    v_charge_vnd := CEIL(
        (v_service.selling_rate_vnd::numeric * p_quantity::numeric) / 1000
    )::bigint;

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

        RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(uuid, text, integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_order(uuid, text, integer, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_order(uuid, text, integer, text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. Refund an order atomically without changing fulfillment status
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refund_order(
    p_order_id uuid,
    p_amount_vnd bigint,
    p_operation_key uuid
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_order public.orders;
    v_existing_transaction public.wallet_transactions;
    v_balance_before bigint;
    v_balance_after bigint;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF p_order_id IS NULL THEN
        RAISE EXCEPTION 'Order is required';
    END IF;

    IF p_amount_vnd IS NULL OR p_amount_vnd <= 0 THEN
        RAISE EXCEPTION 'Refund amount must be greater than zero';
    END IF;

    IF p_operation_key IS NULL THEN
        RAISE EXCEPTION 'Operation key is required';
    END IF;

    SELECT o.*
    INTO v_order
    FROM public.orders o
    WHERE o.id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    SELECT wt.*
    INTO v_existing_transaction
    FROM public.wallet_transactions wt
    WHERE wt.operation_key = p_operation_key
    FOR UPDATE;

    IF FOUND THEN
        IF v_existing_transaction.type = 'refund'
           AND v_existing_transaction.order_id = p_order_id
           AND v_existing_transaction.amount_vnd = p_amount_vnd THEN
            RETURN v_order;
        END IF;

        RAISE EXCEPTION 'Operation key has already been used with different refund parameters';
    END IF;

    IF p_amount_vnd > v_order.charge_vnd - v_order.refunded_amount_vnd THEN
        RAISE EXCEPTION 'Refund exceeds the remaining refundable amount';
    END IF;

    SELECT w.balance_vnd
    INTO v_balance_before
    FROM public.wallets w
    WHERE w.user_id = v_order.user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    v_balance_after := v_balance_before + p_amount_vnd;

    UPDATE public.wallets
    SET
        balance_vnd = v_balance_after,
        updated_at = now()
    WHERE user_id = v_order.user_id;

    INSERT INTO public.wallet_transactions (
        user_id,
        direction,
        type,
        operation_key,
        amount_vnd,
        balance_before_vnd,
        balance_after_vnd,
        order_id,
        created_by,
        description
    )
    VALUES (
        v_order.user_id,
        'credit',
        'refund',
        p_operation_key,
        p_amount_vnd,
        v_balance_before,
        v_balance_after,
        v_order.id,
        auth.uid(),
        'Order refund'
    );

    UPDATE public.orders
    SET
        refunded_amount_vnd = refunded_amount_vnd + p_amount_vnd,
        updated_at = now()
    WHERE id = v_order.id;

    SELECT o.*
    INTO v_order
    FROM public.orders o
    WHERE o.id = v_order.id;

    RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.refund_order(uuid, bigint, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refund_order(uuid, bigint, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.refund_order(uuid, bigint, uuid) TO authenticated;

COMMIT;
