# provider-orders Edge Function

This function is an internal M7 worker for provider submission and status sync.
It must not be called by the browser.

Required Supabase Edge Function secrets:

- `SUPABASE_URL` (provided by the Supabase runtime)
- `SUPABASE_SERVICE_ROLE_KEY` (provided by the Supabase runtime)
- `M7_INTERNAL_TOKEN` (deployment-specific internal invocation token)
- `SMM_PROVIDER_API_URL` (deployment-specific provider API URL)
- `SMM_PROVIDER_API_KEY` (deployment-specific provider API key)

No provider values belong in Vite environment variables, frontend code, or customer-readable tables.

The function uses an internal bearer token and should be deployed with platform JWT verification disabled only if the caller cannot provide a Supabase JWT. The function then enforces `M7_INTERNAL_TOKEN` itself:

```text
supabase functions deploy provider-orders --no-verify-jwt
supabase secrets set M7_INTERNAL_TOKEN=<deployment-value> SMM_PROVIDER_API_URL=<deployment-value> SMM_PROVIDER_API_KEY=<deployment-value>
```

Do not run these commands until the M7 deployment review is approved.
