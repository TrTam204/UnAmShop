import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/ui';
import toast from 'react-hot-toast';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Mật khẩu không khớp');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      toast.success('Đăng ký thành công!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-xl mb-4">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản</h1>
            <p className="text-gray-500 mt-2">Bắt đầu hành trình SMM của bạn ngay hôm nay</p>
          </div>

          {/* Form */}
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
            <Input
              label="Mật khẩu"
              type="password"
              placeholder="Tạo mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Xác nhận mật khẩu"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Tạo tài khoản
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="text-primary-600 font-medium hover:underline"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
