import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatWalletBalance } from '../../services/api';
import {
  HiOutlineHome,
  HiOutlineCreditCard,
  HiOutlineShoppingCart,
  HiOutlineClipboardList,
  HiOutlineCollection,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineUsers,
  HiOutlineViewGrid,
  HiOutlineCash,
  HiOutlineLogout,
  HiOutlineX,
  HiOutlineSparkles,
} from 'react-icons/hi';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin, walletBalanceVnd } = useAuth();
  const location = useLocation();

  const userMenuItems = [
    { path: '/dashboard', icon: HiOutlineHome, label: 'Tổng quan' },
    { path: '/new-order', icon: HiOutlineShoppingCart, label: 'Tạo đơn' },
    { path: '/orders', icon: HiOutlineClipboardList, label: 'Đơn hàng' },
    { path: '/my-services', icon: HiOutlineCollection, label: 'Dịch vụ' },
    { path: '/add-funds', icon: HiOutlineCreditCard, label: 'Nạp tiền' },
    { path: '/profile', icon: HiOutlineUser, label: 'Tài khoản' },
  ];

  const adminMenuItems = [
    { path: '/admin', icon: HiOutlineViewGrid, label: 'Bảng điều khiển' },
    { path: '/admin/orders', icon: HiOutlineClipboardList, label: 'Đơn hàng' },
    { path: '/admin/services', icon: HiOutlineCollection, label: 'Quản trị catalog' },
    { path: '/admin/users', icon: HiOutlineUsers, label: 'Người dùng' },
    { path: '/admin/add-funds', icon: HiOutlineCash, label: 'Nạp tiền' },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;
  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-[var(--overlay)] lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[290px] border-r border-[var(--border)] bg-[var(--sidebar-bg)] backdrop-blur-xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-5">
            <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-blue-600 text-lg font-black text-white shadow-lg shadow-indigo-500/20">
                U
              </div>
              <div>
                <div className="text-lg font-black tracking-tight text-[var(--text-primary)]">ỪnAm SHOP</div>
                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">Nền tảng SMM</div>
              </div>
            </Link>
            <button className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)] lg:hidden" onClick={onClose}>
              <HiOutlineX className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 py-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              <HiOutlineSparkles className="h-3.5 w-3.5" />
              Xin chào
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{user?.name || 'Người dùng'}</p>
                <p className="truncate text-xs text-[var(--text-muted)]">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
            {!isAdmin && (
              <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-200">
                Số dư: {formatWalletBalance(walletBalanceVnd)}
              </div>
            )}
          </div>

          <nav className="flex-1 px-4 pb-4">
            <div className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">MENU CHÍNH</div>
            <ul className="space-y-1.5">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {isAdmin && (
              <div className="mt-6">
                <div className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">QUẢN TRỊ</div>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
                >
                  <HiOutlineUser className="h-4 w-4" />
                  <span>Trang người dùng</span>
                </Link>
              </div>
            )}
          </nav>

          <div className="border-t border-[var(--border)] px-4 py-4">
            {user?.role === 'admin' && !isAdmin && (
              <Link
                to="/admin"
                className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
              >
                <HiOutlineCog className="h-4 w-4" />
                <span>Trang quản trị</span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-red-500 hover:text-white"
            >
              <HiOutlineLogout className="h-4 w-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
