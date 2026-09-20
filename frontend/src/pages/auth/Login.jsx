import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/ui';
import toast from 'react-hot-toast';
import { HiCheck, HiOutlineShieldCheck } from 'react-icons/hi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = location.state?.message;

  if (successMessage && !email && !password) {
    toast.success(successMessage, { id: 'password-reset-success' });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error?.message || error.response?.data?.error || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const benefitItems = [
    'Quản lý dịch vụ nhanh chóng',
    'Theo dõi đơn hàng theo thời gian thực',
    'Theo dõi số dư và giao dịch',
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_30%),linear-gradient(180deg,#f5f7fb_0%,#edf4ff_100%)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_30%),linear-gradient(180deg,#07111f_0%,#0b1424_100%)]">
      <div className="mx-auto flex max-w-[1180px] overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
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

        <div className="flex w-full items-center justify-center bg-[var(--surface)] px-6 py-8 lg:w-[58%] lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
                <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                Chào mừng trở lại
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Đăng nhập</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-[44px] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-muted)]">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500" />
                  <span>Ghi nhớ</span>
                </label>
                <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300">Quên mật khẩu?</Link>
              </div>

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Đăng nhập
              </Button>
            </form>

            <div className="mt-7 text-center text-sm text-[var(--text-secondary)]">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300">
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
