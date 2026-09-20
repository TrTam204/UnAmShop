import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { Card, StatCard, Table, Badge, PageLoader } from '../../components/ui';
import {
  HiOutlineUsers,
  HiOutlineShoppingCart,
  HiOutlineCash,
  HiOutlineCollection,
  HiOutlineClock,
} from 'react-icons/hi';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', label: 'Đang chờ' },
      processing: { variant: 'info', label: 'Đang xử lý' },
      in_progress: { variant: 'info', label: 'Đang tiến hành' },
      completed: { variant: 'success', label: 'Hoàn thành' },
      partial: { variant: 'warning', label: 'Một phần' },
      cancelled: { variant: 'danger', label: 'Đã hủy' },
      refunded: { variant: 'danger', label: 'Hoàn tiền' },
    };

    const config = statusConfig[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns = [
    {
      key: '_id',
      title: 'Mã đơn',
      render: (id) => <span className="font-mono text-xs">#{id.slice(-8)}</span>,
    },
    {
      key: 'user',
      title: 'Người dùng',
      render: (_, row) => row.user?.name || 'N/A',
    },
    {
      key: 'service',
      title: 'Dịch vụ',
      render: (_, row) => row.service?.title || 'N/A',
    },
    {
      key: 'amount',
      title: 'Số tiền',
      render: (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(amount || 0)),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (status) => getStatusBadge(status),
    },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển quản trị</h1>
        <p className="text-gray-500 mt-1">Tổng quan về ỪnAm SHOP</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Tổng người dùng"
          value={stats?.users?.total || 0}
          icon={HiOutlineUsers}
          color="primary"
        />
        <StatCard
          title="Tổng đơn"
          value={stats?.orders?.total || 0}
          icon={HiOutlineShoppingCart}
          color="info"
        />
        <StatCard
          title="Đơn chờ xử lý"
          value={stats?.orders?.pending || 0}
          icon={HiOutlineClock}
          color="warning"
        />
        <StatCard
          title="Doanh thu"
          value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(stats?.revenue?.total || 0))}
          icon={HiOutlineCash}
          color="success"
        />
        <StatCard
          title="Dịch vụ hoạt động"
          value={stats?.services?.active || 0}
          icon={HiOutlineCollection}
          color="primary"
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link
          to="/admin/orders"
          className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
        >
          <HiOutlineShoppingCart className="w-8 h-8 text-primary-600 mb-2" />
          <h3 className="font-semibold">Xem đơn</h3>
          <p className="text-sm text-gray-500">Quản lý tất cả đơn hàng</p>
        </Link>
        <Link
          to="/admin/services"
          className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
        >
          <HiOutlineCollection className="w-8 h-8 text-green-600 mb-2" />
          <h3 className="font-semibold">Quản lý dịch vụ</h3>
          <p className="text-sm text-gray-500">Thêm hoặc chỉnh sửa dịch vụ</p>
        </Link>
        <Link
          to="/admin/users"
          className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
        >
          <HiOutlineUsers className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="font-semibold">Quản lý người dùng</h3>
          <p className="text-sm text-gray-500">Xem và chỉnh sửa người dùng</p>
        </Link>
        <Link
          to="/admin/add-funds"
          className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
        >
          <HiOutlineCash className="w-8 h-8 text-yellow-600 mb-2" />
          <h3 className="font-semibold">Nạp tiền</h3>
          <p className="text-sm text-gray-500">Nạp tiền thủ công</p>
        </Link>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card title="Thống kê hôm nay">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-gray-600">Đơn hôm nay</p>
              <p className="text-2xl font-bold text-primary-600">
                {stats?.orders?.today || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Doanh thu hôm nay</p>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(stats?.revenue?.today || 0))}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Đơn theo trạng thái">
          <div className="space-y-3">
            {stats?.orders?.byStatus?.map((item) => (
              <div key={item._id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusBadge(item._id)}
                </div>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card
        title="Recent Orders"
        action={
          <Link to="/admin/orders" className="text-sm text-primary-600 hover:underline">
            Xem tất cả
          </Link>
        }
      >
        <Table
          columns={columns}
          data={stats?.recentOrders || []}
          emptyMessage="Chưa có đơn gần đây"
        />
      </Card>
    </div>
  );
};

export default AdminDashboard;
