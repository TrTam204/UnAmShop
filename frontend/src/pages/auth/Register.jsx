import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/ui';
import toast from 'react-hot-toast';
import { HiCheck, HiOutlineShieldCheck } from 'react-icons/hi';
import { supabase } from '../../lib/supabase';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successState, setSuccessState] = useState(null);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Mật khẩu không khớp');
      return;
    }

    setLoading(true);

    try {
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

      if (data?.user && !data?.session) {
        setPassword('');
        setConfirmPassword('');
        setSuccessState({
          email: data.user.email,
          message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.',
        });
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.');
        return;
      }

      await register(name, email, password);
      toast.success('Đăng ký thành công!');
    } catch (error) {
      toast.error(error.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      toast.success('Email xác nhận đã được gửi lại.');
    } catch (error) {
      toast.error(error.message || 'Không thể gửi lại email xác nhận.');
    }
  };

  if (successState) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] px-4 py-10 text-[var(--text-primary)]">
        <div className="mx-auto max-w-lg rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow)]">
          <div className="mb-6 inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Đăng ký thành công</div>
          <h1 className="text-3xl font-bold">Đăng ký thành công</h1>
          <p className="mt-4 text-[var(--text-secondary)]">{successState.message}</p>
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-3 text-sm text-[var(--text-secondary)]">
            {successState.email}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/login" className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-3 font-semibold text-white">Đến trang đăng nhập</Link>
            <button type="button" onClick={handleResend} className="inline-flex flex-1 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-5 py-3 font-semibold text-[var(--text-primary)]">Gửi lại email xác nhận</button>
          </div>
        </div>
      </div>
    );
  }

  const benefitItems = [
    'Quản lý dịch vụ nhanh chóng',
    'Theo dõi đơn hàng theo thời gian thực',
    'Theo dõi số dư và giao dịch',
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_30%),linear-gradient(180deg,#f5f7fb_0%,#edf4ff_100%)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_30%),linear-gradient(180deg,#08111f_0%,#0b1424_100%)]">
      <div className="mx-auto flex max-w-[1180px] overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950">
        <div className="hidden w-[42%] bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl font-black backdrop-blur-sm">U</div>
              <div>
                <div className="text-2xl font-black tracking-tight">ỪnAm SHOP</div>
                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-indigo-100">Nền tảng SMM</div>
              </div>
            </div>
            <p className="max-w-xs text-base text-indigo-100/90">Nền tảng quản lý dịch vụ SMM hiện đại.</p>
          </div>

          <div className="space-y-5">
            {benefitItems.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <HiCheck className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-indigo-50">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-full items-center justify-center bg-white px-6 py-8 dark:bg-slate-950 lg:w-[58%] lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
                <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                Tạo tài khoản
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Đăng ký</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Họ và tên"
                type="text"
                placeholder="Nhập tên của bạn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="relative">
                <Input
                  label="Mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tạo mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-[44px] text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Xác nhận mật khẩu"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-3 top-[44px] text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Tạo tài khoản
              </Button>
            </form>

            <div className="mt-7 text-center text-sm text-slate-600 dark:text-slate-300">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300">
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
