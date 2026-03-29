import React, { useEffect, useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { 
  Box, 
  LayoutDashboard, 
  Store, 
  Users, 
  PackageCheck, 
  LogOut, 
  Search, 
  Bell, 
  Plus,
  ArrowLeft,
  ChevronLeft,
  Menu
} from 'lucide-react';

import NotFound from '../ui/NotFound';

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
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('—');
  const [userEmail, setUserEmail] = useState<string>('');
  const [planName, setPlanName] = useState<string>('—');
  const [avatarText, setAvatarText] = useState<string>('LB');
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  const sidebarItems = [
    { id: 'dashboard', path: '/cms', icon: <LayoutDashboard size={20} />, label: 'Tổng quan' },
    { id: 'stores-videos', path: '/cms/stores', icon: <Store size={20} />, label: 'Quản lý cửa hàng và video' },
    { id: 'staff', path: '/cms/staff', icon: <Users size={20} />, label: 'Quản lý nhân viên' },
    { id: 'subscription', path: '/cms/subscription', icon: <PackageCheck size={20} />, label: 'Quản lý gói đã đăng ký' },
  ];

  const filteredSidebarItems = sidebarItems.filter(item => {
    if (!isAuthLoaded) return true; // Show by default until loaded to avoid layout jumps
    if (item.id === 'stores-videos') {
      return permissions.includes('store.list') || permissions.includes('stores.read') || 
             permissions.includes('video.list') || permissions.includes('videos.read');
    }
    if (item.id === 'staff') {
      return permissions.includes('user.list') || permissions.includes('users.read') || permissions.includes('user.view');
    }
    if (item.id === 'subscription') {
      return permissions.includes('user.subscription.create') || permissions.includes('user.subscription.update');
    }
    return true; // Dashboard always visible
  });

  const activeItem = filteredSidebarItems.find(item => item.path === currentPath) || filteredSidebarItems[0];
  
  // Kiểm tra nếu đường dẫn hiện tại nằm trong sidebarItems nhưng lại bị loại khỏi filteredSidebarItems (do không đủ quyền)
  const isRestricted = isAuthLoaded && 
                       sidebarItems.some(item => item.path === currentPath) && 
                       !filteredSidebarItems.some(item => item.path === currentPath);

  useEffect(() => {
    const setFromLocal = () => {
      try {
        const raw = localStorage.getItem('user_info');
        if (!raw) return;
        const info = JSON.parse(raw);
        const name =
          info.full_name ||
          info.name ||
          info.username ||
          info.email ||
          '—';
        setUserName(String(name));
        setUserEmail(String(info.email || ''));
        const rolesArr = Array.isArray(info.roles) ? info.roles : [];
        const rolesDesc = rolesArr.length ? rolesArr.map((r: any) => r?.description || r?.name).filter(Boolean).join(' • ') : '—';
        setPlanName(String(rolesDesc));
        const initials = String(name)
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((s: string) => s[0])
          .join('')
          .toUpperCase();
        setAvatarText(initials || 'LB');

        const perms = new Set<string>();
        rolesArr.forEach((r: any) => {
          if (Array.isArray(r.permissions)) {
            r.permissions.forEach((p: any) => perms.add(p.name));
          }
        });
        setPermissions(Array.from(perms));
        setIsAuthLoaded(true);
      } catch {}
    };
    const fetchMe = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/auth/me`;
        const headers: Record<string, string> = { Accept: 'application/json, text/plain, */*' };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();
        const res = await fetch(endpoint, { headers });
        const data = await res.json().catch(() => ({}));
        
        if (res.status === 401 || data?.status_code === 401 || data?.message?.toLowerCase()?.includes('unauthenticated')) {
          onLogout();
          return;
        }

        const ok = res.ok && (data?.status === true || data?.status_code === 0 || data?.success === true);
        if (!ok) {
          setFromLocal();
          return;
        }
        const info = data?.data?.user ?? data?.data ?? data?.user ?? {};
        const name =
          info.full_name ||
          info.name ||
          info.username ||
          info.email ||
          '—';
        setUserName(String(name));
        setUserEmail(String(info.email || ''));
        const rolesArr = Array.isArray(data?.data?.roles)
          ? data.data.roles
          : Array.isArray(info.roles)
          ? info.roles
          : [];
        const rolesDesc = rolesArr.length
          ? rolesArr.map((r: any) => r?.description || r?.name).filter(Boolean).join(' • ')
          : '—';
        setPlanName(String(rolesDesc));
        try {
          localStorage.setItem('user_info', JSON.stringify({ ...info, roles: rolesArr }));
        } catch {}
        const initials = String(name)
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((s: string) => s[0])
          .join('')
          .toUpperCase();
        setAvatarText(initials || 'LB');
        
        const perms = new Set<string>();
        rolesArr.forEach((r: any) => {
          if (Array.isArray(r.permissions)) {
            r.permissions.forEach((p: any) => perms.add(p.name));
          }
        });
        setPermissions(Array.from(perms));
        setIsAuthLoaded(true);
      } catch {
        setFromLocal();
      }
    };
    fetchMe();
  }, []);
  
  const goProfile = () => {
    setProfileOpen(false);
    navigate('/cms/profile');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 relative`}>
        <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} transition-all`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <img src="/logo.png" alt="LabBox Logo" className="w-8 h-8 object-contain rounded-lg flex-shrink-0" />
            {!isSidebarCollapsed && <span className="text-xl font-display font-bold text-slate-900 truncate">LabBox</span>}
          </div>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`absolute -right-3 top-7 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-brand hover:border-brand shadow-sm z-10 transition-all ${isSidebarCollapsed ? 'rotate-180' : ''}`}
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {filteredSidebarItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold transition-all ${
                currentPath === item.path 
                  ? 'bg-brand/10 text-brand' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all`}
            title={isSidebarCollapsed ? 'Đăng xuất' : ''}
          >
            <div className="flex-shrink-0"><LogOut size={20} /></div>
            {!isSidebarCollapsed && <span className="truncate">Đăng xuất</span>}
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

          <div className="flex items-center gap-4 relative">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2" />
            <button
              onClick={() => setProfileOpen(p => !p)}
              className="flex items-center gap-3 hover:bg-slate-50 px-3 py-2 rounded-xl"
              title="Thông tin người dùng"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{userName}</p>
                <p className="text-xs text-slate-500">{planName}</p>
              </div>
              <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold">
                {avatarText}
              </div>
            </button>
            {profileOpen && (
              <div
                className="fixed inset-0 z-10"
                onClick={() => setProfileOpen(false)}
              />
            )}
            {profileOpen && (
              <div className="absolute right-0 top-14 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-20">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900">{userName}</p>
                  {userEmail ? <p className="text-xs text-slate-500">{userEmail}</p> : null}
                </div>
                <div className="p-2">
                  <button
                    onClick={goProfile}
                    className="w-full text-left px-4 py-2 rounded-xl hover:bg-slate-50 text-sm font-bold"
                  >
                    Trang cá nhân
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 rounded-xl hover:bg-rose-50 text-rose-600 text-sm font-bold"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 p-8 overflow-y-auto no-scrollbar">
          {currentPath !== '/cms/profile' && (
            <div className="flex-shrink-0 flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                {currentPath !== '/cms' && (
                  <button
                    onClick={() => navigate(-1)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-brand hover:text-brand hover:bg-brand/5 shadow-sm transition-all active:scale-95"
                    title="Quay lại trang trước"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <div>
                  <h1 className="text-2xl font-display font-bold text-slate-900">
                    {activeItem?.label}
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">Quản lý hệ thống LabBox của bạn</p>
                </div>
              </div>
              <div className="flex gap-3">
                {activeItem?.id === 'stores-videos' && (!isAuthLoaded || permissions.includes('store.create') || permissions.includes('stores.write')) && (
                  <button 
                    onClick={onAddStore}
                    className="bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand/20 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Plus size={20} />
                    Thêm cửa hàng mới
                  </button>
                )}
                {activeItem?.id === 'staff' && (!isAuthLoaded || permissions.includes('user.create') || permissions.includes('users.write')) && (
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
          )}

          <div className="flex-1 min-h-0 h-full">
            {isRestricted ? <NotFound /> : <Outlet />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CMSLayout;
