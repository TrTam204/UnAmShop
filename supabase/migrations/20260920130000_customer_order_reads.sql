DROP FUNCTION IF EXISTS public.get_my_orders(text, integer, integer);

CREATE FUNCTION public.get_my_orders(
    p_status text DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    service_id uuid,
    service_name_snapshot text,
    link text,
    quantity integer,
    selling_rate_snapshot_vnd numeric,
    charge_vnd bigint,
    refunded_amount_vnd bigint,
    status text,
    provider_status text,
    created_at timestamptz,
    updated_at timestamptz,
    completed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
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
        o.service_id,
        o.service_name_snapshot,
        o.link,
        o.quantity,
        o.selling_rate_snapshot_vnd::numeric,
        o.charge_vnd,
        o.refunded_amount_vnd,
        o.status,
        o.provider_status,
        o.created_at,
        o.updated_at,
        o.completed_at
    FROM public.orders o
    WHERE o.user_id = auth.uid()
      AND (p_status IS NULL OR o.status = p_status)
    ORDER BY o.created_at DESC, o.id DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_orders(text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_orders(text, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_orders(text, integer, integer) TO authenticated;
