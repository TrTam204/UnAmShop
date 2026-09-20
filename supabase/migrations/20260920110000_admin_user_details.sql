BEGIN;

CREATE OR REPLACE FUNCTION public.admin_update_profile_details(
    p_user_id uuid,
    p_full_name text
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_trimmed_name text;
    v_profile public.profiles;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User id is required';
    END IF;

    v_trimmed_name := btrim(p_full_name);

    IF v_trimmed_name = '' OR length(v_trimmed_name) > 120 THEN
        RAISE EXCEPTION 'Full name must be between 1 and 120 characters';
    END IF;

    UPDATE public.profiles
    SET
        full_name = v_trimmed_name,
        updated_at = now()
    WHERE id = p_user_id
    RETURNING * INTO v_profile;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_profile_details(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_profile_details(uuid, text) TO authenticated;

COMMIT;
