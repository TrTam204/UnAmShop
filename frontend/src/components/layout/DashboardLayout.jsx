import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-72">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="page-shell py-5 lg:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
