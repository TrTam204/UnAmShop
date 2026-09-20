-- Provider orchestration state transitions for M7
-- Scope: internal service-role RPCs only. No provider HTTP calls occur in SQL.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Claim one order before an outbound provider submission
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_order_for_submission(
    p_order_id uuid
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_order public.orders;
BEGIN
    SELECT o.*
    INTO v_order
    FROM public.orders o
    WHERE o.id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.provider_order_id IS NOT NULL THEN
        RAISE EXCEPTION 'Order already has a provider order id';
    END IF;

    IF NOT (
        v_order.provider_submit_status = 'not_submitted'
        OR (
            v_order.provider_submit_status = 'retryable_error'
            AND (
                v_order.next_provider_retry_at IS NULL
                OR v_order.next_provider_retry_at <= now()
            )
        )
    ) THEN
        RAISE EXCEPTION 'Order is not eligible for provider submission';
    END IF;

    UPDATE public.orders
    SET
        provider_submit_status = 'submitting',
        provider_submit_attempts = provider_submit_attempts + 1,
        last_provider_attempt_at = now(),
        next_provider_retry_at = NULL,
        provider_error = NULL,
        updated_at = now()
    WHERE id = v_order.id;

    SELECT o.*
    INTO v_order
    FROM public.orders o
    WHERE o.id = v_order.id;

    RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_order_for_submission(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_order_for_submission(uuid) TO service_role;

-- -----------------------------------------------------------------------------
-- 2. Complete a provider submission with a confirmed remote order id
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_order_submission(
    p_order_id uuid,
    p_provider_order_id text,
    p_provider_status text DEFAULT NULL,
    p_provider_response jsonb DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_order public.orders;
BEGIN
    IF p_provider_order_id IS NULL OR btrim(p_provider_order_id) = '' THEN
        RAISE EXCEPTION 'Provider order id is required';
    END IF;

    SELECT o.*
    INTO v_order
    FROM public.orders o
    WHERE o.id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.provider_submit_status = 'submitted' THEN
        IF v_order.provider_order_id = btrim(p_provider_order_id) THEN
            RETURN v_order;
        END IF;

        RAISE EXCEPTION 'Order is already submitted with a different provider order id';
    END IF;

    IF v_order.provider_submit_status <> 'submitting' THEN
        RAISE EXCEPTION 'Order is not awaiting provider submission';
    END IF;

    UPDATE public.orders
    SET
        provider_order_id = btrim(p_provider_order_id),
        provider_submit_status = 'submitted',
        provider_status = p_provider_status,
        provider_response = p_provider_response,
        provider_error = NULL,
        next_provider_retry_at = NULL,
        updated_at = now()
    WHERE id = v_order.id;

    SELECT o.*
    INTO v_order
    FROM public.orders o
    WHERE o.id = v_order.id;

    RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_order_submission(uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_order_submission(uuid, text, text, jsonb) TO service_role;

-- -----------------------------------------------------------------------------
-- 3. Record a known or uncertain provider submission failure
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_order_submission_error(
    p_order_id uuid,
    p_provider_submit_status text,
    p_provider_error text,
    p_next_provider_retry_at timestamptz DEFAULT NULL,
    p_provider_response jsonb DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_order public.orders;
BEGIN
    IF p_provider_submit_status NOT IN (
        'retryable_error',
        'submission_unknown',
        'permanent_failure'
    ) THEN
        RAISE EXCEPTION 'Invalid provider submission failure state';
    END IF;

    IF p_provider_submit_status <> 'retryable_error'
       AND p_next_provider_retry_at IS NOT NULL THEN
        RAISE EXCEPTION 'Only retryable errors may have a retry time';
    END IF;

    SELECT o.*
    INTO v_order
    FROM public.orders o
    WHERE o.id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.provider_submit_status <> 'submitting' THEN
        RAISE EXCEPTION 'Order is not awaiting provider submission';
    END IF;

    UPDATE public.orders
    SET
        provider_submit_status = p_provider_submit_status,
        provider_error = p_provider_error,
        provider_response = p_provider_response,
        next_provider_retry_at = p_next_provider_retry_at,
        updated_at = now()
    WHERE id = v_order.id;

    SELECT o.*
    INTO v_order
    FROM public.orders o
    WHERE o.id = v_order.id;

    RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_order_submission_error(uuid, text, text, timestamptz, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_order_submission_error(uuid, text, text, timestamptz, jsonb) TO service_role;

-- -----------------------------------------------------------------------------
-- 4. Apply a provider status update without touching wallet state
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_order_provider_status(
    p_order_id uuid,
    p_provider_status text,
    p_order_status text DEFAULT NULL,
    p_start_count integer DEFAULT NULL,
    p_remains integer DEFAULT NULL,
    p_provider_response jsonb DEFAULT NULL,
    p_provider_error text DEFAULT NULL,
    p_completed_at timestamptz DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_order public.orders;
BEGIN
    IF p_order_status IS NOT NULL
       AND p_order_status NOT IN (
           'pending',
           'processing',
           'in_progress',
           'completed',
           'partial',
           'cancelled',
           'failed'
       ) THEN
        RAISE EXCEPTION 'Invalid order status';
    END IF;

    IF p_start_count IS NOT NULL AND p_start_count < 0 THEN
        RAISE EXCEPTION 'Invalid start count';
    END IF;

    SELECT o.*
    INTO v_order
    FROM public.orders o
    WHERE o.id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.provider_submit_status <> 'submitted'
       OR v_order.provider_order_id IS NULL THEN
        RAISE EXCEPTION 'Order is not submitted to a provider';
    END IF;

    IF p_remains IS NOT NULL
       AND (p_remains < 0 OR p_remains > v_order.quantity) THEN
        RAISE EXCEPTION 'Invalid remaining quantity';
    END IF;

    UPDATE public.orders
    SET
        provider_status = p_provider_status,
        status = COALESCE(p_order_status, status),
        start_count = COALESCE(p_start_count, start_count),
        remains = COALESCE(p_remains, remains),
        provider_response = COALESCE(p_provider_response, provider_response),
        provider_error = p_provider_error,
        completed_at = CASE
            WHEN p_order_status = 'completed' THEN COALESCE(p_completed_at, now())
            ELSE completed_at
        END,
        updated_at = now()
    WHERE id = v_order.id;

    SELECT o.*
    INTO v_order
    FROM public.orders o
    WHERE o.id = v_order.id;

    RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.update_order_provider_status(uuid, text, text, integer, integer, jsonb, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_provider_status(uuid, text, text, integer, integer, jsonb, text, timestamptz) TO service_role;

COMMIT;
