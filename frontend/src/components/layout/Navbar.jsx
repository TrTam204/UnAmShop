import { HiOutlineMenuAlt2, HiOutlineBell } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="page-shell flex items-center justify-between py-3">
        <button
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm lg:hidden"
          onClick={onMenuClick}
          aria-label="Mở menu"
        >
          <HiOutlineMenuAlt2 className="h-5 w-5" />
        </button>

        <div className="ml-auto flex items-center gap-3">
          <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:text-slate-900">
            <HiOutlineBell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
              0
            </span>
          </button>

          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-bold text-white shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-[11px] text-slate-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
