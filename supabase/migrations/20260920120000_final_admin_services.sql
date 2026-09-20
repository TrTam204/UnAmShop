BEGIN;

CREATE FUNCTION public.admin_list_services(
    p_search text DEFAULT NULL,
    p_limit integer DEFAULT 100,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    category_id uuid,
    category_name text,
    platform_name text,
    name text,
    description text,
    selling_rate_vnd numeric(20,8),
    min_quantity integer,
    max_quantity integer,
    supports_refill boolean,
    supports_cancel boolean,
    primary_provider_service_id uuid,
    is_active boolean,
    sort_order integer,
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

    IF p_limit IS NULL OR p_limit < 1 OR p_limit > 200 THEN
        RAISE EXCEPTION 'Limit must be between 1 and 200';
    END IF;

    IF p_offset IS NULL OR p_offset < 0 THEN
        RAISE EXCEPTION 'Offset must be non-negative';
    END IF;

    RETURN QUERY
    SELECT
        s.id,
        s.category_id,
        c.name,
        p.name,
        s.name,
        s.description,
        s.selling_rate_vnd,
        s.min_quantity,
        s.max_quantity,
        s.supports_refill,
        s.supports_cancel,
        s.primary_provider_service_id,
        s.is_active,
        s.sort_order,
        s.created_at,
        s.updated_at
    FROM public.services s
    INNER JOIN public.categories c ON c.id = s.category_id
    INNER JOIN public.platforms p ON p.id = c.platform_id
    WHERE p_search IS NULL
       OR s.name ILIKE '%' || p_search || '%'
       OR COALESCE(s.description, '') ILIKE '%' || p_search || '%'
       OR c.name ILIKE '%' || p_search || '%'
       OR p.name ILIKE '%' || p_search || '%'
    ORDER BY p.sort_order, p.name, c.sort_order, c.name, s.sort_order, s.name, s.id
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_services(text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_services(text, integer, integer) TO authenticated;

COMMIT;
