import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { 
  Box, 
  Video, 
  ShieldCheck, 
  History, 
  ChevronRight, 
  Menu, 
  X, 
  Star, 
  Mail, 
  Globe, 
  Facebook,
  LogIn,
  UserPlus,
  CheckCircle2,
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  Search,
  Bell,
  Plus,
  Filter,
  MoreVertical,
  Play,
  Store,
  Users,
  CreditCard,
  PackageCheck,
  Trash2,
  Edit,
  Eye,
  TrendingUp,
  ArrowUpRight,
  QrCode
} from 'lucide-react';

// --- CMS Components ---
import CMSLayout from './components/cms/CMSLayout';
import Dashboard from './components/cms/Dashboard';
import VideoManagement from './components/cms/VideoManagement';
import StoreManagement from './components/cms/StoreManagement';
import StaffManagement from './components/cms/StaffManagement';
import SubscriptionManagement from './components/cms/SubscriptionManagement';

// --- Components ---

const CMS = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showQR, setShowQR] = useState<{ isOpen: boolean, plan: string | null }>({ isOpen: false, plan: null });
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);

  // Helper to show toast notifications
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // State for data
  const [videos, setVideos] = useState([
    { id: 'VID001', orderId: '#DH123456', store: 'Shop Mẹ Bé - CN1', time: '10:30, 01/03/2024', size: '15MB', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 'VID002', orderId: '#DH123458', store: 'Shop Mẹ Bé - CN1', time: '14:20, 01/03/2024', size: '12MB', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 'VID003', orderId: '#DH123459', store: 'Shop Mẹ Bé - CN2', time: '15:45, 01/03/2024', size: '18MB', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 'VID004', orderId: '#DH123460', store: 'Shop Mẹ Bé - CN1', time: '16:10, 01/03/2024', size: '14MB', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  ]);

  const [stores, setStores] = useState([
    { id: 'ST001', name: 'Shop Mẹ Bé - Chi nhánh 1', status: 'Hoạt động' },
    { id: 'ST002', name: 'Shop Mẹ Bé - Chi nhánh 2', status: 'Hoạt động' },
  ]);
  const [storeRefresh, setStoreRefresh] = useState(0); // increment to trigger reload
  const [staff, setStaff] = useState<any[]>([]);
  const staffLoadedRef = React.useRef(false);

  // Load staff list from API
  React.useEffect(() => {
    const fetchStaff = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const endpoint = `${apiBase}/api/v1/users?page=1&per_page=10`;
        const headers: Record<string, string> = { Accept: 'application/json, text/plain, */*' };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();
        const res = await fetch(endpoint, { method: 'GET', headers });
        const data = await res.json().catch(() => ({}));
        const ok = res.ok && (data?.status === true || data?.status_code === 0);
        if (!ok) {
          console.error('Failed to load staff', data);
          showToast('Tải danh sách nhân viên không thành công', 'error');
          return;
        }
        const rawList = Array.isArray(data?.data?.items)
          ? data.data.items
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.users)
          ? data.users
          : [];
        if (!Array.isArray(rawList)) return;
        const mapped = rawList.map((u: any) => ({
          ...u,
          id:
            (u.id !== undefined && u.id !== null
              ? String(u.id)
              : u.user_id !== undefined && u.user_id !== null
              ? String(u.user_id)
              : u.username || u.email || '') || '',
          name: u.full_name || u.name || u.username || u.email || 'Không rõ tên',
          role: u.role || u.role_name || 'Nhân viên',
          store: u.store || u.store_id || 'CN1',
          status: u.status || (u.is_active === false ? 'Offline' : 'Online'),
        }));
        setStaff(mapped);
      } catch (err) {
        console.error('Error fetching staff', err);
        showToast('Không thể tải danh sách nhân viên', 'error');
      }
    };
    const isStaffRoute = location.pathname === '/cms/staff';
    if (!isStaffRoute || staffLoadedRef.current) {
      return;
    }
    staffLoadedRef.current = true;
    fetchStaff();
  }, [location.pathname]);

  // Modal states
  const [videoModal, setVideoModal] = useState<{ isOpen: boolean, video: any | null }>({ isOpen: false, video: null });
  const [storeModal, setStoreModal] = useState<{ isOpen: boolean, store: any | null }>({ isOpen: false, store: null });
  const [staffModal, setStaffModal] = useState<{ isOpen: boolean, member: any | null }>({ isOpen: false, member: null });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, storeId: string | null, storeName: string }>({ isOpen: false, storeId: null, storeName: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [staffDeleteConfirm, setStaffDeleteConfirm] = useState<{ isOpen: boolean, userId: string | null, userName: string }>({ isOpen: false, userId: null, userName: '' });
  const [isDeletingStaff, setIsDeletingStaff] = useState(false);

  const pricingPlans = [
    { name: "Cơ bản", price: "Miễn phí", period: "Mãi mãi", features: ["Lưu trữ 50 video/tháng", "Chất lượng HD 720p", "Tìm kiếm theo mã đơn"] },
    { name: "Chuyên nghiệp", price: "199.000đ", period: "mỗi tháng", features: ["Lưu trữ 500 video/tháng", "Chất lượng Full HD 1080p", "Truy xuất nhanh 24/7"], highlight: true },
    { name: "Doanh nghiệp", price: "499.000đ", period: "mỗi tháng", features: ["Không giới hạn video", "Chất lượng 4K Ultra HD", "API tích hợp hệ thống"] }
  ];

  // Handlers
  const handleDeleteVideo = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa video này?')) {
      setVideos(videos.filter(v => v.id !== id));
    }
  };

  const handleDeleteStore = (id: string) => {
    const store = stores.find(s => s.id === id);
    setDeleteConfirm({ isOpen: true, storeId: id, storeName: store?.name || 'cửa hàng' });
  };

  const confirmDeleteStore = async () => {
    if (!deleteConfirm.storeId) return;
    setIsDeleting(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const endpoint = `${apiBase}/api/v1/store/${deleteConfirm.storeId}`;
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      headers['X-Timestamp'] = Date.now().toString();

      const res = await fetch(endpoint, { method: 'DELETE', headers });
      const data = await res.json().catch(() => ({}));
      const ok = res.ok && (data?.status === true || data?.status_code === 0);
      if (!ok) {
        console.error('Failed to delete store', data);
        showToast('Xóa cửa hàng không thành công', 'error');
      } else {
        setStores(stores.filter(s => s.id !== deleteConfirm.storeId));
        showToast('Xóa cửa hàng thành công', 'success');
      }
    } catch (err) {
      console.error('Delete request error', err);
      showToast('Không thể kết nối máy chủ', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ isOpen: false, storeId: null, storeName: '' });
    }
  };

  const handleDeleteStaff = (id: string) => {
    const user = staff.find(s => String(s.id) === String(id));
    setStaffDeleteConfirm({
      isOpen: true,
      userId: String(id),
      userName: user?.full_name || user?.name || user?.username || user?.email || 'nhân viên',
    });
  };

  const confirmDeleteStaff = async () => {
    if (!staffDeleteConfirm.userId) return;
    setIsDeletingStaff(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const endpoint = `${apiBase}/api/v1/users/${staffDeleteConfirm.userId}`;
      const headers: Record<string, string> = {
        Accept: 'application/json, text/plain, */*',
      };
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      headers['X-Timestamp'] = Date.now().toString();

      const res = await fetch(endpoint, { method: 'DELETE', headers });
      const data = await res.json().catch(() => ({}));
      const ok = res.ok && (data?.status === true || data?.status_code === 0);

      if (!ok) {
        console.error('Failed to delete user', data);
        showToast('Xóa nhân viên không thành công', 'error');
      } else {
        setStaff(prev => prev.filter(s => String(s.id) !== String(staffDeleteConfirm.userId)));
        showToast('Xóa nhân viên thành công', 'success');
      }
    } catch (err) {
      console.error('Delete user request error', err);
      showToast('Không thể kết nối máy chủ', 'error');
    } finally {
      setIsDeletingStaff(false);
      setStaffDeleteConfirm({ isOpen: false, userId: null, userName: '' });
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const logo = formData.get('logo') as string;
    const position = Number(formData.get('position')) || 0;

    // derive user_id from stored user_info if available, otherwise decode JWT
    let user_id: number | string = '';
    const stored = localStorage.getItem('user_info');
    if (stored) {
      try {
        const info = JSON.parse(stored);
        user_id = info.id || info.user_id || info.sub || info.userId || '';
      } catch {}
    }
    if (!user_id) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          user_id = payload.sub || payload.user_id || payload.id || '';
        } catch {}
      }
    }

    if (storeModal.store) {
      // Edit via API (call PUT)
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const endpoint = `${apiBase}/api/v1/store/${storeModal.store.id}`;
        const token = localStorage.getItem('token');

        const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();

        const numericUserId = user_id ? Number(user_id) : undefined;
        const body: any = {
          name,
          logo,
          position,
          id: storeModal.store.id,
        };
        if (numericUserId !== undefined && !isNaN(numericUserId)) body.user_id = numericUserId;

        const resp = await fetch(endpoint, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });
        const respData = await resp.json().catch(() => ({}));

        if (!resp.ok || !(respData?.status === true || respData?.status_code === 0)) {
          console.error('Store update failed', respData);
          showToast('Cập nhật cửa hàng không thành công: ' + (respData?.message || ''), 'error');
        } else {
          showToast('Cập nhật cửa hàng thành công!', 'success');
          // update local list with returned data when available
          if (respData?.data) {
            setStores(stores.map(s => (s.id === storeModal.store.id ? respData.data : s)));
          } else {
            setStores(stores.map(s => s.id === storeModal.store.id ? { ...s, name, logo, position } : s));
          }
        }
      } catch (err) {
        console.error('Failed to update store', err);
        showToast('Lỗi khi gọi API: ' + (err as any).toString(), 'error');
      }
    } else {
      // Add via API
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const endpoint = `${apiBase}/api/v1/store`;
        // ensure user_id is numeric
        const numericUserId = user_id ? Number(user_id) : undefined;
        const body: any = {
          name,
          logo,
          position
        };
        if (numericUserId !== undefined && !isNaN(numericUserId)) {
          body.user_id = numericUserId;
        }

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();

        const resp = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });
        const respData = await resp.json();
        if (!resp.ok || !(respData?.status === true || respData?.status_code === 0)) {
          console.error('Store create failed', respData);
          showToast('Thêm cửa hàng không thành công: ' + (respData?.message || 'Lỗi không xác định'), 'error');
        } else {
          showToast('Thêm cửa hàng thành công!', 'success');
          setStoreRefresh(r => r + 1);
          // if API returns the created store, update state accordingly
          if (respData?.data) {
            setStores(prev => [...prev, respData.data]);
          } else {
            setStores(prev => [...prev, { id: `ST${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, name, logo, position, status: 'Hoạt động' }]);
          }
        }
      } catch (err) {
        console.error('Failed to create store', err);
        showToast('Lỗi khi gọi API: ' + err, 'error');
      }
    }
    setStoreModal({ isOpen: false, store: null });
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const formEl = e.target as HTMLFormElement;
    const formData = new FormData(formEl);
    const isEdit = !!staffModal.member;

    const full_name = (formData.get('full_name') as string || '').trim();
    const email = (formData.get('email') as string || '').trim();
    const statusStr = formData.get('status') as string;
    const statusNum = Number(statusStr || 2); // default active

    const phone = (formData.get('phone') as string || '').trim();

    const username = !isEdit ? ((formData.get('username') as string) || '').trim() : '';
    const password = !isEdit ? ((formData.get('password') as string) || '').trim() : '';
    const confirm_password = !isEdit ? ((formData.get('confirm_password') as string) || '').trim() : '';

    if (!full_name || !email || (!isEdit && !username)) {
      showToast('Vui lòng nhập đầy đủ Username, Họ tên và Email', 'error');
      return;
    }

    if (!isEdit) {
      if (!password || !confirm_password) {
        showToast('Vui lòng nhập mật khẩu và xác nhận mật khẩu', 'error');
        return;
      }
      if (password !== confirm_password) {
        showToast('Mật khẩu xác nhận không khớp', 'error');
        return;
      }
    }

    try {
      // Lấy owner (user_id của user đang đăng nhập)
      let owner: number | string = '';
      const storedUser = localStorage.getItem('user_info');
      if (storedUser) {
        try {
          const info = JSON.parse(storedUser);
          owner = info.id || info.user_id || info.sub || info.userId || '';
        } catch {}
      }
      if (!owner) {
        const tokenRaw = localStorage.getItem('token');
        if (tokenRaw) {
          try {
            const payload = JSON.parse(atob(tokenRaw.split('.')[1]));
            owner = payload.sub || payload.user_id || payload.id || '';
          } catch {}
        }
      }
      const numericOwner = owner ? Number(owner) : NaN;

      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      headers['X-Timestamp'] = Date.now().toString();

      if (isEdit) {
        // Update existing staff via API
        const userId = Number(staffModal.member.id ?? staffModal.member.user_id);
        const endpoint = `${apiBase}/api/v1/users/${userId}`;
        const body = {
          user_id: userId,
          full_name,
          email,
          phone,
          status: statusNum,
        };

        const resp = await fetch(endpoint, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });
        const respData = await resp.json().catch(() => ({}));
        const ok = resp.ok && (respData?.status === true || respData?.status_code === 0);
        if (!ok) {
          console.error('Update staff failed', respData);
          showToast('Cập nhật nhân viên không thành công', 'error');
        } else {
          const updatedUser = respData?.data || {
            ...staffModal.member,
            full_name,
            email,
            status: statusNum,
          };
          setStaff(prev =>
            prev.map(s =>
              String(s.id) === String(userId) ? { ...s, ...updatedUser } : s
            )
          );
          showToast('Cập nhật nhân viên thành công', 'success');
        }
      } else {
        // Create new staff via API
        const endpoint = `${apiBase}/api/v1/users`;
        const body: any = {
          username,
          full_name,
          email,
          phone,
          status: statusNum,
          password,
          confirm_password,
        };

        if (!Number.isNaN(numericOwner)) {
          body.owner = Number(numericOwner);
        }

        const resp = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });
        const respData = await resp.json().catch(() => ({}));
        const ok = resp.ok && (respData?.status === true || respData?.status_code === 0);
        if (!ok) {
          console.error('Create staff failed', respData);
          showToast('Thêm nhân viên không thành công', 'error');
        } else {
          showToast('Thêm nhân viên thành công', 'success');
          // Reload page to get latest staff list from server
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      }

      setStaffModal({ isOpen: false, member: null });
    } catch (err) {
      console.error('Save staff error', err);
      showToast('Lỗi khi lưu nhân viên', 'error');
    }
  };

  return (
    <>
      <Routes>
        <Route element={
          <CMSLayout 
            onLogout={onLogout} 
            activeTab="" 
            showUpgrade={showUpgrade}
            onAddStore={() => setStoreModal({ isOpen: true, store: null })}
            onAddStaff={() => setStaffModal({ isOpen: true, member: null })}
          />
        }>
          <Route index element={
            <Dashboard 
              videos={videos} 
              stores={stores} 
              staff={staff} 
              onViewVideo={(vid) => setVideoModal({ isOpen: true, video: vid })}
              onDeleteVideo={handleDeleteVideo}
              onUpgrade={() => {
                setShowUpgrade(true);
                navigate('/cms/subscription');
              }}
            />
          } />
          <Route path="videos" element={
            <VideoManagement 
              videos={videos} 
              onViewVideo={(vid) => setVideoModal({ isOpen: true, video: vid })}
              onDeleteVideo={handleDeleteVideo}
            />
          } />
          <Route path="stores" element={
            <StoreManagement 
              stores={stores} 
              refreshKey={storeRefresh}
              onEditStore={(s) => setStoreModal({ isOpen: true, store: s })}
              onDeleteStore={handleDeleteStore}
              onAddStore={() => setStoreModal({ isOpen: true, store: null })}
              onViewStoreVideos={(s) => navigate('/cms/videos', { state: { filterStoreId: s.id, filterStoreName: s.name, page: 1, per_page: 10 } })}
            />
          } />
          <Route path="staff" element={
            <StaffManagement 
              staff={staff} 
              onEditStaff={(m) => setStaffModal({ isOpen: true, member: m })}
              onDeleteStaff={handleDeleteStaff}
            />
          } />
          <Route path="subscription" element={
            <SubscriptionManagement 
              showUpgrade={showUpgrade}
              setShowUpgrade={setShowUpgrade}
              pricingPlans={pricingPlans}
              onPay={() => {
                // Reload subscription page instead of showing QR
                navigate('/cms/subscription');
              }}
            />
          } />
        </Route>
      </Routes>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowQR({ isOpen: false, plan: null });
                navigate('/cms/subscription');
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 text-center shadow-2xl"
            >
              <button 
                onClick={() => {
                  setShowQR({ isOpen: false, plan: null });
                  navigate('/cms/subscription');
                }}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
              {/* Hide modal if plan is null */}
              {showQR.plan ? (
                <>
                  <div className="w-20 h-20 bg-brand/10 rounded-3xl flex items-center justify-center text-brand mx-auto mb-6">
                    <QrCode size={40} />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Quét mã thanh toán</h3>
                  <p className="text-slate-500 mb-8">Nâng cấp gói <span className="text-brand font-bold">{showQR.plan}</span></p>
                  <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 mb-8">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=LabBox-Payment-Demo" 
                      alt="QR Code Payment" 
                      className="w-48 h-48 mx-auto mix-blend-multiply"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-900 font-bold">Nội dung chuyển khoản:</p>
                    <p className="text-brand font-mono bg-brand/5 py-2 rounded-lg">LABBOX {typeof showQR.plan === 'string' ? showQR.plan.toUpperCase() : ''} SHOPMEBE</p>
                  </div>
                  <p className="mt-8 text-xs text-slate-400 italic">Hệ thống sẽ tự động kích hoạt sau khi nhận được thanh toán.</p>
                </>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {videoModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVideoModal({ isOpen: false, video: null })}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-3xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Xem Video: {videoModal.video?.orderId}</h3>
                <button onClick={() => setVideoModal({ isOpen: false, video: null })} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>
              <div className="aspect-video bg-black">
                <video 
                  src={videoModal.video?.url} 
                  controls 
                  autoPlay 
                  className="w-full h-full"
                />
              </div>
              <div className="p-6 bg-slate-50 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  <p>Cơ sở: {videoModal.video?.store}</p>
                  <p>Thời gian: {videoModal.video?.time}</p>
                </div>
                <button className="px-6 py-2 bg-brand text-white font-bold rounded-xl">Tải xuống</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Store Modal */}
      <AnimatePresence>
        {storeModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStoreModal({ isOpen: false, store: null })}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-display font-bold text-slate-900 mb-6">
                {storeModal.store ? 'Sửa cửa hàng' : 'Thêm cửa hàng mới'}
              </h3>
              <form onSubmit={handleSaveStore} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tên cửa hàng</label>
                  <input 
                    name="name"
                    defaultValue={storeModal.store?.name}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand transition-all"
                    placeholder="VD: Shop Mẹ Bé - CN3"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Logo URL</label>
                  <input
                    name="logo"
                    defaultValue={storeModal.store?.logo}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand transition-all"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vị trí</label>
                  <input
                    name="position"
                    type="number"
                    defaultValue={storeModal.store?.position || 1}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand transition-all"
                    placeholder="1"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setStoreModal({ isOpen: false, store: null })}
                    className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-xl"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 font-bold text-white bg-brand rounded-xl shadow-lg shadow-brand/20"
                  >
                    Lưu lại
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Staff Modal */}
      <AnimatePresence>
        {staffModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStaffModal({ isOpen: false, member: null })}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-display font-bold text-slate-900 mb-6">
                {staffModal.member ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}
              </h3>
              <form onSubmit={handleSaveStaff} className="space-y-4">
                {!staffModal.member && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                    <input
                      name="username"
                      defaultValue=""
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand transition-all"
                      placeholder="VD: test003"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Họ và tên</label>
                  <input 
                    name="full_name"
                    defaultValue={staffModal.member?.full_name || staffModal.member?.name}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand transition-all"
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                  <input 
                    name="email"
                    type="email"
                    defaultValue={staffModal.member?.email}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand transition-all"
                    placeholder="name@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Số điện thoại</label>
                  <input 
                    name="phone"
                    type="tel"
                    defaultValue={staffModal.member?.phone || ''}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand transition-all"
                    placeholder="VD: 0912345678"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Trạng thái</label>
                  <select 
                    name="status"
                    defaultValue={
                      staffModal.member
                        ? String(Number(staffModal.member.status) === 1 ? 1 : 2)
                        : '2'
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand transition-all"
                  >
                    <option value="2">Hoạt động</option>
                    <option value="1">Không hoạt động</option>
                  </select>
                </div>
                {!staffModal.member && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mật khẩu</label>
                      <input
                        name="password"
                        type="password"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Xác nhận mật khẩu</label>
                      <input
                        name="confirm_password"
                        type="password"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </>
                )}
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setStaffModal({ isOpen: false, member: null })}
                    className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-xl"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 font-bold text-white bg-brand rounded-xl shadow-lg shadow-brand/20"
                  >
                    Lưu lại
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Store Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm({ isOpen: false, storeId: null, storeName: '' })}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl"
            >
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
                  <Trash2 size={28} className="text-rose-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
                Xóa cửa hàng?
              </h3>
              <p className="text-slate-600 text-center mb-6">
                Bạn chắc chắn muốn xóa <strong>{deleteConfirm.storeName}</strong>? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, storeId: null, storeName: '' })}
                  className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteStore}
                  disabled={isDeleting}
                  className="flex-1 py-3 font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-70"
                >
                  {isDeleting ? 'Xóa...' : 'Xóa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Staff Confirmation Modal */}
      <AnimatePresence>
        {staffDeleteConfirm.isOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStaffDeleteConfirm({ isOpen: false, userId: null, userName: '' })}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl"
            >
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
                  <Trash2 size={28} className="text-rose-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
                Xóa nhân viên?
              </h3>
              <p className="text-slate-600 text-center mb-6">
                Bạn chắc chắn muốn xóa <strong>{staffDeleteConfirm.userName}</strong>? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStaffDeleteConfirm({ isOpen: false, userId: null, userName: '' })}
                  className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeleteStaff}
                  disabled={isDeletingStaff}
                  className="flex-1 py-3 font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-70"
                >
                  {isDeletingStaff ? 'Xóa...' : 'Xóa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-[300] space-y-3 max-w-sm">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`px-5 py-3.5 rounded-xl shadow-lg font-medium text-sm flex items-center gap-3 ${
                toast.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
              ) : (
                <svg className="w-5 h-5 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="flex-1">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

const Navbar = ({ onAuthClick }: { onAuthClick: (mode: 'login' | 'register') => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
              <Box className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-display font-bold tracking-tight text-slate-900">
              LabBox<span className="text-brand">™</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-brand transition-colors">Tính năng</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-brand transition-colors">Bảng giá</a>
            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-brand transition-colors">Về chúng tôi</a>
            <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-brand transition-colors">Liên hệ</a>
            <div className="h-4 w-[1px] bg-slate-200" />
            <button 
              onClick={() => onAuthClick('login')}
              className="text-sm font-semibold text-slate-900 hover:text-brand transition-colors"
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => onAuthClick('register')}
              className="bg-brand hover:bg-brand-dark text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              Dùng thử miễn phí
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-600">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-lg font-medium text-slate-900">Tính năng</a>
              <a href="#pricing" className="block text-lg font-medium text-slate-900">Bảng giá</a>
              <a href="#about" className="block text-lg font-medium text-slate-900">Về chúng tôi</a>
              <a href="#contact" className="block text-lg font-medium text-slate-900">Liên hệ</a>
              <div className="pt-4 space-y-3">
                <button 
                  onClick={() => { onAuthClick('login'); setIsOpen(false); }}
                  className="w-full py-3 text-center font-bold text-slate-900 border border-slate-200 rounded-xl"
                >
                  Đăng nhập
                </button>
                <button 
                  onClick={() => { onAuthClick('register'); setIsOpen(false); }}
                  className="w-full py-3 text-center font-bold text-white bg-brand rounded-xl"
                >
                  Đăng ký ngay
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const AuthModal = ({ isOpen, mode, onClose, onLoginSuccess }: { isOpen: boolean, mode: 'login' | 'register', onClose: () => void, onLoginSuccess: () => void }) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập';
    } else if (currentMode === 'register' && formData.username.length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }

    if (currentMode === 'register') {
      const phoneRegex = /^(0|84)(3|5|7|8|9)([0-9]{8})$/;
      if (!formData.phone || !phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Số điện thoại không hợp lệ (VD: 0912345678)';
      }

      if (!formData.password || formData.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }

      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Mật khẩu xác nhận không khớp';
      }
      
      if (!formData.full_name) {
        newErrors.full_name = 'Vui lòng nhập họ và tên hoặc tên shop';
      }

      if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email không hợp lệ';
      }
    } else {
      // Login mode validation
      if (!formData.password) {
        newErrors.password = 'Vui lòng nhập mật khẩu';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!validate()) return;

    setIsLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const endpoint = currentMode === 'login'
        ? `${apiBase}/api/v1/auth/login`
        : `${apiBase}/api/v1/auth/register`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'X-Timestamp': Date.now().toString()
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      // API may return 200 even on application-level failure; check data.status
      const apiSuccess = response.ok && (data?.status === true || data?.status_code === 0);
      if (apiSuccess) {
        if (currentMode === 'login') {
          setStatusMsg({
            type: 'success',
            text: 'Đăng nhập thành công! Đang vào hệ thống...'
          });
          // save token/user (API returns token in data.data.access_token)
          const token = data?.data?.access_token || data?.access_token || data?.token;
          if (token) localStorage.setItem('token', token);
          // store any returned data under user_info for debugging/usage
          localStorage.setItem('user_info', JSON.stringify(data.data || data || {}));
          localStorage.setItem('isLoggedIn', 'true');

          setTimeout(() => {
            onLoginSuccess();
            onClose();
          }, 1000);
        } else {
          setStatusMsg({ type: 'success', text: 'Đăng ký thành công!' });
          setTimeout(() => setCurrentMode('login'), 1500);
        }
      } else {
        setStatusMsg({
          type: 'error',
          text: data?.message || data?.errors?.[0] || (currentMode === 'login' ? 'Đăng nhập thất bại' : 'Đăng ký thất bại')
        });
      }
    } catch (error) {
      console.error('Auth Error:', error);
      setStatusMsg({ type: 'error', text: 'Không thể kết nối đến máy chủ.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`relative w-full ${currentMode === 'register' ? 'max-w-2xl' : 'max-w-md'} bg-white rounded-3xl shadow-2xl p-8 transition-all duration-300`}
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-3xl font-display font-bold text-slate-900">
            {currentMode === 'login' ? 'Chào mừng trở lại' : 'Bắt đầu với LabBox'}
          </h2>
          <p className="text-slate-500 mt-1">
            {currentMode === 'login' ? 'Đăng nhập để quản lý đơn hàng của bạn' : 'Tạo tài khoản để bảo vệ shop của bạn ngay hôm nay'}
          </p>
        </div>

        {statusMsg && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {statusMsg.text}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className={currentMode === 'register' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tên đăng nhập</label>
              <input 
                name="username"
                value={formData.username}
                onChange={handleChange}
                type="text" 
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.username ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`} 
                placeholder="username" 
              />
              {errors.username && <p className="text-red-500 text-[10px] mt-1">{errors.username}</p>}
            </div>

            {currentMode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và Tên / Tên Shop</label>
                  <input 
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    type="text" 
                    className={`w-full px-4 py-2.5 rounded-xl border ${errors.full_name ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`} 
                    placeholder="Nguyễn Văn A" 
                  />
                  {errors.full_name && <p className="text-red-500 text-[10px] mt-1">{errors.full_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    type="tel" 
                    className={`w-full px-4 py-2.5 rounded-xl border ${errors.phone ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`} 
                    placeholder="09xx xxx xxx" 
                  />
                  {errors.phone && <p className="text-red-500 text-[10px] mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email" 
                    className={`w-full px-4 py-2.5 rounded-xl border ${errors.email ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`} 
                    placeholder="name@company.com" 
                  />
                  {errors.email && <p className="text-red-500 text-[10px] mt-1">{errors.email}</p>}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu</label>
              <input 
                name="password"
                value={formData.password}
                onChange={handleChange}
                type="password" 
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.password ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`} 
                placeholder="••••••••" 
              />
              {errors.password && <p className="text-red-500 text-[10px] mt-1">{errors.password}</p>}
            </div>

            {currentMode === 'register' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Xác nhận mật khẩu</label>
                <input 
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  type="password" 
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.confirm_password ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`} 
                  placeholder="••••••••" 
                />
                {errors.confirm_password && <p className="text-red-500 text-[10px] mt-1">{errors.confirm_password}</p>}
              </div>
            )}
          </div>

          <button 
            disabled={isLoading}
            className="w-full py-3.5 bg-brand hover:bg-brand-dark disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-brand/20 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              currentMode === 'login' ? 'Đăng nhập' : 'Đăng ký tài khoản'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            {currentMode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button 
              onClick={() => {
                setCurrentMode(currentMode === 'login' ? 'register' : 'login');
                setStatusMsg(null);
                setErrors({});
              }}
              className="ml-1 text-brand font-bold hover:underline"
            >
              {currentMode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const LandingPage = ({ openAuth, authModal, closeAuth, setIsLoggedIn, onLoginSuccess }: any) => {
  return (
    <div className="min-h-screen font-sans">
      <Navbar onAuthClick={openAuth} />
      
      <AuthModal 
        isOpen={authModal.isOpen} 
        mode={authModal.mode} 
        onClose={closeAuth} 
        onLoginSuccess={onLoginSuccess || (() => setIsLoggedIn(true))}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 text-brand text-sm font-bold mb-6">
              <Star size={14} fill="currentColor" />
              Giải pháp số 1 cho nhà bán hàng
            </span>
            <h1 className="text-5xl lg:text-7xl font-display font-bold text-slate-900 leading-[1.1] mb-8">
              Quay video đóng hàng <br className="hidden md:block" />
              <span className="text-brand">Thông minh & Chuyên nghiệp</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed">
              LabBox cung cấp giải pháp lưu trữ bằng chứng đóng gói thông minh, giúp Sốp xóa tan nỗi lo bị 'tráo hàng' hay khiếu nại ảo từ khách hàng.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => openAuth('register')}
                className="w-full sm:w-auto px-8 py-4 bg-brand hover:bg-brand-dark text-white font-bold rounded-2xl shadow-xl shadow-brand/20 transition-all flex items-center justify-center gap-2 group"
              >
                Bắt đầu ngay miễn phí
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all">
                Xem demo sản phẩm
              </button>
            </div>

            {/* App Preview Placeholder */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mt-20 relative max-w-5xl mx-auto"
            >
              <div className="bg-slate-900 rounded-[2rem] p-2 shadow-2xl overflow-hidden border-4 border-slate-800">
                <div className="aspect-video bg-slate-800 rounded-[1.5rem] flex items-center justify-center relative overflow-hidden">
                  <img 
                    src="https://picsum.photos/seed/labbox-app/1200/800" 
                    alt="LabBox App Interface" 
                    className="w-full h-full object-cover opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <div className="absolute bottom-8 left-8 text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-white font-mono text-sm">RECORDING... 00:12:45</span>
                    </div>
                    <p className="text-white/80 text-sm font-medium">Đơn hàng: #DH123456 - Shop Mẹ Bé</p>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Bảo vệ</p>
                    <p className="text-sm font-bold text-slate-900">100% Evidence Safe</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-display font-bold text-slate-900 mb-4">Tại sao nên chọn LabBox?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Chúng tôi hiểu những khó khăn của nhà bán hàng Online. LabBox được thiết kế để giải quyết triệt để các vấn đề đó.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Video className="w-8 h-8 text-brand" />,
                title: "Quay video 4K",
                desc: "Ghi lại mọi chi tiết quá trình đóng gói với chất lượng cao nhất, không bỏ sót bất kỳ công đoạn nào."
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-brand" />,
                title: "Bằng chứng thép",
                desc: "Video được lưu trữ an toàn với mã hóa, là bằng chứng không thể chối cãi khi có khiếu nại tráo hàng."
              },
              {
                icon: <History className="w-8 h-8 text-brand" />,
                title: "Truy xuất tức thì",
                desc: "Tìm kiếm video theo mã vận đơn hoặc số điện thoại khách hàng chỉ trong vài giây."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:shadow-brand/5 transition-all"
              >
                <div className="mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-display font-bold text-slate-900 mb-4">Gói dịch vụ linh hoạt</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Chọn gói phù hợp với quy mô kinh doanh của bạn. Nâng cấp hoặc hạ cấp bất cứ lúc nào.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Cơ bản",
                price: "Miễn phí",
                period: "Mãi mãi",
                desc: "Dành cho các shop mới bắt đầu kinh doanh.",
                features: ["Lưu trữ 50 video/tháng", "Chất lượng HD 720p", "Tìm kiếm theo mã đơn", "Hỗ trợ qua email"],
                button: "Bắt đầu ngay",
                highlight: false
              },
              {
                name: "Chuyên nghiệp",
                price: "199.000đ",
                period: "mỗi tháng",
                desc: "Dành cho các shop có lượng đơn ổn định.",
                features: ["Lưu trữ 500 video/tháng", "Chất lượng Full HD 1080p", "Truy xuất nhanh 24/7", "Hỗ trợ ưu tiên 24/7", "Báo cáo thống kê"],
                button: "Dùng thử 7 ngày",
                highlight: true
              },
              {
                name: "Doanh nghiệp",
                price: "499.000đ",
                period: "mỗi tháng",
                desc: "Giải pháp tối ưu cho kho hàng lớn.",
                features: ["Không giới hạn video", "Chất lượng 4K Ultra HD", "API tích hợp hệ thống", "Quản lý nhiều kho hàng", "Account Manager riêng"],
                button: "Liên hệ tư vấn",
                highlight: false
              }
            ].map((plan, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className={`p-8 rounded-[2.5rem] border transition-all relative ${
                  plan.highlight 
                    ? 'bg-white border-brand shadow-2xl shadow-brand/10 z-10' 
                    : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Phổ biến nhất
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-display font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-500 text-sm">/{plan.period}</span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">{plan.desc}</p>
                </div>
                
                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-slate-600">
                      <CheckCircle2 size={18} className="text-brand flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => openAuth('register')}
                  className={`w-full py-4 rounded-2xl font-bold transition-all ${
                    plan.highlight 
                      ? 'bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/20' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                  }`}
                >
                  {plan.button}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section (Based on Image Content) */}
      <section id="about" className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand/10 rounded-full blur-2xl" />
              <img 
                src="https://picsum.photos/seed/labbox-team/800/1000" 
                alt="LabBox Team" 
                className="rounded-[2.5rem] shadow-2xl relative z-10"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-brand font-display font-bold text-xl mb-4">Chúng tôi là ai?</h2>
              <h3 className="text-4xl font-display font-bold text-slate-900 mb-6">Sứ mệnh bảo vệ nhà bán hàng Việt</h3>
              <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                <p>
                  Chúng tôi cung cấp giải pháp lưu trữ bằng chứng đóng gói thông minh, giúp Sốp xóa tan nỗi lo bị 'tráo hàng' hay khiếu nại ảo.
                </p>
                <p>
                  Hy vọng ứng dụng giúp Sốp an tâm hơn mỗi khi đóng hàng. Nếu hài lòng, hãy tặng chúng tôi 5 sao để đội ngũ có thêm động lực hoàn thiện công cụ bảo vệ người bán nhé!
                </p>
                <div className="pt-4 flex items-center gap-6">
                  <div className="flex items-center gap-1 text-brand">
                    {[...Array(5)].map((_, i) => <Star key={i} size={24} fill="currentColor" />)}
                  </div>
                  <span className="font-bold text-slate-900">Đánh giá 5 sao từ 1000+ Shop</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -ml-32 -mb-32" />
            
            <h2 className="text-4xl lg:text-6xl font-display font-bold text-white mb-8 relative z-10">
              Sẵn sàng bảo vệ <br /> doanh nghiệp của bạn?
            </h2>
            <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto relative z-10">
              Tham gia cùng hàng nghìn chủ shop đã tin dùng LabBox để tối ưu quy trình vận hành và giảm thiểu rủi ro.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <button 
                onClick={() => openAuth('register')}
                className="w-full sm:w-auto px-10 py-5 bg-brand hover:bg-brand-dark text-white font-bold rounded-2xl shadow-xl shadow-brand/20 transition-all"
              >
                Đăng ký dùng thử ngay
              </button>
              <button className="w-full sm:w-auto px-10 py-5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl backdrop-blur-md transition-all">
                Liên hệ tư vấn
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-slate-50 pt-20 pb-10 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                  <Box className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-display font-bold tracking-tight text-slate-900">
                  LabBox<span className="text-brand">™</span>
                </span>
              </div>
              <p className="text-slate-500 max-w-sm mb-8">
                Ứng dụng hỗ trợ quay video đóng hàng thông minh. Giải pháp tối ưu cho nhà bán hàng thời đại số.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-brand hover:border-brand transition-all">
                  <Facebook size={20} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-brand hover:border-brand transition-all">
                  <Globe size={20} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-brand hover:border-brand transition-all">
                  <Mail size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Liên hệ với chúng tôi</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-600">
                  <Mail size={16} className="text-brand" />
                  <span>support@moblab.io</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Mail size={16} className="text-brand" />
                  <span>info@moblab.io</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Globe size={16} className="text-brand" />
                  <span>moblab.io</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <Facebook size={16} className="text-brand" />
                  <span>@moblab.io</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Sản phẩm</h4>
              <ul className="space-y-4">
                <li><a href="#features" className="text-slate-600 hover:text-brand transition-colors">Tính năng</a></li>
                <li><a href="#pricing" className="text-slate-600 hover:text-brand transition-colors">Bảng giá</a></li>
                <li><a href="#about" className="text-slate-600 hover:text-brand transition-colors">Về chúng tôi</a></li>
                <li><a href="#" className="text-slate-600 hover:text-brand transition-colors">Chính sách bảo mật</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              © 2024 LabBox by MOBLAB. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  
  const [authModal, setAuthModal] = useState<{ isOpen: boolean, mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login'
  });

  const openAuth = (mode: 'login' | 'register') => setAuthModal({ isOpen: true, mode });
  const closeAuth = () => setAuthModal({ ...authModal, isOpen: false });

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
    setIsLoggedIn(false);
    navigate('/');
  };

  // Redirect to CMS if logged in and trying to access landing page
  React.useEffect(() => {
    if (isLoggedIn && location.pathname === '/') {
      navigate('/cms');
    }
  }, [isLoggedIn, location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/" element={
        <LandingPage 
          openAuth={openAuth} 
          authModal={authModal} 
          closeAuth={closeAuth} 
          setIsLoggedIn={setIsLoggedIn} 
          onLoginSuccess={() => { setIsLoggedIn(true); navigate('/cms'); }}
        />
      } />
      <Route path="/cms/*" element={
        <ProtectedRoute>
          <CMS onLogout={handleLogout} />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
