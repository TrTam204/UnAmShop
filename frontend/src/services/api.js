import { supabase } from '../lib/supabase';

export const formatWalletBalance = (value) => {
  if (value === null || value === undefined) {
    return '—';
  }

  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(value))} ₫`;
};

const normalizeAuthUser = (sessionUser, profile = null) => {
  const userMeta = sessionUser?.user_metadata || {};
  const profileRow = profile || {};

  return {
    id: sessionUser?.id || profileRow.id,
    email: sessionUser?.email || profileRow.email || '',
    name: profileRow.full_name || userMeta.full_name || userMeta.name || sessionUser?.email || '',
    role: profileRow.role || 'user',
    status: profileRow.status || 'active',
    createdAt: profileRow.created_at || sessionUser?.created_at || new Date().toISOString(),
    updatedAt: profileRow.updated_at || null,
  };
};

const normalizeOrderRow = (row = {}) => ({
  ...row,
  _id: row.id || row._id,
  user: row.user || null,
  service: row.service || null,
  amount: row.charge_vnd ?? row.amount ?? 0,
  createdAt: row.created_at || row.createdAt,
  updatedAt: row.updated_at || row.updatedAt,
  completedAt: row.completed_at || row.completedAt,
});

const getCurrentSupabaseProfile = async () => {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!sessionData.session?.user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', sessionData.session.user.id)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return normalizeAuthUser(sessionData.session.user, data || null);
};

// Auth API
export const authAPI = {
  login: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    const user = await getCurrentSupabaseProfile();

    return {
      data: {
        user,
        session: data.session,
      },
    };
  },
  register: async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      throw error;
    }

    const user = data.user
      ? normalizeAuthUser(data.user, {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || name,
          role: 'user',
          status: 'active',
          created_at: data.user.created_at,
        })
      : null;

    return {
      data: {
        user,
        session: data.session,
      },
    };
  },
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    return { data: { success: true } };
  },
  getMe: async () => {
    const user = await getCurrentSupabaseProfile();
    return {
      data: {
        data: user,
      },
    };
  },
  updateProfile: async (data) => {
    const currentProfile = await getCurrentSupabaseProfile();

    if (!currentProfile) {
      throw new Error('Người dùng chưa đăng nhập');
    }

    const { error: userError } = await supabase.auth.updateUser({
      data: { full_name: data.name },
    });

    if (userError) {
      throw userError;
    }

    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: data.name, updated_at: new Date().toISOString() })
      .eq('id', currentProfile.id)
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    return {
      data: {
        data: normalizeAuthUser({ id: currentProfile.id, email: currentProfile.email, created_at: currentProfile.createdAt }, updatedProfile),
      },
    };
  },
  updatePassword: async ({ newPassword }) => {
    const currentProfile = await getCurrentSupabaseProfile();

    if (!currentProfile) {
      throw new Error('Người dùng chưa đăng nhập');
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw error;
    }

    return { data: { success: true } };
  },
};

// Services API
const mapCatalogService = (service) => ({
  _id: service.id,
  title: service.name,
  description: service.description || '',
  rate: Number(service.selling_rate_vnd),
  pricePerUnit: Number(service.selling_rate_vnd),
  min: service.min_quantity,
  max: service.max_quantity,
  minQuantity: service.min_quantity,
  maxQuantity: service.max_quantity,
  supportsRefill: service.supports_refill,
  supportsCancel: service.supports_cancel,
  category: service.category_name,
  categorySlug: service.category_slug,
  platform: service.platform_name,
  platformSlug: service.platform_slug,
});

const getCatalogResponse = async (params = {}) => {
  const { data, error } = await supabase.rpc('get_service_catalog', {
    p_platform_slug: params.platformSlug || null,
    p_category_slug: params.categorySlug || null,
    p_search: params.search || null,
  });

  if (error) {
    throw error;
  }

  const services = (data || []).map(mapCatalogService);
  const grouped = services.reduce((groups, service) => {
    if (!groups[service.category]) {
      groups[service.category] = [];
    }
    groups[service.category].push(service);
    return groups;
  }, {});

  return {
    data: {
      success: true,
      count: services.length,
      data: services,
      grouped,
    },
  };
};

export const servicesAPI = {
  getAll: (params) => getCatalogResponse(params),
  getCatalog: getCatalogResponse,
  getCatalogCategories: async () => {
    const response = await getCatalogResponse();
    return {
      data: {
        success: true,
        data: Object.keys(response.data.grouped),
      },
    };
  },
  getActivePlatforms: async () => {
    const { data, error } = await supabase
      .from('platforms')
      .select('id, name, slug, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return {
      data: {
        success: true,
        data: (data || []).map((platform) => ({
          id: platform.id,
          name: platform.name,
          slug: platform.slug,
          sortOrder: platform.sort_order,
        })),
      },
    };
  },
};

// Orders API
export const ordersAPI = {
  create: async ({ serviceId, link, quantity, idempotencyKey }) => {
    const result = await ordersAPI.createSupabaseOrder({
      serviceId,
      link,
      quantity,
      idempotencyKey,
    });

    return { data: { data: result } };
  },
  getAll: async ({ page = 1, limit = 20, status = null } = {}) => {
    await requireSupabaseSession();

    const { data, error } = await supabase.rpc('get_my_orders', {
      p_status: status || null,
      p_limit: limit,
      p_offset: (page - 1) * limit,
    });

    if (error) {
      throw error;
    }

    const rows = (data || []).map(normalizeOrderRow);
    return {
      data: {
        data: rows,
        page,
        pages: Math.max(1, Math.ceil(rows.length / limit) || 1),
        total: rows.length,
      },
    };
  },
  getAllAdmin: async ({ page = 1, limit = 30, status = null } = {}) => {
    const result = await supabaseAdminAPI.listOrders({
      status: status || null,
      limit,
      offset: (page - 1) * limit,
    });

    return {
      data: {
        data: Array.isArray(result) ? result.map(normalizeOrderRow) : [],
        page,
        pages: Math.max(1, Math.ceil((Array.isArray(result) ? result.length : 0) / limit) || 1),
        total: Array.isArray(result) ? result.length : 0,
      },
    };
  },
  updateStatus: () => {
    throw new Error('Không hỗ trợ cập nhật trạng thái đơn hàng trực tiếp qua frontend. Vui lòng dùng RPC an toàn trên admin side.');
  },
  createSupabaseOrder: async ({ serviceId, link, quantity, idempotencyKey }) => {
    await requireSupabaseSession();
    const { data, error } = await supabase.rpc('create_order', {
      p_service_id: serviceId,
      p_link: link,
      p_quantity: quantity,
      p_idempotency_key: idempotencyKey || globalThis.crypto.randomUUID(),
    });

    if (error) {
      throw error;
    }

    return data;
  },
  refundSupabaseOrder: async ({ orderId, amountVnd, operationKey }) => {
    await requireSupabaseSession();
    const { data, error } = await supabase.rpc('refund_order', {
      p_order_id: orderId,
      p_amount_vnd: amountVnd,
      p_operation_key: operationKey || globalThis.crypto.randomUUID(),
    });

    if (error) {
      throw error;
    }

    return data;
  },
};

// Wallet API
const requireSupabaseSession = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!data.session) {
    const authError = new Error('Supabase Auth session required for wallet actions');
    authError.code = 'SUPABASE_AUTH_REQUIRED';
    throw authError;
  }

  return data.session;
};

const getSupabaseWalletSnapshot = async () => {
  const session = await requireSupabaseSession();
  const userId = session.user.id;
  const [walletResult, transactionResult, depositResult] = await Promise.all([
    supabase
      .from('wallets')
      .select('user_id, balance_vnd')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('wallet_transactions')
      .select('id, direction, type, amount_vnd, balance_after_vnd, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('deposit_requests')
      .select('id, amount_vnd, payment_method, payment_reference, status, admin_note, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  const firstError = [walletResult, transactionResult, depositResult].find(
    (result) => result.error
  )?.error;

  if (firstError) {
    throw firstError;
  }

  return {
    balance: walletResult.data?.balance_vnd ?? null,
    transactions: transactionResult.data || [],
    deposits: depositResult.data || [],
  };
};

export const walletAPI = {
  getSupabaseSnapshot: getSupabaseWalletSnapshot,
  createDepositRequest: async (amountVnd, paymentMethod) => {
    await requireSupabaseSession();
    const { data, error } = await supabase.rpc('create_deposit_request', {
      p_amount_vnd: amountVnd,
      p_payment_method: paymentMethod,
    });

    if (error) {
      throw error;
    }

    return data;
  },
  cancelDepositRequest: async (depositRequestId) => {
    await requireSupabaseSession();
    const { data, error } = await supabase.rpc('cancel_deposit_request', {
      p_deposit_request_id: depositRequestId,
    });

    if (error) {
      throw error;
    }

    return data;
  },
};

// Admin API
export const adminAPI = {
  getDashboard: async () => {
    const data = await callAdminSupabaseRpc('admin_dashboard_stats');
    return { data: { data } };
  },
  getUsers: async (params = {}) => {
    const data = await supabaseAdminAPI.listProfiles({
      search: params.search || null,
      role: params.role || null,
      status: params.status || null,
      limit: params.limit || 20,
      offset: params.offset || 0,
    });

    return {
      data: {
        data: (data || []).map((user) => ({
          _id: user.user_id,
          id: user.user_id,
          name: user.full_name || user.email,
          email: user.email,
          role: user.role,
          status: user.status,
          isActive: user.status === 'active',
          walletBalance: Number(user.balance_vnd || 0),
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        })),
        page: 1,
        pages: 1,
        total: (data || []).length,
      },
    };
  },
};

const callAdminSupabaseRpc = async (name, args = {}) => {
  await requireSupabaseSession();
  const { data, error } = await supabase.rpc(name, args);

  if (error) {
    throw error;
  }

  return data;
};

// Dormant until AuthContext uses a Supabase session.
export const supabaseAdminAPI = {
  listServices: (params) => callAdminSupabaseRpc('admin_list_services', {
    p_search: params?.search || null,
    p_limit: params?.limit || 100,
    p_offset: params?.offset || 0,
  }),
  listCategories: async () => {
    const { data, error } = await supabase.from('categories').select('id, name, platforms (name)').order('name');
    if (error) throw error;
    return data || [];
  },
  listProviderServices: async () => {
    const { data, error } = await supabase.from('provider_services').select('id, provider_service_id, raw_name, providers (name)').order('provider_service_id');
    if (error) throw error;
    return data || [];
  },
  listProfiles: (params) => callAdminSupabaseRpc('admin_list_profiles', {
    p_search: params?.search || null,
    p_role: params?.role || null,
    p_status: params?.status || null,
    p_limit: params?.limit || 50,
    p_offset: params?.offset || 0,
  }),
  updateProfileAccess: (userId, role, status) => callAdminSupabaseRpc('admin_update_profile_access', {
    p_user_id: userId,
    p_role: role,
    p_status: status,
  }),
  updateProfileDetails: (userId, fullName) => callAdminSupabaseRpc('admin_update_profile_details', {
    p_user_id: userId,
    p_full_name: fullName,
  }),
  inviteUser: async ({ full_name, email, role, status }) => {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { full_name, email, role, status },
    });
    if (error) throw error;
    return data;
  },
  createPlatform: (data) => callAdminSupabaseRpc('admin_create_platform', {
    p_name: data.name,
    p_slug: data.slug,
    p_icon: data.icon || null,
    p_sort_order: data.sortOrder || 0,
  }),
  updatePlatform: (data) => callAdminSupabaseRpc('admin_update_platform', {
    p_platform_id: data.id,
    p_name: data.name,
    p_slug: data.slug,
    p_icon: data.icon || null,
    p_sort_order: data.sortOrder,
    p_is_active: data.isActive,
  }),
  createCategory: (data) => callAdminSupabaseRpc('admin_create_category', {
    p_platform_id: data.platformId,
    p_name: data.name,
    p_slug: data.slug,
    p_icon: data.icon || null,
    p_sort_order: data.sortOrder || 0,
  }),
  updateCategory: (data) => callAdminSupabaseRpc('admin_update_category', {
    p_category_id: data.id,
    p_platform_id: data.platformId,
    p_name: data.name,
    p_slug: data.slug,
    p_icon: data.icon || null,
    p_sort_order: data.sortOrder,
    p_is_active: data.isActive,
  }),
  createService: (data) => callAdminSupabaseRpc('admin_create_service', {
    p_category_id: data.categoryId,
    p_name: data.name,
    p_description: data.description || null,
    p_selling_rate_vnd: data.sellingRateVnd,
    p_min_quantity: data.minQuantity,
    p_max_quantity: data.maxQuantity,
    p_supports_refill: data.supportsRefill,
    p_supports_cancel: data.supportsCancel,
    p_primary_provider_service_id: data.primaryProviderServiceId,
    p_sort_order: data.sortOrder || 0,
  }),
  updateService: (data) => callAdminSupabaseRpc('admin_update_service', {
    p_service_id: data.id,
    p_category_id: data.categoryId,
    p_name: data.name,
    p_description: data.description || null,
    p_selling_rate_vnd: data.sellingRateVnd,
    p_min_quantity: data.minQuantity,
    p_max_quantity: data.maxQuantity,
    p_supports_refill: data.supportsRefill,
    p_supports_cancel: data.supportsCancel,
    p_primary_provider_service_id: data.primaryProviderServiceId,
    p_is_active: data.isActive,
    p_sort_order: data.sortOrder,
  }),
  createProvider: (data) => callAdminSupabaseRpc('admin_create_provider', {
    p_name: data.name,
    p_base_url: data.baseUrl,
    p_priority: data.priority || 100,
  }),
  updateProvider: (data) => callAdminSupabaseRpc('admin_update_provider', {
    p_provider_id: data.id,
    p_name: data.name,
    p_base_url: data.baseUrl,
    p_priority: data.priority,
    p_is_active: data.isActive,
  }),
  createProviderService: (data) => callAdminSupabaseRpc('admin_create_provider_service', {
    p_provider_id: data.providerId,
    p_provider_service_id: data.providerServiceId,
    p_raw_name: data.rawName || null,
    p_provider_rate: data.providerRate,
    p_provider_currency: data.providerCurrency,
    p_min_quantity: data.minQuantity,
    p_max_quantity: data.maxQuantity,
    p_supports_refill: data.supportsRefill,
    p_supports_cancel: data.supportsCancel,
  }),
  updateProviderService: (data) => callAdminSupabaseRpc('admin_update_provider_service', {
    p_provider_service_uuid: data.id,
    p_provider_id: data.providerId,
    p_provider_service_id: data.providerServiceId,
    p_raw_name: data.rawName || null,
    p_provider_rate: data.providerRate,
    p_provider_currency: data.providerCurrency,
    p_min_quantity: data.minQuantity,
    p_max_quantity: data.maxQuantity,
    p_supports_refill: data.supportsRefill,
    p_supports_cancel: data.supportsCancel,
    p_is_active: data.isActive,
  }),
  listDeposits: (params) => callAdminSupabaseRpc('admin_list_deposit_requests', {
    p_status: params?.status || null,
    p_limit: params?.limit || 50,
    p_offset: params?.offset || 0,
  }),
  approveDeposit: (depositRequestId, operationKey) => callAdminSupabaseRpc('approve_deposit', {
    p_deposit_request_id: depositRequestId,
    p_operation_key: operationKey || globalThis.crypto.randomUUID(),
  }),
  rejectDeposit: (depositRequestId, adminNote) => callAdminSupabaseRpc('reject_deposit_request', {
    p_deposit_request_id: depositRequestId,
    p_admin_note: adminNote || null,
  }),
  listOrders: (params) => callAdminSupabaseRpc('admin_list_orders', {
    p_status: params?.status || null,
    p_limit: params?.limit || 50,
    p_offset: params?.offset || 0,
  }),
  refundOrder: (orderId, amountVnd, operationKey) => callAdminSupabaseRpc('refund_order', {
    p_order_id: orderId,
    p_amount_vnd: amountVnd,
    p_operation_key: operationKey || globalThis.crypto.randomUUID(),
  }),
  getDashboardStats: () => callAdminSupabaseRpc('admin_dashboard_stats'),
};
