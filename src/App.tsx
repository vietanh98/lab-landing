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
  Headset,
  Info,
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
  EyeOff,
  TrendingUp,
  ArrowUpRight,
  QrCode,
  Lock,
  ChevronLeft,
  MessageCircle,
  User,
  Phone,
  Shield,
  Clock
} from 'lucide-react';

// --- CMS Components ---
import CMSLayout from './components/cms/CMSLayout';
import Dashboard from './components/cms/Dashboard';
import VideoManagement from './components/cms/VideoManagement';
import StoreManagement from './components/cms/StoreManagement';
import StaffManagement from './components/cms/StaffManagement';
import SubscriptionManagement from './components/cms/SubscriptionManagement';
import Profile from './components/cms/Profile';

// --- Components ---
declare var grecaptcha: any;

const CMS = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showQR, setShowQR] = useState<{ isOpen: boolean, plan: string | null }>({ isOpen: false, plan: null });
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error'; message: string }>>([]);
  const meLoadedRef = React.useRef(false);
  const [dashboardMetrics, setDashboardMetrics] = useState<any | null>(null);

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
  const videosLoadedRef = React.useRef(false);
  const storesLoadedRef = React.useRef(false);
  const [roles, setRoles] = useState<any[]>([]);
  const rolesLoadedRef = React.useRef(false);

  // Load current user via auth/me
  React.useEffect(() => {
    const fetchMe = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/auth/me`;
        const headers: Record<string, string> = {
          Accept: 'application/json, text/plain, */*',
        };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();
        const res = await fetch(endpoint, { method: 'GET', headers });
        const data = await res.json().catch(() => ({}));
        const ok = res.ok && (data?.status === true || data?.status_code === 0 || data?.success === true);
        if (!ok) {
          return;
        }
        const infoCandidate = data?.data?.user ?? data?.data ?? data?.user ?? data;
        if (infoCandidate && typeof infoCandidate === 'object') {
          try {
            localStorage.setItem('user_info', JSON.stringify(infoCandidate));
          } catch { }
        }
        const dash = data?.data?.dashboard;
        if (dash && typeof dash === 'object') {
          setDashboardMetrics(dash);
        }
      } catch { }
    };
    if (meLoadedRef.current) return;
    meLoadedRef.current = true;
    fetchMe();
  }, []);

  // Load recent videos for Dashboard
  React.useEffect(() => {
    const fetchVideos = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/video/list?page=1&per_page=10`;
        const headers: Record<string, string> = {
          Accept: 'application/json, text/plain, */*',
        };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();
        const res = await fetch(endpoint, { method: 'GET', headers });
        const data = await res.json().catch(() => ({}));
        const ok = res.ok && (data?.status === true || data?.status_code === 0);
        if (!ok) {
          return;
        }
        const candidate =
          data?.data?.data ??
          data?.data?.items ??
          data?.data ??
          data?.videos ??
          data ??
          [];
        const list = Array.isArray(candidate)
          ? candidate
          : (Array.isArray(candidate?.data) ? candidate.data : []);
        const mapped = list.map((v: any) => {
          const bytes = v.size_bytes;
          const sizeStr = typeof bytes === 'number' ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : '';
          return {
            id: String(v.id ?? v.video_id ?? v.uuid ?? ''),
            orderId: String(v.qr_code_1 ?? v.qr_code_2 ?? v.order_id ?? v.title ?? ''),
            store: String(v.store_name ?? v.store ?? ''),
            time: v.recorded_at ?? v.created_at ?? '',
            size: sizeStr,
            url: v.file_path ?? '',
          };
        });
        setVideos(mapped);
      } catch { }
    };
    if (videosLoadedRef.current) return;
    videosLoadedRef.current = true;
    fetchVideos();
  }, []);

  // Load stores list for Dashboard counts
  React.useEffect(() => {
    const fetchStores = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/store?page=1&per_page=10`;
        const headers: Record<string, string> = { Accept: 'application/json' };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();
        const res = await fetch(endpoint, { method: 'GET', headers });
        const data = await res.json().catch(() => ({}));
        const ok = res.ok && (data?.status === true || data?.status_code === 0);
        if (!ok) {
          return;
        }
        const listCandidate = data?.data?.data ?? data?.data ?? data?.stores ?? data ?? [];
        const items = Array.isArray(listCandidate)
          ? listCandidate
          : (Array.isArray(listCandidate?.data) ? listCandidate.data : []);
        setStores(items);
      } catch { }
    };
    if (storesLoadedRef.current) return;
    storesLoadedRef.current = true;
    fetchStores();
  }, []);
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

  // Load roles list from API
  React.useEffect(() => {
    const fetchRoles = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/rbac/roles`;
        const headers: Record<string, string> = { Accept: 'application/json, text/plain, */*' };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();
        const res = await fetch(endpoint, { method: 'GET', headers });
        const data = await res.json().catch(() => ({}));
        const ok = res.ok && (data?.status === true || data?.status_code === 0);
        if (ok) {
          const listCandidate = data?.data?.data ?? data?.data ?? data?.roles ?? data ?? [];
          const items = Array.isArray(listCandidate) ? listCandidate : (Array.isArray(listCandidate?.data) ? listCandidate.data : []);
          setRoles(items);
        }
      } catch (err) {
        console.error('Error fetching roles', err);
      }
    };
    if (rolesLoadedRef.current) return;
    rolesLoadedRef.current = true;
    fetchRoles();
  }, []);

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
        setStoreRefresh(r => r + 1);
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
    const position = Number(formData.get('position')) || 0;

    // derive user_id from stored user_info if available, otherwise decode JWT
    let user_id: number | string = '';
    const stored = localStorage.getItem('user_info');
    if (stored) {
      try {
        const info = JSON.parse(stored);
        user_id = info.id || info.user_id || info.sub || info.userId || '';
      } catch { }
    }
    if (!user_id) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          user_id = payload.sub || payload.user_id || payload.id || '';
        } catch { }
      }
    }

    if (storeModal.store) {
      // Edit via API (multipart PUT)
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/store/${storeModal.store.id}`;
        const token = localStorage.getItem('token');

        const headers: Record<string, string> = { Accept: 'application/json, text/plain, */*' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();

        const numericUserId = user_id ? Number(user_id) : undefined;
        const req = new FormData();
        req.append('name', name);
        req.append('position', String(position));
        if (numericUserId !== undefined && !isNaN(numericUserId)) req.append('user_id', String(numericUserId));
        const files = formData.getAll('images');
        files.forEach((f) => {
          if (f instanceof File) req.append('images', f);
        });

        const resp = await fetch(endpoint, {
          method: 'PUT',
          headers,
          body: req,
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
            setStores(stores.map(s => s.id === storeModal.store.id ? { ...s, name, position } : s));
          }
          setStoreRefresh(r => r + 1);
        }
      } catch (err) {
        console.error('Failed to update store', err);
        showToast('Lỗi khi gọi API: ' + (err as any).toString(), 'error');
      }
    } else {
      // Add via API (multipart POST)
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/store`;
        // ensure user_id is numeric
        const numericUserId = user_id ? Number(user_id) : undefined;
        const req = new FormData();
        req.append('name', name);
        req.append('position', String(position));
        if (numericUserId !== undefined && !isNaN(numericUserId)) req.append('user_id', String(numericUserId));
        const files = formData.getAll('images');
        files.forEach((f) => {
          if (f instanceof File) req.append('images', f);
        });

        const headers: Record<string, string> = { Accept: 'application/json, text/plain, */*' };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();

        const resp = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: req
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
            setStores(prev => [...prev, { id: `ST${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, name, position, status: 'Hoạt động' }]);
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
    const role_id = formData.get('role_id') as string;

    const username = !isEdit ? ((formData.get('username') as string) || '').trim() : '';
    const password = !isEdit ? ((formData.get('password') as string) || '').trim() : '';
    const confirm_password = !isEdit ? ((formData.get('confirm_password') as string) || '').trim() : '';

    if (!full_name || !email || (!isEdit && !username)) {
      showToast('Vui lòng nhập đầy đủ Username, Họ tên và Email', 'error');
      return;
    }

    if (!role_id) {
      showToast('Vui lòng chọn vai trò cho nhân viên', 'error');
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
        } catch { }
      }
      if (!owner) {
        const tokenRaw = localStorage.getItem('token');
        if (tokenRaw) {
          try {
            const payload = JSON.parse(atob(tokenRaw.split('.')[1]));
            owner = payload.sub || payload.user_id || payload.id || '';
          } catch { }
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

      const assignRoleToUser = async (userId: number, roleId: number) => {
        try {
          const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
          const token = localStorage.getItem('token');
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          };
          if (token) headers['Authorization'] = `Bearer ${token}`;
          headers['X-Timestamp'] = Date.now().toString();

          const endpoint = `${apiBase}/api/v1/rbac/users/${userId}/roles`;
          await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({ id: userId, role_ids: [roleId] }),
          });
        } catch (err) {
          console.error('RBAC assign role failed', err);
        }
      };

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
          role_id: role_id ? Number(role_id) : undefined,
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
          // Assign role via RBAC API
          if (role_id) {
            await assignRoleToUser(userId, Number(role_id));
          }

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
          role_id: role_id ? Number(role_id) : undefined,
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
          // Assign role via RBAC API
          const newUserId = respData?.data?.id || respData?.data?.user_id;
          if (newUserId && role_id) {
            await assignRoleToUser(Number(newUserId), Number(role_id));
          }

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
              metrics={dashboardMetrics}
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
              currentSubscriptions={dashboardMetrics?.subscriptions || []}
              onPay={() => {
                // Reload subscription page instead of showing QR
                navigate('/cms/subscription');
              }}
            />
          } />
          <Route path="profile" element={<Profile />} />
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

      {/* Zalo Chat Button */}
      {(() => {
        const zaloLink = import.meta.env.VITE_ZALO_LINK || 'http://zalo.me/2667033808364818533?src=qr';
        return (
          <a
            href={zaloLink}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-[500] px-4 py-3 rounded-full bg-[#016EF4] text-white font-bold shadow-xl hover:bg-[#0159c7] active:scale-95 transition-all flex items-center gap-2"
            aria-label="Chat Zalo"
            title="Chat Zalo"
          >
            <MessageCircle size={18} className="text-white" />
            Zalo Chat
          </a>
        );
      })()}

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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Logo (ảnh)</label>
                  <input
                    name="images"
                    type="file"
                    multiple={!storeModal.store}
                    accept="image/*"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand transition-all"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Chọn 1 hoặc nhiều ảnh logo để tải lên</p>
                  {storeModal.store ? (
                    (() => {
                      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                      const base = apiBase.replace(/\/+$/, '');
                      const candidate = Array.isArray(storeModal.store?.images) && storeModal.store?.images.length
                        ? storeModal.store.images[0]
                        : storeModal.store?.logo;
                      const src = typeof candidate === 'string'
                        ? ((candidate.startsWith('http://') || candidate.startsWith('https://'))
                          ? candidate
                          : `${base}${candidate.startsWith('/') ? candidate : `/${candidate}`}`)
                        : '';
                      return (
                        <div className="mt-3 flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                            {src ? (
                              <img src={src} alt={storeModal.store?.name || 'logo'} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-slate-400 text-xs">No logo</div>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">Ảnh hiện tại</span>
                        </div>
                      );
                    })()
                  ) : null}
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setStaffModal({ isOpen: false, member: null })}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-8">
                <h3 className="text-3xl font-display font-bold text-slate-900 mb-2">
                  {staffModal.member ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
                </h3>
                <p className="text-slate-500 text-sm">Điền thông tin chi tiết để quản lý nhân sự hiệu quả hơn</p>
              </div>

              <form onSubmit={handleSaveStaff} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {!staffModal.member && (
                    <div className="group">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">
                        <User size={14} /> Username
                      </label>
                      <input
                        name="username"
                        defaultValue=""
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-slate-900 font-medium"
                        placeholder="VD: test003"
                      />
                    </div>
                  )}
                  <div className={`group ${staffModal.member ? 'col-span-2' : ''}`}>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">
                      <User size={14} /> Họ và tên
                    </label>
                    <input
                      name="full_name"
                      defaultValue={staffModal.member?.full_name || staffModal.member?.name}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-slate-900 font-medium"
                      placeholder="VD: Nguyễn Văn A"
                    />
                  </div>

                  <div className="group">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">
                      <Mail size={14} /> Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      defaultValue={staffModal.member?.email}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-slate-900 font-medium"
                      placeholder="name@company.com"
                    />
                  </div>

                  <div className="group">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">
                      <Phone size={14} /> Số điện thoại
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      defaultValue={staffModal.member?.phone || ''}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-slate-900 font-medium"
                      placeholder="VD: 0912345678"
                    />
                  </div>

                  <div className="group">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">
                      <Shield size={14} /> Vai trò
                    </label>
                    <select
                      name="role_id"
                      defaultValue={staffModal.member?.roles?.[0]?.id || staffModal.member?.role_id}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-slate-900 font-medium appearance-none cursor-pointer"
                    >
                      <option value="">Chọn vai trò</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="group">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">
                      <Clock size={14} /> Trạng thái
                    </label>
                    <select
                      name="status"
                      defaultValue={
                        staffModal.member
                          ? String(Number(staffModal.member.status) === 1 ? 1 : 2)
                          : '2'
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-slate-900 font-medium appearance-none cursor-pointer"
                    >
                      <option value="2">Hoạt động</option>
                      <option value="1">Không hoạt động</option>
                    </select>
                  </div>

                  {!staffModal.member && (
                    <>
                      <div className="group">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">
                          <Lock size={14} /> Mật khẩu
                        </label>
                        <input
                          name="password"
                          type="password"
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-slate-900 font-medium"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="group">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">
                          <Lock size={14} /> Xác nhận mật khẩu
                        </label>
                        <input
                          name="confirm_password"
                          type="password"
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-slate-900 font-medium"
                          placeholder="••••••••"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setStaffModal({ isOpen: false, member: null })}
                    className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 font-bold text-white bg-brand rounded-2xl shadow-xl shadow-brand/20 hover:bg-brand-dark transition-all active:scale-95"
                  >
                    {staffModal.member ? 'Cập nhật ngay' : 'Thêm nhân viên'}
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
              className={`px-5 py-3.5 rounded-xl shadow-lg font-medium text-sm flex items-center gap-3 ${toast.type === 'success'
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
            <img src="/logo.png" alt="LabBox Logo" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-brand/20" />
            <span className="text-2xl font-display font-bold tracking-tight text-slate-900">
              LabBox
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
  type AuthMode = 'login' | 'register' | 'forgot';
  type RegisterStep = 1 | 2 | 3;

  const [currentMode, setCurrentMode] = useState<AuthMode>(mode);
  const [registerStep, setRegisterStep] = useState<RegisterStep>(1);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [forgotData, setForgotData] = useState({ email: '', username: '' });
  const [registerData, setRegisterData] = useState({
    phone: '',
    otp: '',
    password: '',
    confirm_password: '',
    verify_token: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendUntil, setResendUntil] = useState<number | null>(null);
  const [resendSecondsLeft, setResendSecondsLeft] = useState<number>(0);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setCurrentMode(mode);
    setErrors({});
    setStatusMsg(null);
    setIsLoading(false);
    setShowPass(false);
    setShowConfirm(false);
    setRegisterStep(1);
    setResendUntil(null);
    setResendSecondsLeft(0);
    setIsOtpVerified(false);
  }, [isOpen, mode]);

  React.useEffect(() => {
    if (!resendUntil) return;
    const tick = () => {
      const s = Math.max(0, Math.ceil((resendUntil - Date.now()) / 1000));
      setResendSecondsLeft(s);
      if (s === 0) setResendUntil(null);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [resendUntil]);

  if (!isOpen) return null;

  const clearFieldError = (name: string) => {
    if (!errors[name]) return;
    setErrors(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validateLogin = () => {
    const next: Record<string, string> = {};
    if (!loginData.username) next.username = 'Vui lòng nhập tên đăng nhập';
    if (!loginData.password) next.password = 'Vui lòng nhập mật khẩu';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateForgot = () => {
    const next: Record<string, string> = {};
    if (!forgotData.email && !forgotData.username) next.forgot = 'Vui lòng nhập email hoặc tên đăng nhập';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const phoneRegex = /^(?:\+?84|0)(3|5|7|8|9)\d{8}$/;

  const normalizePhone = (raw: string) => {
    const p = String(raw || '').trim().replace(/\s+/g, '');
    if (!p) return p;
    if (p.startsWith('+84')) return p;
    if (p.startsWith('+')) return p;
    if (p.startsWith('84')) return `+${p}`;
    if (p.startsWith('0')) return `+84${p.slice(1)}`;
    return p;
  };

  const getApiBase = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const isApiOk = (res: Response, data: any) => res.ok && (data?.status === true || data?.status_code === 0 || data?.success === true);

  const validateRegisterStep1 = () => {
    const next: Record<string, string> = {};
    const normalized = normalizePhone(registerData.phone);
    if (!normalized || !phoneRegex.test(normalized)) {
      next.phone = 'Số điện thoại không hợp lệ (VD: +84901234567)';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateRegisterStep2 = () => {
    const next: Record<string, string> = {};
    if (!registerData.otp) next.otp = 'Vui lòng nhập mã OTP';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateRegisterStep3 = () => {
    const next: Record<string, string> = {};
    if (!registerData.password || registerData.password.length < 6) next.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (registerData.password !== registerData.confirm_password) next.confirm_password = 'Mật khẩu xác nhận không khớp';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const sendOtp = async () => {
    setStatusMsg(null);
    if (!validateRegisterStep1()) return;
    setIsOtpVerified(false);
    setIsLoading(true);
    try {
      const apiBase = getApiBase();
      const phone = normalizePhone(registerData.phone);
      setRegisterData(prev => ({ ...prev, phone }));

      // Get reCAPTCHA token
      const recaptchaToken = await new Promise<string>((resolve, reject) => {
        if (typeof grecaptcha === 'undefined') {
          reject(new Error('Hệ thống bảo vệ reCAPTCHA chưa sẵn sàng. Vui lòng tải lại trang.'));
          return;
        }
        grecaptcha.ready(() => {
          grecaptcha.execute('6LdVy48sAAAAAARFNw8u9EELmrV_liJTcD-Cr-uY', { action: 'send_otp' })
            .then((recaptcha_token: string) => resolve(recaptcha_token))
            .catch(reject);
        });
      });

      const endpoint = `${apiBase}/api/v1/auth/otp/send`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          'X-Timestamp': Date.now().toString(),
        },
        body: JSON.stringify({ phone, recaptcha_token: recaptchaToken }),
      });
      const data = await res.json().catch(() => ({}));
      const ok = isApiOk(res, data);
      if (!ok) {
        setStatusMsg({ type: 'error', text: data?.message || 'Gửi OTP không thành công. Vui lòng thử lại.' });
        return;
      }

      setResendUntil(Date.now() + 30 * 1000);
      setStatusMsg({ type: 'success', text: 'Đã gửi mã OTP thành công.' });
      setRegisterStep(2);
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e?.message || 'Gửi OTP không thành công. Vui lòng thử lại.' });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    setStatusMsg(null);
    if (!validateRegisterStep2()) return;
    setIsLoading(true);
    try {
      const apiBase = getApiBase();
      const phone = normalizePhone(registerData.phone);
      setRegisterData(prev => ({ ...prev, phone }));

      const endpoint = `${apiBase}/api/v1/auth/otp/verify`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          'X-Timestamp': Date.now().toString(),
        },
        body: JSON.stringify({ phone, code: registerData.otp.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      const ok = isApiOk(res, data);
      if (!ok) {
        setErrors({ otp: data?.message || 'Mã OTP không đúng' });
        return;
      }
      const verifyToken = data?.data?.verify_token || data?.verify_token || '';
      setRegisterData(prev => ({ ...prev, verify_token: verifyToken }));
      setStatusMsg({ type: 'success', text: 'Xác nhận mã OTP thành công.' });
      setIsOtpVerified(true);
      setRegisterStep(3);
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e?.message || 'Không thể xác nhận OTP. Vui lòng thử lại.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (currentMode === 'register') {
      if (registerStep !== 3) return;
      if (!validateRegisterStep3()) return;
    } else if (currentMode === 'login') {
      if (!validateLogin()) return;
    } else {
      if (!validateForgot()) return;
    }

    setIsLoading(true);

    try {
      const apiBase = getApiBase();
      const endpoint =
        currentMode === 'login'
          ? `${apiBase}/api/v1/auth/login`
          : currentMode === 'register'
            ? `${apiBase}/api/v1/auth/register-by-phone`
            : `${apiBase}/api/v1/auth/forgot`;

      const phone = normalizePhone(registerData.phone);

      const body =
        currentMode === 'login'
          ? { username: loginData.username, password: loginData.password }
          : currentMode === 'register'
            ? {
              phone,
              password: registerData.password,
              verify_token: registerData.verify_token,
            }
            : { email: forgotData.email, username: forgotData.username };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'X-Timestamp': Date.now().toString()
        },
        body: JSON.stringify(body)
      });

      const data = await response.json().catch(() => ({}));
      const apiSuccess = isApiOk(response, data);
      if (apiSuccess) {
        if (currentMode === 'login') {
          setStatusMsg({
            type: 'success',
            text: 'Đăng nhập thành công! Đang vào hệ thống...'
          });
          const token = data?.data?.access_token || data?.access_token || data?.token;
          if (token) localStorage.setItem('token', token);
          localStorage.setItem('user_info', JSON.stringify(data.data || data || {}));
          localStorage.setItem('isLoggedIn', 'true');

          setTimeout(() => {
            onLoginSuccess();
            onClose();
          }, 1000);
        } else if (currentMode === 'register') {
          setStatusMsg({ type: 'success', text: 'Đăng ký thành công! Đang vào hệ thống...' });
          const token = data?.data?.access_token || data?.access_token || data?.token;
          if (token) localStorage.setItem('token', token);
          localStorage.setItem('user_info', JSON.stringify(data.data || data || {}));
          localStorage.setItem('isLoggedIn', 'true');
          setTimeout(() => {
            onLoginSuccess();
            onClose();
          }, 1000);
        } else {
          setStatusMsg({
            type: 'success',
            text: 'Đã gửi yêu cầu khôi phục mật khẩu. Vui lòng kiểm tra email.'
          });
          setTimeout(() => setCurrentMode('login'), 1600);
        }
      } else {
        setStatusMsg({
          type: 'error',
          text:
            data?.message ||
            data?.errors?.[0] ||
            (currentMode === 'login'
              ? 'Đăng nhập thất bại'
              : currentMode === 'register'
                ? 'Đăng ký thất bại'
                : 'Gửi yêu cầu thất bại')
        });
      }
    } catch (error) {
      console.error('Auth Error:', error);
      setStatusMsg({ type: 'error', text: 'Không thể kết nối đến máy chủ.' });
    } finally {
      setIsLoading(false);
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
        className={`relative w-full ${currentMode === 'register' ? 'max-w-xl' : 'max-w-md'} bg-white rounded-3xl shadow-2xl p-8 transition-all duration-300`}
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-3xl font-display font-bold text-slate-900">
            {currentMode === 'login' ? 'Chào mừng trở lại' : currentMode === 'register' ? 'Đăng ký tài khoản' : 'Khôi phục mật khẩu'}
          </h2>
          <p className="text-slate-500 mt-1">
            {currentMode === 'login'
              ? 'Đăng nhập để quản lý đơn hàng của bạn'
              : currentMode === 'register'
                ? 'Hoàn tất đăng ký theo 3 bước'
                : 'Nhập email hoặc tên đăng nhập để nhận liên kết đặt lại mật khẩu'}
          </p>
        </div>

        {statusMsg && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
            {statusMsg.text}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {currentMode === 'register' && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`flex items-center gap-2 ${s === 3 ? '' : 'flex-1'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${registerStep >= (s as RegisterStep) ? 'bg-brand border-brand text-white' : 'bg-white border-slate-200 text-slate-400'
                    }`}>
                    {s}
                  </div>
                  {s !== 3 && <div className={`h-px flex-1 ${registerStep > (s as RegisterStep) ? 'bg-brand' : 'bg-slate-200'}`} />}
                </div>
              ))}
            </div>
          )}

          {currentMode === 'login' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên đăng nhập</label>
                <input
                  value={loginData.username}
                  onChange={(e) => {
                    setLoginData(prev => ({ ...prev, username: e.target.value }));
                    clearFieldError('username');
                  }}
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.username ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
                  placeholder="username"
                />
                {errors.username && <p className="text-red-500 text-[10px] mt-1">{errors.username}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu</label>
                <div className="relative">
                  <input
                    value={loginData.password}
                    onChange={(e) => {
                      setLoginData(prev => ({ ...prev, password: e.target.value }));
                      clearFieldError('password');
                    }}
                    type={showPass ? 'text' : 'password'}
                    className={`w-full px-4 pr-10 py-2.5 rounded-xl border ${errors.password ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    aria-label="toggle-password"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-[10px] mt-1">{errors.password}</p>}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentMode('forgot');
                      setStatusMsg(null);
                      setErrors({});
                    }}
                    className="text-xs text-brand font-bold hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentMode === 'forgot' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input
                  value={forgotData.email}
                  onChange={(e) => {
                    setForgotData(prev => ({ ...prev, email: e.target.value }));
                    clearFieldError('forgot');
                  }}
                  type="email"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên đăng nhập</label>
                <input
                  value={forgotData.username}
                  onChange={(e) => {
                    setForgotData(prev => ({ ...prev, username: e.target.value }));
                    clearFieldError('forgot');
                  }}
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                  placeholder="username"
                />
              </div>
              {errors.forgot && <p className="text-red-500 text-[10px] mt-1">{errors.forgot}</p>}
            </div>
          )}

          {currentMode === 'register' && (
            <div className="space-y-4">
              {registerStep === 1 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    value={registerData.phone}
                    onChange={(e) => {
                      setRegisterData(prev => ({ ...prev, phone: e.target.value }));
                      clearFieldError('phone');
                    }}
                    type="tel"
                    className={`w-full px-4 py-2.5 rounded-xl border ${errors.phone ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
                    placeholder="09xx xxx xxx"
                  />
                  {errors.phone && <p className="text-red-500 text-[10px] mt-1">{errors.phone}</p>}
                </div>
              )}

              {registerStep === 2 && (
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Mã OTP</label>
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={isLoading || !!resendUntil}
                      className="text-xs font-bold text-brand hover:underline disabled:text-slate-400 disabled:no-underline"
                    >
                      {resendUntil ? `Gửi lại (${resendSecondsLeft}s)` : 'Gửi lại'}
                    </button>
                  </div>
                  <input
                    value={registerData.otp}
                    onChange={(e) => {
                      setRegisterData(prev => ({ ...prev, otp: e.target.value }));
                      clearFieldError('otp');
                    }}
                    type="text"
                    className={`w-full px-4 py-2.5 rounded-xl border ${errors.otp ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
                    placeholder="Nhập mã OTP"
                  />
                  {errors.otp && <p className="text-red-500 text-[10px] mt-1">{errors.otp}</p>}
                </div>
              )}

              {registerStep === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu</label>
                    <div className="relative">
                      <input
                        value={registerData.password}
                        onChange={(e) => {
                          setRegisterData(prev => ({ ...prev, password: e.target.value }));
                          clearFieldError('password');
                        }}
                        type={showPass ? 'text' : 'password'}
                        className={`w-full px-4 pr-10 py-2.5 rounded-xl border ${errors.password ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(p => !p)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                        aria-label="toggle-password"
                      >
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-[10px] mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Xác nhận mật khẩu</label>
                    <div className="relative">
                      <input
                        value={registerData.confirm_password}
                        onChange={(e) => {
                          setRegisterData(prev => ({ ...prev, confirm_password: e.target.value }));
                          clearFieldError('confirm_password');
                        }}
                        type={showConfirm ? 'text' : 'password'}
                        className={`w-full px-4 pr-10 py-2.5 rounded-xl border ${errors.confirm_password ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(p => !p)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                        aria-label="toggle-confirm-password"
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirm_password && <p className="text-red-500 text-[10px] mt-1">{errors.confirm_password}</p>}
                  </div>
                </>
              )}


            </div>
          )}

          {currentMode === 'register' && registerStep > 1 && registerStep < 3 && (
            <button
              type="button"
              onClick={() => {
                setStatusMsg(null);
                setErrors({});
                setRegisterStep(s => (s > 1 ? ((s - 1) as RegisterStep) : s));
              }}
              className="w-full py-3 text-slate-600 font-bold rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
            >
              Quay lại
            </button>
          )}

          {currentMode === 'register' ? (
            registerStep === 1 ? (
              <button
                type="button"
                onClick={sendOtp}
                disabled={isLoading}
                className="w-full py-3.5 bg-brand hover:bg-brand-dark disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-brand/20 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Gửi mã OTP qua Zalo ZNS'
                )}
              </button>
            ) : registerStep === 2 ? (
              <button
                type="button"
                onClick={verifyOtp}
                disabled={isLoading}
                className="w-full py-3.5 bg-brand hover:bg-brand-dark disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-brand/20 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Xác nhận mã'
                )}
              </button>
            ) : (
              <button
                disabled={isLoading}
                className="w-full py-3.5 bg-brand hover:bg-brand-dark disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-brand/20 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Hoàn tất đăng ký'
                )}
              </button>
            )
          ) : (
            <button
              disabled={isLoading}
              className="w-full py-3.5 bg-brand hover:bg-brand-dark disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-brand/20 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                currentMode === 'login' ? 'Đăng nhập' : 'Gửi yêu cầu khôi phục'
              )}
            </button>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            {currentMode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button
              onClick={() => {
                const nextMode: AuthMode = currentMode === 'login' ? 'register' : 'login';
                setCurrentMode(nextMode);
                setStatusMsg(null);
                setErrors({});
                setRegisterStep(1);
                setResendUntil(null);
                setResendSecondsLeft(0);
                setIsOtpVerified(false);
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
  const slides = (import.meta.env.VITE_HERO_SLIDES
    ? String(import.meta.env.VITE_HERO_SLIDES).split(',').map(s => s.trim()).filter(Boolean)
    : [import.meta.env.VITE_HERO_IMAGE_URL || "/hero-demo.png"]
  ) as string[];
  const [slideIndex, setSlideIndex] = React.useState(0);
  const slideRef = React.useRef<HTMLDivElement>(null);
  const [pricingPlans, setPricingPlans] = React.useState<Array<{ id: number; name: string; price?: number }>>([]);
  const [pricingError, setPricingError] = React.useState<string | null>(null);
  const [pricingLoading, setPricingLoading] = React.useState(false);
  React.useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [slides.length]);
  React.useEffect(() => {
    const el = slideRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({ left: w * slideIndex, behavior: 'smooth' });
  }, [slideIndex]);
  React.useEffect(() => {
    const fetchPlans = async () => {
      setPricingLoading(true);
      setPricingError(null);
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/subcription?page=1&per_page=50`;
        const headers: Record<string, string> = { Accept: 'application/json, text/plain, */*' };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();
        const res = await fetch(endpoint, { headers });
        const data = await res.json().catch(() => ({}));
        const ok = res.ok && (data?.status === true || data?.status_code === 0);
        if (!ok) {
          setPricingError(data?.message || 'Không thể tải gói dịch vụ');
          setPricingPlans([]);
          return;
        }
        const list = Array.isArray(data?.data?.data) ? data.data.data : Array.isArray(data?.data) ? data.data : [];
        const mapped = list.map((p: any) => ({ id: Number(p.id), name: String(p.name || ''), price: Number(p.price || 0) }));
        setPricingPlans(mapped);
      } catch {
        setPricingError('Không thể kết nối đến máy chủ');
        setPricingPlans([]);
      } finally {
        setPricingLoading(false);
      }
    };
    fetchPlans();
  }, []);
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
              <a
                href="https://vt.tiktok.com/ZSuRUChBE/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all text-center"
              >
                Xem demo sản phẩm
              </a>
            </div>

            {/* App Preview Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mt-20 relative max-w-5xl mx-auto"
            >
              <div className="bg-white rounded-[2rem] p-2 shadow-2xl overflow-hidden border-4 border-slate-200">
                <div className="aspect-video bg-white rounded-[1.5rem] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 overflow-hidden rounded-[1.5rem]">
                    <div className="w-full h-full">
                      <div
                        className="flex w-full h-full transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${slideIndex * 100}%)` }}
                      >
                        {slides.map((url, idx) => (
                          <div key={idx} className="w-full h-full flex items-center justify-center shrink-0">
                            <img
                              src={url}
                              alt="LabBox App Interface"
                              className="max-w-full max-h-full object-contain"
                              referrerPolicy="no-referrer"
                              draggable={false}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {slides.length > 1 && (
                    <>
                      <button
                        onClick={() => setSlideIndex(i => (i - 1 + slides.length) % slides.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow border border-slate-200 z-10"
                        aria-label="Prev"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setSlideIndex(i => (i + 1) % slides.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow border border-slate-200 z-10"
                        aria-label="Next"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/70 px-3 py-1 rounded-full border border-slate-200 z-10">
                        {slides.map((_, i) => (
                          <span
                            key={i}
                            onClick={() => setSlideIndex(i)}
                            className={`w-2 h-2 rounded-full cursor-pointer ${i === slideIndex ? 'bg-brand' : 'bg-slate-300'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent pointer-events-none" />
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

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: <Video className="w-8 h-8 text-brand" />,
                title: "Quay video thông minh",
                desc: "Tuỳ chỉnh camera theo ý muốn, tự động quay và kết thúc video khi có QR, tự động xoá video, thêm nhiều người cùng quay video, và nhiều tính năng thông minh khác."
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-brand" />,
                title: "Bằng chứng thép",
                desc: "Hiện thị ngày giờ trong video và được lưu trữ an toàn với key mã hóa video, là bằng chứng không thể chối cãi khi có khiếu nại tráo hàng."
              },
              {
                icon: <History className="w-8 h-8 text-brand" />,
                title: "Truy xuất tức thì",
                desc: "Tìm kiếm video theo mã vận đơn, có website quản lý video, hiển thị ai là người quay video và tải video dễ dàng."
              },
              {
                icon: <Lock className="w-8 h-8 text-brand" />,
                title: "Bảo mật",
                desc: "Tuỳ chỉnh phân quyền cho nhân viên, tránh tiết lộ video sản phẩm và nhiều tính năng bảo mật cho Shop."
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
            {(pricingPlans.length
              ? pricingPlans.map((p, idx) => ({
                name: p.name,
                price: typeof p.price === 'number' && p.price > 0 ? `${(p.price * 1000).toLocaleString('vi-VN')}đ` : 'Miễn phí',
                period: "mỗi tháng",
                desc: "Gói dịch vụ LabBox",
                features: ["Quản lý video", "Tìm kiếm thông minh", "Hỗ trợ kỹ thuật"],
                button: "Đăng ký",
                highlight: idx === 1
              }))
              : [
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
              ]
            ).map((plan, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className={`p-8 rounded-[2.5rem] border transition-all relative ${plan.highlight
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
                  className={`w-full py-4 rounded-2xl font-bold transition-all ${plan.highlight
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
                <img src="/logo.png" alt="LabBox Logo" className="w-8 h-8 object-contain rounded-lg" />
              </div>
              <p className="text-slate-500 max-w-sm mb-8">
                Ứng dụng hỗ trợ quay video đóng hàng thông minh. Giải pháp tối ưu cho nhà bán hàng thời đại số.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com/labboxio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-brand hover:border-brand transition-all"
                  aria-label="Facebook @labboxio"
                  title="Facebook @labboxio"
                >
                  <Facebook size={20} />
                </a>
                <a
                  href="https://labbox.vn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-brand hover:border-brand transition-all"
                  aria-label="Website labbox.vn"
                  title="Website labbox.vn"
                >
                  <Globe size={20} />
                </a>
                <a
                  href="mailto:support@moblab.io"
                  className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-brand hover:border-brand transition-all"
                  aria-label="Email support@moblab.io"
                  title="Email support@moblab.io"
                >
                  <Mail size={20} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Liên hệ với chúng tôi</h4>
              <ul className="space-y-4">
                <li>
                  <a
                    href="mailto:support@moblab.io"
                    className="flex items-center gap-3 text-slate-600 hover:text-brand transition-colors"
                  >
                    <Headset size={16} className="text-brand" />
                    <span>
                      <span className="block text-xs font-semibold text-slate-500">Support</span>
                      <span className="block">support@moblab.io</span>
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:info@moblab.io"
                    className="flex items-center gap-3 text-slate-600 hover:text-brand transition-colors"
                  >
                    <Info size={16} className="text-brand" />
                    <span>
                      <span className="block text-xs font-semibold text-slate-500">General Info</span>
                      <span className="block">info@moblab.io</span>
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://labbox.vn/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-600 hover:text-brand transition-colors"
                  >
                    <Globe size={16} className="text-brand" />
                    <span>
                      <span className="block text-xs font-semibold text-slate-500">Website labbox.vn</span>
                      <span className="block">https://labbox.vn/</span>
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/labboxio/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-600 hover:text-brand transition-colors"
                  >
                    <Facebook size={16} className="text-[#1877F2]" />
                    <span>
                      <span className="block text-xs font-semibold text-slate-500">Facebook @labboxio</span>
                      <span className="block">https://www.facebook.com/labboxio/</span>
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="http://zalo.me/2667033808364818533?src=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-600 hover:text-brand transition-colors"
                  >
                    <MessageCircle size={16} className="text-[#016EF4]" />
                    <span>
                      <span className="block text-xs font-semibold text-slate-500">Zalo MobLab</span>
                      <span className="block">http://zalo.me/2667033808364818533?src=qr</span>
                    </span>
                  </a>
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
