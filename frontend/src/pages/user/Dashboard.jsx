import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI, walletAPI } from '../../services/api';
import { Card, StatCard, Table, Badge, PageLoader } from '../../components/ui';
import {
  HiOutlineCreditCard,
  HiOutlineShoppingCart,
  HiOutlineClipboardList,
  HiOutlineClock,
} from 'react-icons/hi';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const ordersRes = await ordersAPI.getAll({ limit: 5 });
      setOrders(ordersRes.data.data);
      
      // Calculate stats from orders
      const allOrdersRes = await ordersAPI.getAll({ limit: 1000 });
      const allOrders = allOrdersRes.data.data;
      
      setStats({
        totalOrders: allOrders.length,
        pendingOrders: allOrders.filter(o => ['pending', 'processing', 'in_progress'].includes(o.status)).length,
        completedOrders: allOrders.filter(o => o.status === 'completed').length,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
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
    { key: '_id', title: 'Mã đơn', render: (id) => `#${id.slice(-8)}` },
    {
      key: 'service',
      title: 'Dịch vụ',
      render: (_, row) => row.service?.title || 'N/A',
    },
    { key: 'quantity', title: 'Số lượng' },
    { key: 'amount', title: 'Số tiền', render: (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(amount || 0)) },
    { key: 'status', title: 'Trạng thái', render: (status) => getStatusBadge(status) },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="fade-in">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Chào mừng trở lại, {user?.name}!
        </h1>
        <p className="text-gray-500 mt-1">
          Đây là tình hình đơn hàng của bạn hôm nay.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Số dư ví"
          value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(user?.walletBalance || 0))}
          icon={HiOutlineCreditCard}
          color="primary"
        />
        <StatCard
          title="Tổng đơn"
          value={stats.totalOrders}
          icon={HiOutlineShoppingCart}
          color="info"
        />
        <StatCard
          title="Đơn chờ xử lý"
          value={stats.pendingOrders}
          icon={HiOutlineClock}
          color="warning"
        />
        <StatCard
          title="Đơn hoàn thành"
          value={stats.completedOrders}
          icon={HiOutlineClipboardList}
          color="success"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          to="/new-order"
          className="bg-primary-600 text-white rounded-xl p-6 hover:bg-primary-700 transition-colors"
        >
          <HiOutlineShoppingCart className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold">Đặt đơn mới</h3>
          <p className="text-primary-100 mt-1">Đặt dịch vụ SMM nhanh chóng</p>
        </Link>
        <Link
          to="/add-funds"
          className="bg-green-600 text-white rounded-xl p-6 hover:bg-green-700 transition-colors"
        >
          <HiOutlineCreditCard className="w-8 h-8 mb-3" />
          <h3 className="text-lg font-semibold">Nạp tiền</h3>
          <p className="text-green-100 mt-1">Nạp tiền vào ví của bạn</p>
        </Link>
      </div>

      {/* Recent Orders */}
      <Card
        title="Recent Orders"
        action={
          <Link
            to="/orders"
            className="text-sm text-primary-600 hover:underline"
          >
            View All
          </Link>
        }
      >
        <Table
          columns={columns}
          data={orders}
          emptyMessage="Chưa có đơn hàng nào. Hãy đặt đơn đầu tiên!"
        />
      </Card>
    </div>
  );
};

export default Dashboard;
