import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

type ProviderResponse = Record<string, unknown>;
type OrderRecord = Record<string, unknown>;

type ProviderRequestResult = {
  httpStatus: number;
  body: ProviderResponse;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const internalToken = Deno.env.get('M7_INTERNAL_TOKEN');
const providerApiUrl = Deno.env.get('SMM_PROVIDER_API_URL');
const providerApiKey = Deno.env.get('SMM_PROVIDER_API_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const sanitizeText = (value: string) => {
  let sanitized = value;

  if (providerApiKey) {
    sanitized = sanitized.split(providerApiKey).join('[REDACTED_API_KEY]');
  }

  sanitized = sanitized
    .replace(/(authorization\s*:\s*bearer\s+)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/([?&](?:key|api_key|token|authorization)=)[^&\s]+/gi, '$1[REDACTED]');

  return sanitized.slice(0, 2000);
};

const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return sanitizeText(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        key,
        sanitizeValue(child),
      ]),
    );
  }

  return value;
};

const sanitizeResponse = (result: ProviderRequestResult) => ({
  http_status: result.httpStatus,
  response: sanitizeValue(result.body),
});

const providerErrorText = (body: ProviderResponse) => {
  const value = body.error ?? body.message ?? body.msg ?? 'Provider rejected the request';
  return sanitizeText(String(value));
};

const isTemporaryRejection = (httpStatus: number, message: string) =>
  httpStatus === 429 ||
  /temporar|try again|rate limit|maintenance|busy|unavailable/i.test(message);

const nextRetryAt = (attempts: number) => {
  const delayMs = Math.min(60 * 60 * 1000, 30 * 1000 * 2 ** Math.max(0, attempts - 1));
  return new Date(Date.now() + delayMs).toISOString();
};

const providerRequest = async (
  action: 'add' | 'status',
  parameters: Record<string, unknown>,
): Promise<ProviderRequestResult> => {
  if (!providerApiUrl || !providerApiKey) {
    throw new Error('SMM provider secrets are not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(providerApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: providerApiKey,
        action,
        ...parameters,
      }),
      signal: controller.signal,
    });

    const rawBody = await response.text();
    let body: ProviderResponse;

    try {
      body = JSON.parse(rawBody) as ProviderResponse;
    } catch {
      throw Object.assign(new Error('Provider returned invalid or truncated JSON'), {
        ambiguous: true,
        response: { httpStatus: response.status, body: { raw: sanitizeText(rawBody) } },
      });
    }

    return { httpStatus: response.status, body };
  } catch (error) {
    if (error instanceof Error && 'response' in error) {
      throw error;
    }

    throw Object.assign(new Error('Provider network failure; remote acceptance is unknown'), {
      ambiguous: true,
      cause: error instanceof Error ? sanitizeText(error.message) : 'unknown network error',
    });
  } finally {
    clearTimeout(timeout);
  }
};

const loadProviderService = async (providerServiceId: string) => {
  const { data: providerService, error: providerServiceError } = await admin
    .from('provider_services')
    .select('id, provider_id, provider_service_id, is_active')
    .eq('id', providerServiceId)
    .single();

  if (providerServiceError) {
    throw Object.assign(new Error('Provider service lookup failed'), {
      kind: 'transient',
    });
  }

  if (!providerService?.is_active) {
    throw Object.assign(new Error('Provider service is unavailable'), {
      kind: 'permanent',
    });
  }

  const { data: provider, error: providerError } = await admin
    .from('providers')
    .select('id, is_active')
    .eq('id', providerService.provider_id)
    .single();

  if (providerError) {
    throw Object.assign(new Error('Provider lookup failed'), {
      kind: 'transient',
    });
  }

  if (!provider?.is_active) {
    throw Object.assign(new Error('Provider is unavailable'), {
      kind: 'permanent',
    });
  }

  return providerService;
};

const rpc = async <T>(name: string, args: Record<string, unknown>) => {
  const { data, error } = await admin.rpc(name, args);
  if (error) {
    throw error;
  }
  return data as T;
};

const submitOrder = async (orderId: string) => {
  if (!providerApiUrl || !providerApiKey) {
    return json({ error: 'SMM provider secrets are not configured' }, 503);
  }

  let order: OrderRecord;

  try {
    order = await rpc<OrderRecord>('claim_order_for_submission', {
      p_order_id: orderId,
    });
  } catch (error) {
    return json({ error: sanitizeText(error instanceof Error ? error.message : String(error)) }, 409);
  }

  let providerService: Record<string, unknown>;
  try {
    providerService = await loadProviderService(String(order.provider_service_id));
  } catch (error) {
    const kind = (error as { kind?: string }).kind;
    const retryable = kind !== 'permanent';
    const status = retryable ? 'retryable_error' : 'permanent_failure';
    const message = sanitizeText(error instanceof Error ? error.message : String(error));

    try {
      await rpc('mark_order_submission_error', {
        p_order_id: order.id,
        p_provider_submit_status: status,
        p_provider_error: message,
        p_next_provider_retry_at: retryable ? nextRetryAt(Number(order.provider_submit_attempts)) : null,
        p_provider_response: null,
      });
    } catch {
      return json({ error: 'Could not record provider routing failure' }, 500);
    }

    return json({ error: message, provider_submit_status: status }, retryable ? 503 : 422);
  }

  let result: ProviderRequestResult;
  let providerOrderId: string;

  try {
    result = await providerRequest('add', {
      service: providerService.provider_service_id,
      link: order.link,
      quantity: order.quantity,
    });

    if (result.httpStatus >= 500) {
      throw Object.assign(new Error('Provider server error; remote acceptance is unknown'), {
        ambiguous: true,
        response: result,
      });
    }

    if (result.body.error || result.body.message === 'error') {
      const message = providerErrorText(result.body);
      const retryable = isTemporaryRejection(result.httpStatus, message);
      const status = retryable ? 'retryable_error' : 'permanent_failure';
      try {
        await rpc('mark_order_submission_error', {
          p_order_id: order.id,
          p_provider_submit_status: status,
          p_provider_error: message,
          p_next_provider_retry_at: retryable ? nextRetryAt(Number(order.provider_submit_attempts)) : null,
          p_provider_response: sanitizeResponse(result),
        });
      } catch {
        return json({ error: 'Could not record provider rejection' }, 500);
      }
      return json({ error: message, provider_submit_status: status }, retryable ? 503 : 422);
    }

    const rawProviderOrderId = result.body.order;
    if (rawProviderOrderId === undefined || rawProviderOrderId === null || String(rawProviderOrderId).trim() === '') {
      throw Object.assign(new Error('Provider response did not contain a valid order id'), {
        ambiguous: true,
        response: result,
      });
    }
    providerOrderId = String(rawProviderOrderId).trim();
  } catch (error) {
    const ambiguous = Boolean((error as { ambiguous?: boolean }).ambiguous);
    const message = sanitizeText(error instanceof Error ? error.message : String(error));
    const providerResponse = (error as { response?: ProviderRequestResult }).response;

    try {
      await rpc('mark_order_submission_error', {
        p_order_id: order.id,
        p_provider_submit_status: ambiguous ? 'submission_unknown' : 'permanent_failure',
        p_provider_error: message,
        p_next_provider_retry_at: null,
        p_provider_response: providerResponse ? sanitizeResponse(providerResponse) : null,
      });
    } catch {
      return json({ error: 'Could not record provider submission failure' }, 500);
    }

    return json(
      {
        error: message,
        provider_submit_status: ambiguous ? 'submission_unknown' : 'permanent_failure',
      },
      ambiguous ? 502 : 422,
    );
  }

  const completionArgs = {
    p_order_id: order.id,
    p_provider_order_id: providerOrderId,
    p_provider_status: typeof result.body.status === 'string' ? result.body.status : null,
    p_provider_response: sanitizeResponse(result),
  };

  try {
    const updated = await rpc<OrderRecord>('complete_order_submission', completionArgs);
    return json({ order: updated });
  } catch {
    try {
      const updated = await rpc<OrderRecord>('complete_order_submission', completionArgs);
      return json({ order: updated });
    } catch (error) {
      return json({
        error: sanitizeText(error instanceof Error ? error.message : String(error)),
        message: 'Provider order exists; database completion requires reconciliation',
      }, 500);
    }
  }
};

const mapProviderStatus = (value: unknown): string | null => {
  switch (String(value ?? '').toLowerCase()) {
    case 'pending':
      return 'pending';
    case 'processing':
      return 'processing';
    case 'in progress':
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'partial':
      return 'partial';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'failed':
    case 'failure':
      return 'failed';
    default:
      return null;
  }
};

const syncOneOrder = async (order: OrderRecord) => {
  const providerService = await loadProviderService(String(order.provider_service_id));

  try {
    const result = await providerRequest('status', {
      order: order.provider_order_id,
    });

    if (result.httpStatus < 200 || result.httpStatus >= 300) {
      const message = result.body.error
        ? providerErrorText(result.body)
        : `Provider status request failed with HTTP ${result.httpStatus}`;
      return rpc('update_order_provider_status', {
        p_order_id: order.id,
        p_provider_status: order.provider_status ?? null,
        p_order_status: null,
        p_provider_response: sanitizeResponse(result),
        p_provider_error: message,
      });
    }

    if (result.body.error || result.body.message === 'error') {
      const message = providerErrorText(result.body);
      return rpc('update_order_provider_status', {
        p_order_id: order.id,
        p_provider_status: order.provider_status ?? null,
        p_order_status: null,
        p_provider_response: sanitizeResponse(result),
        p_provider_error: message,
      });
    }

    const mappedStatus = mapProviderStatus(result.body.status);
    const rawStartCount = Number(result.body.start_count);
    const rawRemains = Number(result.body.remains);
    const startCount = Number.isInteger(rawStartCount) && rawStartCount >= 0 ? rawStartCount : null;
    const remains = Number.isInteger(rawRemains) && rawRemains >= 0 && rawRemains <= Number(order.quantity)
      ? rawRemains
      : null;

    return rpc('update_order_provider_status', {
      p_order_id: order.id,
      p_provider_status: String(result.body.status ?? ''),
      p_order_status: mappedStatus,
      p_start_count: startCount,
      p_remains: remains,
      p_provider_response: sanitizeResponse(result),
      p_provider_error: null,
      p_completed_at: mappedStatus === 'completed' ? new Date().toISOString() : null,
    });
  } catch (error) {
    const providerResponse = (error as { response?: ProviderRequestResult }).response;
    return rpc('update_order_provider_status', {
      p_order_id: order.id,
      p_provider_status: order.provider_status ?? null,
      p_order_status: null,
      p_provider_response: providerResponse ? sanitizeResponse(providerResponse) : null,
      p_provider_error: sanitizeText(error instanceof Error ? error.message : String(error)),
    });
  }
};

const syncStatuses = async (orderId?: string) => {
  let orders: OrderRecord[];

  if (orderId) {
    const { data, error } = await admin
      .from('orders')
      .select('id, provider_service_id, provider_order_id, provider_status, quantity')
      .eq('id', orderId)
      .eq('provider_submit_status', 'submitted')
      .not('provider_order_id', 'is', null)
      .single();

    if (error || !data) {
      return json({ error: 'Submitted order not found' }, 404);
    }
    orders = [data];
  } else {
    const { data, error } = await admin
      .from('orders')
      .select('id, provider_service_id, provider_order_id, provider_status, quantity')
      .eq('provider_submit_status', 'submitted')
      .in('status', ['pending', 'processing', 'in_progress'])
      .not('provider_order_id', 'is', null)
      .order('updated_at', { ascending: true })
      .limit(50);

    if (error) {
      throw error;
    }
    orders = data ?? [];
  }

  const results = [];
  for (const order of orders) {
    try {
      results.push(await syncOneOrder(order));
    } catch (error) {
      results.push({
        id: order.id,
        error: sanitizeText(error instanceof Error ? error.message : String(error)),
      });
    }
  }

  return json({ count: results.length, results });
};

const authorize = (request: Request) => {
  if (!internalToken) {
    throw new Error('M7_INTERNAL_TOKEN is not configured');
  }

  const authorization = request.headers.get('Authorization');
  if (authorization !== `Bearer ${internalToken}`) {
    throw new Error('Unauthorized');
  }
};

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    authorize(request);
    const body = await request.json() as { action?: string; order_id?: string };

    if (body.action === 'submit') {
      if (!body.order_id) {
        return json({ error: 'order_id is required' }, 400);
      }
      return await submitOrder(body.order_id);
    }

    if (body.action === 'sync-status') {
      return await syncStatuses(body.order_id);
    }

    return json({ error: 'Unsupported action' }, 400);
  } catch (error) {
    const message = sanitizeText(error instanceof Error ? error.message : String(error));
    return json({ error: message }, message === 'Unauthorized' ? 401 : 500);
  }
});
