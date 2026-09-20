import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { Card, Button, Input } from '../../components/ui';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.updateProfile(profileData);
      updateUser(response.data.data);
      toast.success('Cập nhật hồ sơ thành công');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Cập nhật hồ sơ thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu không khớp');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setPasswordLoading(true);

    try {
      await authAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Cập nhật mật khẩu thành công');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Cập nhật mật khẩu thất bại');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="fade-in max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ</h1>
        <p className="text-gray-500 mt-1">Quản lý cài đặt tài khoản của bạn</p>
      </div>

      <div className="space-y-6">
        {/* Account Info */}
        <Card title="Thông tin tài khoản">
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.name}</p>
                <p className="text-gray-500">{user?.email}</p>
                <p className="text-sm text-primary-600 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <Input
              label="Họ và tên"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              required
            />
            <Input
              label="Email"
              value={user?.email}
              disabled
              helperText="Email không thể thay đổi"
            />
            <Button type="submit" loading={loading}>
              Cập nhật hồ sơ
            </Button>
          </form>
        </Card>

        {/* Change Password */}
        <Card title="Đổi mật khẩu">
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <Input
              label="Mật khẩu hiện tại"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
              required
            />
            <Input
              label="Mật khẩu mới"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, newPassword: e.target.value })
              }
              required
            />
            <Input
              label="Xác nhận mật khẩu mới"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              required
            />
            <Button type="submit" loading={passwordLoading}>
              Cập nhật mật khẩu
            </Button>
          </form>
        </Card>

        {/* Account Stats */}
        <Card title="Thống kê tài khoản">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Số dư ví</p>
              <p className="text-xl font-bold text-primary-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(user?.walletBalance || 0))}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Loại tài khoản</p>
              <p className="text-xl font-bold capitalize">{user?.role === 'admin' ? 'Quản trị' : 'Người dùng'}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Thành viên từ</p>
              <p className="text-xl font-bold">
                {new Date(user?.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
