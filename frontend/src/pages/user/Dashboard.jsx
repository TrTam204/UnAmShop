import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI, servicesAPI } from '../../services/api';
import PlatformIcon from '../../components/platform/PlatformIcon';
import { platformPageConfig } from '../../config/platformAssets';
import { Card, PageLoader } from '../../components/ui';
import {
  HiOutlineArrowRight,
  HiOutlineCreditCard,
  HiOutlineShoppingCart,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineSparkles,
} from 'react-icons/hi';

const Dashboard = () => {
  const { user, walletBalanceVnd } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [platforms, setPlatforms] = useState([]);
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
      const [ordersRes, servicesRes] = await Promise.all([
        ordersAPI.getAll({ limit: 5 }),
        servicesAPI.getActivePlatforms(),
      ]);

      const allOrders = ordersRes.data.data;
      const activePlatforms = servicesRes.data.data || [];

      setOrders(allOrders);
      setPlatforms(activePlatforms);
      setStats({
        totalOrders: allOrders.length,
        pendingOrders: allOrders.filter((o) => ['pending', 'processing', 'in_progress'].includes(o.status)).length,
        completedOrders: allOrders.filter((o) => o.status === 'completed').length,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formattedBalance = walletBalanceVnd === null
    ? '—'
    : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(walletBalanceVnd));

  const statItems = [
    { label: 'Số dư', value: formattedBalance, icon: HiOutlineCreditCard },
    { label: 'Tổng đơn', value: stats.totalOrders, icon: HiOutlineShoppingCart },
    { label: 'Đang xử lý', value: stats.pendingOrders, icon: HiOutlineClock },
    { label: 'Hoàn thành', value: stats.completedOrders, icon: HiOutlineClipboardList },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="fade-in space-y-6">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">XIN CHÀO, {user?.name?.toUpperCase()} 👋</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Quản lý dịch vụ và đơn hàng của bạn tại ỪnAm SHOP.
            </h2>
          </div>

          <Link to="/new-order" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-transform hover:-translate-y-0.5">
            Tạo đơn mới
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statItems.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-[20px] border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-[var(--text-muted)]">{label}</div>
                <div className="mt-2 text-[28px] font-bold tracking-tight text-[var(--text-primary)]">{value}</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card title="Đặt nhanh" subtitle="Nền tảng phổ biến" className="overflow-hidden">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {platforms.length > 0 ? (
            platforms.map((platform) => {
              const config = platformPageConfig[platform.slug];
              return (
                <Link
                  key={platform.id}
                  to={`/services/${platform.slug}`}
                  className="group rounded-[18px] border border-[var(--border)] bg-[var(--surface-strong)] p-4 transition-all hover:border-indigo-300 hover:shadow-sm dark:hover:border-indigo-500/40"
                >
                  <div className="flex items-center gap-3">
                    <PlatformIcon slug={platform.slug} fallback={config?.fallback} />
                    <div>
                      <div className="text-base font-semibold text-[var(--text-primary)]">{platform.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">Dịch vụ hiện có</div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="rounded-[18px] border border-dashed border-[var(--border)] p-6 text-sm text-[var(--text-muted)]">Chưa có nền tảng nào được cấu hình.</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
