-- Initial schema foundation for UnAmShop SMM migration
-- Scope: schema + constraints + RLS foundation only.
-- No business RPCs, no seed data, no remote application.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. profiles
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY,
    full_name text NULL,
    phone text NULL,
    avatar_url text NULL,
    role text NOT NULL DEFAULT 'user',
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin')),
    CONSTRAINT profiles_status_check CHECK (status IN ('active', 'suspended', 'banned')),
    CONSTRAINT profiles_auth_users_fk FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 2. wallets
-- -----------------------------------------------------------------------------
CREATE TABLE public.wallets (
    user_id uuid PRIMARY KEY,
    balance_vnd bigint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT wallets_balance_check CHECK (balance_vnd >= 0),
    CONSTRAINT wallets_profiles_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 3. platforms
-- -----------------------------------------------------------------------------
CREATE TABLE public.platforms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL,
    icon text NULL,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT platforms_name_unique UNIQUE (name),
    CONSTRAINT platforms_slug_unique UNIQUE (slug),
    CONSTRAINT platforms_sort_order_check CHECK (sort_order >= 0)
);

-- -----------------------------------------------------------------------------
-- 4. categories
-- -----------------------------------------------------------------------------
CREATE TABLE public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    icon text NULL,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT categories_platform_fk FOREIGN KEY (platform_id) REFERENCES public.platforms(id) ON DELETE RESTRICT,
    CONSTRAINT categories_platform_slug_unique UNIQUE (platform_id, slug),
    CONSTRAINT categories_sort_order_check CHECK (sort_order >= 0)
);

-- -----------------------------------------------------------------------------
-- 5. providers
-- -----------------------------------------------------------------------------
CREATE TABLE public.providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    base_url text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    priority integer NOT NULL DEFAULT 100,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT providers_priority_check CHECK (priority >= 0)
);

-- -----------------------------------------------------------------------------
-- 6. provider_services
-- -----------------------------------------------------------------------------
CREATE TABLE public.provider_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL,
    provider_service_id text NOT NULL,
    raw_name text NULL,
    provider_rate numeric(20,8) NULL,
    provider_currency varchar(3) NOT NULL,
    min_quantity integer NOT NULL,
    max_quantity integer NOT NULL,
    supports_refill boolean NOT NULL DEFAULT false,
    supports_cancel boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    last_synced_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT provider_services_provider_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE RESTRICT,
    CONSTRAINT provider_services_currency_check CHECK (provider_currency ~ '^[A-Z]{3}$'),
    CONSTRAINT provider_services_provider_id_unique UNIQUE (provider_id, id),
    CONSTRAINT provider_services_provider_service_unique UNIQUE (provider_id, provider_service_id),
    CONSTRAINT provider_services_min_quantity_check CHECK (min_quantity > 0),
    CONSTRAINT provider_services_max_quantity_check CHECK (max_quantity >= min_quantity),
    CONSTRAINT provider_services_rate_check CHECK (provider_rate IS NULL OR provider_rate >= 0)
);

-- -----------------------------------------------------------------------------
-- 7. services
-- -----------------------------------------------------------------------------
CREATE TABLE public.services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL,
    name text NOT NULL,
    description text NULL,
    selling_rate_vnd bigint NOT NULL,
    min_quantity integer NOT NULL,
    max_quantity integer NOT NULL,
    supports_refill boolean NOT NULL DEFAULT false,
    supports_cancel boolean NOT NULL DEFAULT false,
    primary_provider_service_id uuid NULL,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT services_category_fk FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT,
    CONSTRAINT services_provider_service_fk FOREIGN KEY (primary_provider_service_id) REFERENCES public.provider_services(id) ON DELETE SET NULL,
    CONSTRAINT services_rate_check CHECK (selling_rate_vnd >= 0),
    CONSTRAINT services_min_quantity_check CHECK (min_quantity > 0),
    CONSTRAINT services_max_quantity_check CHECK (max_quantity >= min_quantity),
    CONSTRAINT services_sort_order_check CHECK (sort_order >= 0)
);

-- -----------------------------------------------------------------------------
-- 8. orders
-- -----------------------------------------------------------------------------
CREATE TABLE public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    service_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    provider_service_id uuid NOT NULL,
    provider_order_id text NULL,
    link text NOT NULL,
    quantity integer NOT NULL,
    service_name_snapshot text NOT NULL,
    selling_rate_snapshot_vnd bigint NOT NULL,
    charge_vnd bigint NOT NULL,
    refunded_amount_vnd bigint NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'pending',
    provider_status text NULL,
    provider_submit_status text NOT NULL DEFAULT 'not_submitted',
    provider_submit_attempts integer NOT NULL DEFAULT 0,
    last_provider_attempt_at timestamptz NULL,
    next_provider_retry_at timestamptz NULL,
    start_count integer NOT NULL DEFAULT 0,
    remains integer NOT NULL DEFAULT 0,
    provider_error text NULL,
    provider_response jsonb NULL,
    idempotency_key text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz NULL,
    CONSTRAINT orders_user_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE RESTRICT,
    CONSTRAINT orders_service_fk FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE RESTRICT,
    CONSTRAINT orders_provider_fk FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE RESTRICT,
    CONSTRAINT orders_provider_match_fk FOREIGN KEY (provider_id, provider_service_id) REFERENCES public.provider_services(provider_id, id) ON DELETE RESTRICT,
    CONSTRAINT orders_user_idempotency_unique UNIQUE (user_id, idempotency_key),
    CONSTRAINT orders_quantity_check CHECK (quantity > 0),
    CONSTRAINT orders_selling_rate_snapshot_check CHECK (selling_rate_snapshot_vnd >= 0),
    CONSTRAINT orders_charge_check CHECK (charge_vnd >= 0),
    CONSTRAINT orders_refunded_amount_check CHECK (refunded_amount_vnd >= 0),
    CONSTRAINT orders_refunded_cap_check CHECK (refunded_amount_vnd <= charge_vnd),
    CONSTRAINT orders_status_check CHECK (status IN ('pending', 'processing', 'in_progress', 'completed', 'partial', 'cancelled', 'failed')),
    CONSTRAINT orders_provider_submit_status_check CHECK (provider_submit_status IN ('not_submitted', 'submitting', 'submitted', 'retryable_error', 'submission_unknown', 'permanent_failure')),
    CONSTRAINT orders_submit_attempts_check CHECK (provider_submit_attempts >= 0),
    CONSTRAINT orders_start_count_check CHECK (start_count >= 0),
    CONSTRAINT orders_remains_check CHECK (
        remains >= 0
        AND remains <= quantity
    )
);

CREATE UNIQUE INDEX orders_provider_order_partial_unique
    ON public.orders (provider_id, provider_order_id)
    WHERE provider_order_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 9. deposit_requests
-- -----------------------------------------------------------------------------
CREATE TABLE public.deposit_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    amount_vnd bigint NOT NULL,
    payment_method text NOT NULL,
    payment_reference text NULL,
    status text NOT NULL DEFAULT 'pending',
    proof_url text NULL,
    admin_note text NULL,
    approved_by uuid NULL,
    approved_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT deposit_requests_user_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE RESTRICT,
    CONSTRAINT deposit_requests_approved_by_fk FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE RESTRICT,
    CONSTRAINT deposit_requests_amount_check CHECK (amount_vnd > 0),
    CONSTRAINT deposit_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

-- -----------------------------------------------------------------------------
-- 10. wallet_transactions
-- -----------------------------------------------------------------------------
CREATE TABLE public.wallet_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    direction text NOT NULL,
    type text NOT NULL,
    operation_key uuid NOT NULL UNIQUE,
    amount_vnd bigint NOT NULL,
    balance_before_vnd bigint NOT NULL,
    balance_after_vnd bigint NOT NULL,
    order_id uuid NULL,
    deposit_request_id uuid NULL,
    created_by uuid NULL,
    description text NOT NULL,
    metadata jsonb NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT wallet_transactions_user_fk FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE RESTRICT,
    CONSTRAINT wallet_transactions_order_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT,
    CONSTRAINT wallet_transactions_deposit_request_fk FOREIGN KEY (deposit_request_id) REFERENCES public.deposit_requests(id) ON DELETE RESTRICT,
    CONSTRAINT wallet_transactions_created_by_fk FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT,
    CONSTRAINT wallet_transactions_direction_check CHECK (direction IN ('credit', 'debit')),
    CONSTRAINT wallet_transactions_type_check CHECK (type IN ('deposit', 'order', 'refund', 'admin_adjustment')),
    CONSTRAINT wallet_transactions_amount_check CHECK (amount_vnd > 0),
    CONSTRAINT wallet_transactions_balance_before_check CHECK (balance_before_vnd >= 0),
    CONSTRAINT wallet_transactions_balance_after_check CHECK (balance_after_vnd >= 0),
    CONSTRAINT wallet_transactions_balance_math_check CHECK (
        (
            direction = 'credit'
            AND balance_after_vnd = balance_before_vnd + amount_vnd
        )
        OR
        (
            direction = 'debit'
            AND balance_after_vnd = balance_before_vnd - amount_vnd
        )
    ),
    CONSTRAINT wallet_transactions_order_type_check CHECK (
        (type = 'order' AND direction = 'debit' AND order_id IS NOT NULL AND deposit_request_id IS NULL)
        OR (type = 'refund' AND direction = 'credit' AND order_id IS NOT NULL AND deposit_request_id IS NULL)
        OR (type = 'deposit' AND direction = 'credit' AND deposit_request_id IS NOT NULL AND order_id IS NULL)
        OR (type = 'admin_adjustment' AND direction IN ('credit', 'debit') AND order_id IS NULL AND deposit_request_id IS NULL)
    )
);

-- -----------------------------------------------------------------------------
-- 11. updated_at trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER wallets_set_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER platforms_set_updated_at
BEFORE UPDATE ON public.platforms
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER categories_set_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER providers_set_updated_at
BEFORE UPDATE ON public.providers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER provider_services_set_updated_at
BEFORE UPDATE ON public.provider_services
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER services_set_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER deposit_requests_set_updated_at
BEFORE UPDATE ON public.deposit_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 12. immutable ledger guard
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_wallet_transaction_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    RAISE EXCEPTION 'wallet_transactions is immutable and cannot be updated or deleted';
END;
$$;

CREATE TRIGGER wallet_transactions_protect_mutation
BEFORE UPDATE OR DELETE ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.prevent_wallet_transaction_mutation();

-- -----------------------------------------------------------------------------
-- 13. admin authorization helper
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
          AND p.status = 'active'
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- -----------------------------------------------------------------------------
-- 14. Enable RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 15. RLS policies
-- -----------------------------------------------------------------------------

-- profiles
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_select_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "profiles_no_insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "profiles_no_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "profiles_no_delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (false);

-- wallets
CREATE POLICY "wallets_select_own"
ON public.wallets
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "wallets_select_admin"
ON public.wallets
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "wallets_no_insert"
ON public.wallets
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "wallets_no_update"
ON public.wallets
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "wallets_no_delete"
ON public.wallets
FOR DELETE
TO authenticated
USING (false);

-- wallet_transactions
CREATE POLICY "wallet_transactions_select_own"
ON public.wallet_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "wallet_transactions_select_admin"
ON public.wallet_transactions
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "wallet_transactions_no_insert"
ON public.wallet_transactions
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "wallet_transactions_no_update"
ON public.wallet_transactions
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "wallet_transactions_no_delete"
ON public.wallet_transactions
FOR DELETE
TO authenticated
USING (false);

-- platforms
CREATE POLICY "platforms_select_active"
ON public.platforms
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "platforms_select_admin"
ON public.platforms
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "platforms_no_write"
ON public.platforms
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- categories
CREATE POLICY "categories_select_active"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (
    is_active = true
    AND EXISTS (
        SELECT 1
        FROM public.platforms p
        WHERE p.id = public.categories.platform_id
          AND p.is_active = true
    )
);

CREATE POLICY "categories_select_admin"
ON public.categories
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "categories_no_write"
ON public.categories
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- providers
CREATE POLICY "providers_select_admin"
ON public.providers
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "providers_no_customer_access"
ON public.providers
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- provider_services
CREATE POLICY "provider_services_select_admin"
ON public.provider_services
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "provider_services_no_customer_access"
ON public.provider_services
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- services
CREATE POLICY "services_select_admin"
ON public.services
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "services_no_write"
ON public.services
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- orders
CREATE POLICY "orders_select_own"
ON public.orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "orders_select_admin"
ON public.orders
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "orders_no_insert"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "orders_no_update"
ON public.orders
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "orders_no_delete"
ON public.orders
FOR DELETE
TO authenticated
USING (false);

-- deposit_requests
CREATE POLICY "deposit_requests_select_own"
ON public.deposit_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "deposit_requests_select_admin"
ON public.deposit_requests
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "deposit_requests_no_insert"
ON public.deposit_requests
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "deposit_requests_no_update"
ON public.deposit_requests
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "deposit_requests_no_delete"
ON public.deposit_requests
FOR DELETE
TO authenticated
USING (false);

-- -----------------------------------------------------------------------------
-- 16. Operational indexes
-- -----------------------------------------------------------------------------
CREATE INDEX orders_user_created_at_idx
    ON public.orders (user_id, created_at DESC);

CREATE INDEX orders_status_created_at_idx
    ON public.orders (status, created_at DESC);

CREATE INDEX orders_service_status_idx
    ON public.orders (service_id, status);

CREATE INDEX orders_provider_service_status_idx
    ON public.orders (provider_service_id, status);

CREATE INDEX wallet_transactions_user_created_at_idx
    ON public.wallet_transactions (user_id, created_at DESC);

CREATE INDEX wallet_transactions_order_idx
    ON public.wallet_transactions (order_id)
    WHERE order_id IS NOT NULL;

CREATE INDEX wallet_transactions_deposit_request_idx
    ON public.wallet_transactions (deposit_request_id)
    WHERE deposit_request_id IS NOT NULL;

CREATE INDEX services_category_active_sort_idx
    ON public.services (category_id, is_active, sort_order);

CREATE INDEX services_active_sort_idx
    ON public.services (is_active, sort_order);

CREATE INDEX categories_platform_active_sort_idx
    ON public.categories (platform_id, is_active, sort_order);

CREATE INDEX provider_services_provider_active_idx
    ON public.provider_services (provider_id, is_active);

CREATE INDEX deposit_requests_user_created_at_idx
    ON public.deposit_requests (user_id, created_at DESC);

CREATE INDEX deposit_requests_status_created_at_idx
    ON public.deposit_requests (status, created_at DESC);

COMMIT;
