import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  Box, 
  LayoutDashboard, 
  Store, 
  Users, 
  PackageCheck, 
  LogOut, 
  Search, 
  Bell, 
  Plus 
} from 'lucide-react';

interface CMSLayoutProps {
  onLogout: () => void;
  activeTab: string;
  showUpgrade: boolean;
  onAddStore: () => void;
  onAddStaff: () => void;
}

const CMSLayout: React.FC<CMSLayoutProps> = ({ onLogout, onAddStore, onAddStaff }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const sidebarItems = [
    { id: 'dashboard', path: '/cms', icon: <LayoutDashboard size={20} />, label: 'Tổng quan' },
    { id: 'stores-videos', path: '/cms/stores', icon: <Store size={20} />, label: 'Quản lý cửa hàng và video' },
    { id: 'staff', path: '/cms/staff', icon: <Users size={20} />, label: 'Quản lý nhân viên' },
    { id: 'subscription', path: '/cms/subscription', icon: <PackageCheck size={20} />, label: 'Quản lý gói đã đăng ký' },
  ];

  const activeItem = sidebarItems.find(item => item.path === currentPath) || sidebarItems[0];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <Box className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-display font-bold text-slate-900">LabBox<span className="text-brand">™</span></span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                currentPath === item.path 
                  ? 'bg-brand/10 text-brand' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-xl w-96">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm thông tin..." 
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">Shop Mẹ Bé</p>
                <p className="text-xs text-slate-500">Gói Chuyên nghiệp</p>
              </div>
              <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold">
                MB
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900">
                {activeItem.label}
              </h1>
              <p className="text-slate-500 text-sm mt-1">Quản lý hệ thống LabBox của bạn</p>
            </div>
            <div className="flex gap-3">
              {activeItem.id === 'stores-videos' && (
                <button 
                  onClick={onAddStore}
                  className="bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand/20 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Plus size={20} />
                  Thêm cửa hàng mới
                </button>
              )}
              {activeItem.id === 'staff' && (
                <button 
                  onClick={onAddStaff}
                  className="bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand/20 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Plus size={20} />
                  Thêm nhân viên mới
                </button>
              )}
            </div>
          </div>

          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CMSLayout;
