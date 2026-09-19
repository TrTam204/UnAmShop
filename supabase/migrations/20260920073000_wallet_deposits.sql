-- Wallet and deposit foundation for M5
-- Scope: secure deposit lifecycle RPCs only.
-- No remote application, frontend auth cutover, order, or provider changes.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Create a pending deposit request for the authenticated user
-- -----------------------------------------------------------------------------
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

    IF p_amount_vnd IS NULL OR p_amount_vnd <= 0 THEN
        RAISE EXCEPTION 'Deposit amount must be greater than zero';
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

-- -----------------------------------------------------------------------------
-- 2. Cancel an own pending deposit request
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_deposit_request(
    p_deposit_request_id uuid
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

    UPDATE public.deposit_requests
    SET
        status = 'cancelled',
        updated_at = now()
    WHERE id = p_deposit_request_id
      AND user_id = auth.uid()
      AND status = 'pending'
    RETURNING * INTO v_deposit_request;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Only an own pending deposit request can be cancelled';
    END IF;

    RETURN v_deposit_request;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_deposit_request(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cancel_deposit_request(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_deposit_request(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. Approve a pending deposit and credit the wallet atomically
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_deposit(
    p_deposit_request_id uuid,
    p_operation_key uuid
)
RETURNS public.deposit_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_deposit_request public.deposit_requests;
    v_balance_before bigint;
    v_balance_after bigint;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF p_operation_key IS NULL THEN
        RAISE EXCEPTION 'Operation key is required';
    END IF;

    SELECT *
    INTO v_deposit_request
    FROM public.deposit_requests
    WHERE id = p_deposit_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deposit request not found';
    END IF;

    IF v_deposit_request.status <> 'pending' THEN
        RAISE EXCEPTION 'Only pending deposit requests can be approved';
    END IF;

    SELECT w.balance_vnd
    INTO v_balance_before
    FROM public.wallets w
    WHERE w.user_id = v_deposit_request.user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    v_balance_after := v_balance_before + v_deposit_request.amount_vnd;

    UPDATE public.wallets
    SET
        balance_vnd = v_balance_after,
        updated_at = now()
    WHERE user_id = v_deposit_request.user_id;

    INSERT INTO public.wallet_transactions (
        user_id,
        direction,
        type,
        operation_key,
        amount_vnd,
        balance_before_vnd,
        balance_after_vnd,
        deposit_request_id,
        created_by,
        description
    )
    VALUES (
        v_deposit_request.user_id,
        'credit',
        'deposit',
        p_operation_key,
        v_deposit_request.amount_vnd,
        v_balance_before,
        v_balance_after,
        v_deposit_request.id,
        auth.uid(),
        'Deposit approved'
    );

    UPDATE public.deposit_requests
    SET
        status = 'approved',
        approved_by = auth.uid(),
        approved_at = now(),
        updated_at = now()
    WHERE id = v_deposit_request.id;

    SELECT *
    INTO v_deposit_request
    FROM public.deposit_requests
    WHERE id = v_deposit_request.id;

    RETURN v_deposit_request;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Deposit approval operation has already been used';
END;
$$;

REVOKE ALL ON FUNCTION public.approve_deposit(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_deposit(uuid, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_deposit(uuid, uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Reject a pending deposit without changing the wallet
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reject_deposit_request(
    p_deposit_request_id uuid,
    p_admin_note text DEFAULT NULL
)
RETURNS public.deposit_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_deposit_request public.deposit_requests;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    UPDATE public.deposit_requests
    SET
        status = 'rejected',
        admin_note = p_admin_note,
        updated_at = now()
    WHERE id = p_deposit_request_id
      AND status = 'pending'
    RETURNING * INTO v_deposit_request;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Only pending deposit requests can be rejected';
    END IF;

    RETURN v_deposit_request;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_deposit_request(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reject_deposit_request(uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reject_deposit_request(uuid, text) TO authenticated;

COMMIT;
