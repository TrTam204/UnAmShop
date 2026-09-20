import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { authAPI, walletAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletBalanceVnd, setWalletBalanceVnd] = useState(null);

  const refreshWalletBalance = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData?.session?.user;
      const isRecoverySession = Boolean(sessionUser?.app_metadata?.provider === 'email' && sessionUser?.user_metadata?.recovery);

      if (!sessionUser || isRecoverySession) {
        setWalletBalanceVnd(null);
        return;
      }

      const snapshot = await walletAPI.getSupabaseSnapshot();
      const balance = snapshot?.balance;
      if (balance !== null && balance !== undefined) {
        setWalletBalanceVnd(Number(balance));
      }
    } catch (error) {
      // Keep the last known balance when a refresh temporarily fails.
    }
  }, []);

  const syncUserFromSession = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData?.session?.user;

      if (!sessionUser) {
        setUser(null);
        setWalletBalanceVnd(null);
        return;
      }

      const isRecoverySession = Boolean(sessionUser?.app_metadata?.provider === 'email' && sessionUser?.user_metadata?.recovery);

      if (isRecoverySession) {
        setUser(null);
        setWalletBalanceVnd(null);
        return;
      }

      if (sessionUser.email_confirmed_at) {
        const response = await authAPI.getMe();
        const nextUser = response?.data?.data || null;
        setUser(nextUser && nextUser.status === 'active' ? nextUser : null);
        if (nextUser && nextUser.status === 'active') {
          await refreshWalletBalance();
        }
      } else {
        setUser(null);
        setWalletBalanceVnd(null);
      }
    } catch (error) {
      setUser(null);
      setWalletBalanceVnd(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      if (!active) return;
      await syncUserFromSession();
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!active) return;

        const isRecoverySession = Boolean(session?.user?.app_metadata?.provider === 'email' && session?.user?.user_metadata?.recovery);

        if (session?.user && session.user.email_confirmed_at && !isRecoverySession) {
          await syncUserFromSession();
          return;
        }

        setUser(null);
        setWalletBalanceVnd(null);
        setLoading(false);
      }
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshWalletBalance();
      }
    };

    window.addEventListener('focus', refreshWalletBalance);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener('focus', refreshWalletBalance);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const checkAuth = async () => {
    await syncUserFromSession();
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const nextUser = response.data.user;
      setUser(nextUser && nextUser.status === 'active' ? nextUser : null);
      if (nextUser && nextUser.status === 'active') {
        await refreshWalletBalance();
      }
      return response.data;
    } catch (error) {
      if (error?.message?.includes('Email not confirmed') || error?.message?.includes('email')) {
        throw new Error('Email chưa được xác nhận. Vui lòng kiểm tra hộp thư và xác nhận tài khoản.');
      }
      throw error;
    }
  };

  const register = async (name, email, password) => {
    const response = await authAPI.register({ name, email, password });
    const nextUser = response.data.user || null;
    setUser(nextUser && nextUser.status === 'active' ? nextUser : null);
    if (nextUser && nextUser.status === 'active') {
      await refreshWalletBalance();
    }
    return response.data;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
    setWalletBalanceVnd(null);
  };

  const updateUser = (data) => {
    setUser((prev) => ({ ...prev, ...data }));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
    walletBalanceVnd,
    refreshWalletBalance,
    isAuthenticated: !!user && user.status === 'active',
    isAdmin: !!user && user.role === 'admin' && user.status === 'active',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
