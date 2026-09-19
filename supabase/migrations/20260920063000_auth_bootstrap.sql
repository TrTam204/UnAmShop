-- Supabase Auth foundation for UnAmShop SMM migration
-- Scope: auth user bootstrap and controlled self-profile update only.
-- No remote application, frontend migration, or legacy backend changes.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Bootstrap profile and wallet rows for every new Auth user
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        role,
        status
    )
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'full_name',
        'user',
        'active'
    );

    INSERT INTO public.wallets (
        user_id,
        balance_vnd
    )
    VALUES (
        NEW.id,
        0
    );

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. Controlled self-profile update
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_profile(
    p_full_name text,
    p_phone text,
    p_avatar_url text
)
RETURNS public.profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    UPDATE public.profiles
    SET
        full_name = p_full_name,
        phone = p_phone,
        avatar_url = p_avatar_url
    WHERE id = auth.uid()
      AND status = 'active'
    RETURNING *;
$$;

REVOKE ALL ON FUNCTION public.update_profile(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_profile(text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_profile(text, text, text) TO authenticated;

COMMIT;
