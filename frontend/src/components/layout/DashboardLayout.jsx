import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { HiOutlineChatAlt2 } from 'react-icons/hi';

const DashboardLayout = ({ theme, onToggleTheme }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:ml-[290px]">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />

        <main className="page-shell py-6 lg:py-7">
          <Outlet />
        </main>
      </div>

      <Link to="/contact" className="floating-support-button" aria-label="Hỗ trợ">
        <HiOutlineChatAlt2 className="h-5 w-5" />
      </Link>
    </div>
  );
};

export default DashboardLayout;
