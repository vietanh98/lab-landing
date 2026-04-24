import React, { useEffect, useState, useRef } from 'react';
import { Store, Edit, Trash2, Plus, Video, HardDrive, MapPin, User, MoreVertical, ExternalLink, Clock, PackageCheck, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
// Shared formatter — keeps the per-store storage column consistent with the
// dashboard and the video list (all in GB now).
import { formatBytesAsGB } from '../../utils/format';

interface StoreManagementProps {
  stores: any[];
  refreshKey?: number;
  onEditStore: (store: any) => void;
  onDeleteStore: (id: string) => void;
  onAddStore: () => void;
  onViewStoreVideos?: (store: any) => void;
}

const StoreManagement: React.FC<StoreManagementProps> = ({ stores, refreshKey, onEditStore, onDeleteStore, onAddStore, onViewStoreVideos }) => {
  const [localStores, setLocalStores] = useState<any[]>(stores || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(500);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStores, setTotalStores] = useState(0);
  const hasFetchedRef = useRef(false);
  const lastQueryRef = useRef<string>('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const mediaBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const toAbs = (p: string) => {
    if (!p) return '';
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    const base = mediaBase.replace(/\/+$/, '');
    const path = p.startsWith('/') ? p : `/${p}`;
    return `${base}${path}`;
  };

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/store?page=${page}&per_page=${perPage}`;
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(endpoint, { headers });
        const data = await res.json();
        const ok = res.ok && (data?.status === true || data?.status_code === 0);
        if (ok) {
          const listCandidate = data?.data?.data ?? data?.data ?? data?.stores ?? data ?? [];
          const items = Array.isArray(listCandidate)
            ? listCandidate
            : (Array.isArray(listCandidate?.data) ? listCandidate.data : []);
          setLocalStores(items);

          const total = Number(data?.data?.total_items ?? data?.data?.total ?? data?.meta?.total ?? 0);
          const lastPage = Number(data?.data?.last_page ?? data?.meta?.last_page ?? data?.pagination?.total_pages ?? 0);
          if (lastPage > 0) {
            setTotalPages(lastPage);
          } else if (total > 0) {
            setTotalPages(Math.max(1, Math.ceil(total / perPage)));
          } else {
            setTotalPages(1);
          }
          setTotalStores(total > 0 ? total : items.length);
        } else {
          setError(data?.message || 'Không thể lấy danh sách cửa hàng');
        }
      } catch {
        setError('Không thể kết nối đến máy chủ');
      } finally {
        setLoading(false);
      }
    };

    const queryKey = `${page}:${perPage}:${refreshKey}`;
    const shouldFetch = !hasFetchedRef.current || lastQueryRef.current !== queryKey;
    if (!shouldFetch) return;
    hasFetchedRef.current = true;
    lastQueryRef.current = queryKey;
    fetchStores();
  }, [refreshKey, page, perPage]);

  const handleDelete = (id: string) => {
    if (onDeleteStore) onDeleteStore(id);
  };

  // Legacy auto-scaling `formatBytes` removed in favour of the shared
  // `formatBytesAsGB` helper so every screen shows storage in GB.
  const formatBytes = (bytes?: number) => {
    if (typeof bytes !== 'number' || isNaN(bytes)) return null;
    return formatBytesAsGB(bytes);
  };

  const getStatusInfo = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s === 'active' || s === 'hoạt động') return { label: 'Hoạt động', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (s === 'inactive' || s === 'không hoạt động') return { label: 'Không hoạt động', dot: 'bg-slate-400', badge: 'bg-slate-50 text-slate-600 border-slate-200' };
    return { label: status || 'Chưa xác định', dot: 'bg-slate-400', badge: 'bg-slate-50 text-slate-600 border-slate-200' };
  };

  // Color palette for store avatars (cycling)
  const avatarColors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-rose-500 to-pink-600',
    'from-indigo-500 to-blue-600',
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
                <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-14 bg-slate-50 rounded-xl" />
              <div className="h-14 bg-slate-50 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
          <Store size={28} className="text-rose-400" />
        </div>
        <p className="text-slate-700 font-bold mb-1">Không thể tải dữ liệu</p>
        <p className="text-slate-400 text-sm mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand-dark transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Stats bar */}
      {localStores.length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-slate-500 font-medium">
            Tổng cộng <span className="font-bold text-slate-900">{localStores.length}</span> cửa hàng
          </span>
          <span className="w-1 h-1 bg-slate-300 rounded-full" />
          <span className="text-sm text-emerald-600 font-medium">
            Mục {localStores.length} / Tổng {totalStores > 0 ? totalStores : localStores.length}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Store cards */}
        {localStores.map((store, i) => {
          const logoSrc = (() => {
            const candidate = Array.isArray(store.images) && store.images.length ? store.images[0] : store.logo;
            return typeof candidate === 'string' ? toAbs(candidate) : '';
          })();
          const statusInfo = getStatusInfo(store.status);
          const colorClass = avatarColors[i % avatarColors.length];
          const initials = String(store.name || '?').slice(0, 2).toUpperCase();

          return (
            <div
              key={store.id || i}
              className="relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 overflow-hidden group"
            >
              {/* Top accent strip */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${colorClass} opacity-80`} />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Logo / Avatar */}
                    {logoSrc ? (
                      <img
                        src={logoSrc}
                        alt={store.name}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-100"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-gradient-to-br ${colorClass}`}>
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 truncate leading-tight">{store.name}</h3>
                      {store.managers && store.managers.length > 0 ? (
                        <div className="flex items-center gap-1.5 mt-1" title="Nhân viên quản lý">
                          <User size={12} className="text-slate-400 flex-shrink-0" />
                          <span className="text-xs text-slate-500 truncate font-medium">
                            {store.managers.map((m: any) => m.full_name || m.username || m.email).filter(Boolean).join(', ')}
                          </span>
                        </div>
                      ) : store.user_name ? (
                        <div className="flex items-center gap-1.5 mt-1" title="Chủ cửa hàng">
                          <User size={12} className="text-slate-400 flex-shrink-0" />
                          <span className="text-xs text-slate-500 truncate font-medium">{store.user_name}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Menu button */}
                  <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenuId(prev => (prev === String(store.id) ? null : String(store.id)))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === String(store.id) && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">
                          <button
                            onClick={() => { setOpenMenuId(null); onViewStoreVideos && onViewStoreVideos(store); }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 text-sm font-medium"
                          >
                            <Video size={15} className="text-brand" />
                            Xem danh sách video
                          </button>
                          <div className="h-px bg-slate-100 mx-3" />
                          <button
                            onClick={() => { setOpenMenuId(null); onEditStore && onEditStore(store); }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 text-sm font-medium"
                          >
                            <Edit size={15} className="text-slate-500" />
                            Chỉnh sửa cửa hàng
                          </button>
                          <div className="h-px bg-slate-100 mx-3" />
                          <button
                            onClick={() => { setOpenMenuId(null); handleDelete(store.id); }}
                            className="w-full text-left px-4 py-3 hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 text-sm font-medium"
                          >
                            <Trash2 size={15} />
                            Xóa cửa hàng
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                      <Video size={12} className="text-brand" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Tổng Video</span>
                    </div>
                    <p className="text-base font-black text-slate-900 leading-none">
                      {store.total_video_count ?? 0}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                      <Clock size={12} className="text-blue-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Hôm nay</span>
                    </div>
                    <p className="text-base font-black text-slate-900 leading-none">
                      {(store.today_new_video_count || 0) + (store.today_return_video_count || 0)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                      <PackageCheck size={12} className="text-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Đơn mới</span>
                    </div>
                    <p className="text-base font-black text-slate-900 leading-none">
                      {store.today_new_video_count ?? 0}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                      <RotateCcw size={12} className="text-rose-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Đơn hoàn</span>
                    </div>
                    <p className="text-base font-black text-slate-900 leading-none">
                      {store.today_return_video_count ?? 0}
                    </p>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => { onViewStoreVideos && onViewStoreVideos(store); }}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:border-brand hover:text-brand hover:bg-brand/5 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink size={14} />
                  Xem video
                </button>
              </div>
            </div>
          );
        })}

        {/* Add new store card */}
        <button
          onClick={onAddStore}
          className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-brand hover:text-brand hover:bg-brand/5 transition-all group min-h-[220px]"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-brand/10 transition-colors">
            <Plus size={22} className="group-hover:text-brand" />
          </div>
          <div className="text-center">
            <p className="font-bold text-sm">Thêm cửa hàng mới</p>
            <p className="text-xs mt-1 opacity-70">Nhấn để tạo cửa hàng</p>
          </div>
        </button>
      </div>

      {/* Pagination control */}
      {totalPages > 1 && (
        <div className="p-4 mt-6 flex items-center justify-center gap-4 bg-white rounded-2xl border border-slate-100">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-slate-600">Trang {page} / {totalPages}</span>
          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default StoreManagement;
