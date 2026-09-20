import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button, Input } from '../../components/ui';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const startCooldown = () => {
    setCooldown(60);
    const timer = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const requestOtp = async () => {
    if (!email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

      if (error) throw error;
      startCooldown();
      setStep(2);
      toast.success('Nếu email tồn tại trong hệ thống, mã xác minh đã được gửi.');
    } catch (error) {
      toast.error(error.message || 'Không thể gửi mã xác minh.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const normalizedToken = otp.trim();
    if (!normalizedToken || normalizedToken.length < 6) {
      toast.error('Vui lòng nhập mã xác minh hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: normalizedToken,
        type: 'recovery',
      });

      if (error) throw error;

      if (data?.session) {
        setStep(3);
        toast.success('Mã xác minh hợp lệ.');
      }
    } catch (error) {
      toast.error(error.message || 'Mã xác minh không đúng hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      await supabase.auth.signOut();
      toast.success('Đổi mật khẩu thành công.');
      setStep(1);
      setEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      navigate('/login', { state: { message: 'Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại.' } });
    } catch (error) {
      toast.error(error.message || 'Không thể cập nhật mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <div className="space-y-5">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập email của bạn"
            required
          />
          <Button type="button" onClick={requestOtp} loading={loading} className="w-full" size="lg">
            Gửi mã xác minh
          </Button>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-5">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập email của bạn"
            required
          />
          <Input
            label="Mã xác minh"
            inputMode="numeric"
            value={otp}
            maxLength={6}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Nhập 6 chữ số"
            required
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={verifyOtp} loading={loading} className="flex-1" size="lg">
              Xác minh OTP
            </Button>
            <Button type="button" variant="secondary" onClick={requestOtp} disabled={cooldown > 0 || loading} className="flex-1" size="lg">
              {cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : 'Gửi lại mã'}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="relative">
          <Input
            label="Mật khẩu mới"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nhập mật khẩu mới"
            required
          />
          <button type="button" onClick={() => setShowNewPassword((value) => !value)} className="absolute right-3 top-[44px] text-xs font-medium text-[var(--text-muted)]">
            {showNewPassword ? 'Ẩn' : 'Hiện'}
          </button>
        </div>
        <div className="relative">
          <Input
            label="Xác nhận mật khẩu mới"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            required
          />
          <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-3 top-[44px] text-xs font-medium text-[var(--text-muted)]">
            {showConfirmPassword ? 'Ẩn' : 'Hiện'}
          </button>
        </div>
        <Button type="button" onClick={updatePassword} loading={loading} className="w-full" size="lg">
          Đổi mật khẩu
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 py-10">
      <div className="mx-auto max-w-md rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow)]">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
            Khôi phục mật khẩu
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">{step === 1 ? 'Nhập email' : step === 2 ? 'Nhập mã OTP' : 'Đặt mật khẩu mới'}</h1>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`rounded-full border px-2 py-1.5 text-center text-xs font-semibold ${
                step >= item
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-200'
                  : 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--text-muted)]'
              }`}
            >
              {item === 1 ? 'Email' : item === 2 ? 'OTP' : 'Mật khẩu'}
            </div>
          ))}
        </div>

        {renderStep()}
        <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Đã nhớ mật khẩu?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
