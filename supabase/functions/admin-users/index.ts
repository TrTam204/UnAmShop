import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const getAuthHeader = (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.replace('Bearer ', '').trim();
};

Deno.serve(async (req) => {
  try {
    const token = getAuthHeader(req);
    if (!token) {
      return json({ error: 'Missing bearer token' }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: authUserData, error: authUserError } = await adminClient.auth.getUser();
    if (authUserError || !authUserData.user) {
      return json({ error: 'Invalid session token' }, 401);
    }

    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .select('role, status')
      .eq('id', authUserData.user.id)
      .single();

    if (profileError || !profileData) {
      return json({ error: 'Admin profile not found' }, 403);
    }

    if (profileData.role !== 'admin' || profileData.status !== 'active') {
      return json({ error: 'Admin access required' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const role = body.role === 'admin' ? 'admin' : 'user';
    const status = body.status === 'suspended' || body.status === 'banned' ? body.status : 'active';

    if (!email || !fullName) {
      return json({ error: 'Email and full name are required' }, 400);
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: invitedUser, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
      },
      redirectTo: `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/login`,
    });

    if (inviteError || !invitedUser?.user) {
      return json({ error: inviteError?.message || 'Could not invite user' }, 400);
    }

    const { error: profileUpdateError } = await serviceClient
      .from('profiles')
      .update({
        full_name: fullName,
        role,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitedUser.user.id)
      .select();

    if (profileUpdateError) {
      return json({ error: profileUpdateError.message || 'Could not assign role/status' }, 500);
    }

    return json({
      message: `Đã gửi lời mời tới ${email}`,
      user: {
        id: invitedUser.user.id,
        email,
        full_name: fullName,
        role,
        status,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return json({ error: message }, 500);
  }
});
