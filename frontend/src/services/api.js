import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors or storage access errors gracefully
    if (!error.response) {
      console.warn('Network error or request blocked:', error.message);
      return Promise.reject(error);
    }
    
    // Don't redirect on 401 for public pages/endpoints
    const publicPaths = ['/', '/services', '/login', '/register', '/privacy-policy', '/terms-of-service', '/refund-policy', '/contact'];
    const isPublicPage = publicPaths.some(path => 
      window.location.pathname === path || window.location.pathname.startsWith('/services/')
    );
    const isPublicEndpoint = error.config?.url?.includes('/auth/me') || 
                             error.config?.url?.includes('/services');
    
    if (error.response?.status === 401 && !isPublicEndpoint && !isPublicPage) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data),
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
  getAll: (params) => api.get('/services', { params }),
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
  getById: (id) => api.get(`/services/${id}`),
  getCategories: () => api.get('/services/categories'),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
};

// Orders API
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getAllAdmin: (params) => api.get('/orders/admin/all', { params }),
  getStats: () => api.get('/orders/admin/stats'),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
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
    balance: walletResult.data?.balance_vnd || 0,
    transactions: transactionResult.data || [],
    deposits: depositResult.data || [],
  };
};

export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  getHistory: (params) => api.get('/wallet/history', { params }),
  createPaymentOrder: (amount) => api.post('/wallet/add-funds', { amount }),
  verifyPayment: (data) => api.post('/wallet/verify-payment', data),
  adminAddFunds: (data) => api.post('/wallet/admin/add-funds', data),
  getAllTransactions: (params) => api.get('/wallet/admin/transactions', { params }),
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
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export default api;
