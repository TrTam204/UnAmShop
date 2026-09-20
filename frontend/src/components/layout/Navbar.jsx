import { useLocation } from 'react-router-dom';
import { HiOutlineBell, HiOutlineMenuAlt2, HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { formatWalletBalance } from '../../services/api';

const pageTitles = {
  '/dashboard': { eyebrow: 'TỔNG QUAN', title: 'Tổng quan' },
  '/new-order': { eyebrow: 'ĐƠN HÀNG', title: 'Tạo đơn' },
  '/orders': { eyebrow: 'ĐƠN HÀNG', title: 'Đơn hàng' },
  '/my-services': { eyebrow: 'DỊCH VỤ', title: 'Dịch vụ' },
  '/add-funds': { eyebrow: 'NẠP TIỀN', title: 'Nạp tiền' },
  '/profile': { eyebrow: 'TÀI KHOẢN', title: 'Tài khoản' },
  '/admin': { eyebrow: 'QUẢN TRỊ', title: 'Tổng quan' },
  '/admin/orders': { eyebrow: 'QUẢN TRỊ', title: 'Đơn hàng' },
  '/admin/services': { eyebrow: 'QUẢN TRỊ', title: 'Catalog' },
  '/admin/users': { eyebrow: 'QUẢN TRỊ', title: 'Người dùng' },
  '/admin/add-funds': { eyebrow: 'QUẢN TRỊ', title: 'Nạp tiền' },
  '/contact': { eyebrow: 'HỖ TRỢ', title: 'Hỗ trợ' },
};

const Navbar = ({ onMenuClick, theme, onToggleTheme }) => {
  const { user, walletBalanceVnd } = useAuth();
  const location = useLocation();
  const header = pageTitles[location.pathname] || { eyebrow: 'TỔNG QUAN', title: 'Tổng quan' };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--topbar-bg)] backdrop-blur-xl">
      <div className="page-shell flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] shadow-sm lg:hidden"
            onClick={onMenuClick}
            aria-label="Mở menu"
          >
            <HiOutlineMenuAlt2 className="h-5 w-5" />
          </button>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{header.eyebrow}</div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{header.title}</h1>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-sm md:flex">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">Ví</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {formatWalletBalance(walletBalanceVnd)}
            </span>
          </div>

          <button
            onClick={onToggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] shadow-sm transition-colors hover:text-[var(--text-primary)]"
            aria-label="Chuyển đổi theme"
          >
            {theme === 'dark' ? <HiOutlineSun className="h-5 w-5" /> : <HiOutlineMoon className="h-5 w-5" />}
          </button>

          <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] shadow-sm transition-colors hover:text-[var(--text-primary)]">
            <HiOutlineBell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">0</span>
          </button>

          <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{user?.name}</p>
              <p className="text-[11px] text-[var(--text-muted)]">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
