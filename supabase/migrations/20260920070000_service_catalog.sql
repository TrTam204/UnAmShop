-- Safe customer-facing service catalog for M4
-- Scope: read-only catalog RPC. Provider routing data remains private.
-- No order, wallet, provider orchestration, or admin CRUD changes.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_service_catalog(
    p_platform_slug text DEFAULT NULL,
    p_category_slug text DEFAULT NULL,
    p_search text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    selling_rate_vnd bigint,
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

COMMIT;
