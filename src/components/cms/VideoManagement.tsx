import React, { useEffect, useState, useRef } from 'react';
import { Eye, Trash2, ChevronLeft, ChevronRight, Copy, Check, X, ExternalLink, Search, Store, Tag, CheckCircle2, Shield, Package, Filter, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import CustomSelect from '../ui/CustomSelect';
import Toggle from '../ui/Toggle';

interface VideoManagementProps {
  videos: any[];
  onViewVideo: (video: any) => void;
  onDeleteVideo: (id: string) => void;
}

const VideoManagement: React.FC<VideoManagementProps> = ({ videos, onViewVideo, onDeleteVideo }) => {
  const location = useLocation() as any;
  const storeId: string | number | undefined = location?.state?.filterStoreId;
  const storeName: string | undefined = location?.state?.filterStoreName;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTitle, setSearchTitle] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterQr1, setFilterQr1] = useState('');
  const [filterFinishedOnly, setFilterFinishedOnly] = useState<boolean | null>(null);
  const [filterOrderType, setFilterOrderType] = useState('');
  const [filterIsPublished, setFilterIsPublished] = useState<boolean | null>(null);
  const [showPublicModal, setShowPublicModal] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    searchTitle: '',
    filterStore: '',
    filterQr1: '',
    filterFinishedOnly: null as boolean | null,
    filterOrderType: '',
    filterIsPublished: null as boolean | null,
    filterRecordedBy: '',
    filterDeviceId: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stores, setStores] = useState<string[]>([]);
  const hasFetchedRef = useRef(false);
  const lastQueryRef = useRef<string>('');

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        let query = `?page=${page}&per_page=${perPage}`;
        if (storeId) query += `&store_id=${storeId}`;
        if (appliedFilters.searchTitle) query += `&title=${encodeURIComponent(appliedFilters.searchTitle)}`;
        if (appliedFilters.filterStore) query += `&store_name=${encodeURIComponent(appliedFilters.filterStore)}`;
        if (appliedFilters.filterQr1) query += `&qr_code_1=${encodeURIComponent(appliedFilters.filterQr1)}`;
        if (appliedFilters.filterFinishedOnly !== null) query += `&finished_only=${appliedFilters.filterFinishedOnly}`;
        if (appliedFilters.filterOrderType) query += `&order_type=${appliedFilters.filterOrderType}`;
        if (appliedFilters.filterIsPublished !== null) query += `&is_published=${appliedFilters.filterIsPublished}`;
        if (appliedFilters.filterRecordedBy) query += `&recorded_by=${appliedFilters.filterRecordedBy}`;
        if (appliedFilters.filterDeviceId) query += `&device_id=${appliedFilters.filterDeviceId}`;

        const endpoint = `${apiBase}/api/v1/video/list${query}`;
        const headers: Record<string, string> = {
          Accept: 'application/json, text/plain, */*',
        };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();

        const res = await fetch(endpoint, { headers });
        const data = await res.json().catch(() => ({}));

        const ok = res.ok && (data?.status === true || data?.status_code === 0 || data?.success === true);
        if (!ok) {
          setError(data?.message || 'Không thể lấy danh sách video');
          setItems(videos || []);
        } else {
          const candidate =
            data?.data?.data ??
            data?.data?.items ??
            data?.data ??
            data?.videos ??
            data ??
            [];
          const list =
            Array.isArray(candidate) ? candidate : Array.isArray(candidate?.data) ? candidate.data : [];

          // Map raw API objects to include full video URL
          const mapped = list.map((v: any) => ({
            ...v,
            url: v.file_url || (v.file_path ? `https://media.labbox.vn/${v.file_path.replace(/^\//, '')}` : ''),
            orderId: String(v.qr_code_1 ?? v.qr_code_2 ?? v.order_id ?? v.title ?? '')
          }));
          setItems(mapped);

          const total =
            Number(data?.data?.total ?? data?.meta?.total ?? data?.pagination?.total ?? 0);
          const lastPage =
            Number(
              data?.data?.last_page ??
              data?.meta?.last_page ??
              data?.pagination?.total_pages ??
              0
            );
          if (lastPage > 0) {
            setTotalPages(lastPage);
          } else if (total > 0) {
            setTotalPages(Math.max(1, Math.ceil(total / perPage)));
          } else {
            setTotalPages(1);
          }
        }
      } catch {
        setError('Không thể kết nối đến máy chủ');
        setItems(videos || []);
      } finally {
        setLoading(false);
      }
    };
    const key = `${page}:${perPage}:${storeId ?? ''}:${appliedFilters.searchTitle}:${appliedFilters.filterStore}:${appliedFilters.filterQr1}:${appliedFilters.filterFinishedOnly}:${appliedFilters.filterOrderType}:${appliedFilters.filterIsPublished}:${appliedFilters.filterRecordedBy}:${appliedFilters.filterDeviceId}`;
    if (hasFetchedRef.current && lastQueryRef.current === key) {
      return;
    }
    hasFetchedRef.current = true;
    lastQueryRef.current = key;
    fetchVideos();
  }, [page, perPage, storeId, appliedFilters]);

  const handleSearch = () => {
    setAppliedFilters({
      searchTitle,
      filterStore,
      filterQr1,
      filterFinishedOnly,
      filterOrderType,
      filterIsPublished,
      filterRecordedBy,
      filterDeviceId,
    });
    setPage(1);
  };

  useEffect(() => {
    const fetchAllStores = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/store?page=1&per_page=1000`;
        const headers: Record<string, string> = { Accept: 'application/json' };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();
        const res = await fetch(endpoint, { method: 'GET', headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data?.status === true || data?.status_code === 0)) {
          const listCandidate = data?.data?.data ?? data?.data ?? data?.stores ?? data ?? [];
          const list = Array.isArray(listCandidate) ? listCandidate : (Array.isArray(listCandidate?.data) ? listCandidate.data : []);
          const names = Array.from(new Set(list.map((s: any) => s.name).filter(Boolean))) as string[];
          setStores(names);
        }
      } catch (err) {
        console.error('Error fetching stores for filter', err);
      }
    };
    fetchAllStores();
  }, []);

  const [filterRecordedBy, setFilterRecordedBy] = useState('');
  const [filterDeviceId, setFilterDeviceId] = useState('');

  const mbToBytes = (mb: number) => Math.round(mb * 1024 * 1024);
  const toMB = (bytes?: number) => {
    if (typeof bytes !== 'number' || isNaN(bytes)) return '';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const fmtDate = (d?: string) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleString('vi-VN');
    } catch {
      return d;
    }
  };
  const displayVideos = items.length ? items : [];
  const filteredVideos = displayVideos.filter((v: any) => {
    const titleOk = !appliedFilters.searchTitle || String(v.title || '').toLowerCase().includes(appliedFilters.searchTitle.toLowerCase());
    const storeOk = !appliedFilters.filterStore || String(v.store_name || '') === appliedFilters.filterStore;
    const qrOk = !appliedFilters.filterQr1 || String(v.qr_code_1 || '').toLowerCase().includes(appliedFilters.filterQr1.toLowerCase());
    return titleOk && storeOk && qrOk;
  });
  const sortedVideos = [...filteredVideos].sort((a: any, b: any) =>
    String(a.store_name || '').localeCompare(String(b.store_name || ''))
  );

  const handleTogglePublish = async (id: number, isPublished: boolean) => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const endpoint = `${apiBase}/api/v1/video/publish`;
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id, is_published: isPublished }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.status === true || data.success === true)) {
        // Update local state
        setItems(prev => prev.map(v => v.id === id ? { ...v, is_published: isPublished } : v));

        // Show public link popup if publishing
        if (isPublished) {
          // Priority: response public_url -> response data info -> constructed if we have enough info
          const url = data.public_url || data.data?.public_url || data.data?.file_url || '';
          if (url) {
            setPublicUrl(url);
            setShowPublicModal(true);
          }
        }
      } else {
        alert(data.message || 'Không thể cập nhật trạng thái video');
      }
    } catch (err) {
      console.error('Error toggling publish:', err);
      alert('Không thể kết nối đến máy chủ');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-visible flex-1 h-full min-h-0 flex flex-col">
      <div className="p-4 flex flex-col gap-3 border-b border-slate-100 relative z-50">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-slate-900">
            Quản lý Video {storeName ? `• ${storeName}` : ''}
          </div>
          <div className="flex items-center gap-2 min-w-32">
            <CustomSelect
              name="perPage"
              label=""
              hideLabel
              defaultValue={perPage}
              options={[
                { id: 10, name: '10 / trang' },
                { id: 20, name: '20 / trang' },
                { id: 50, name: '50 / trang' }
              ]}
              onChange={(val) => {
                setPage(1);
                setPerPage(Number(val) || 10);
              }}
            />
          </div>
        </div>
        <div className="mx-2 mb-2 p-3 bg-white rounded-[1.5rem] border border-slate-100 shadow-lg shadow-slate-200/30 relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-2xl -mr-12 -mt-12" />
          
          <div className="flex flex-col gap-3 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Search size={10} className="text-slate-300" />
                  Tiêu đề
                </label>
                <div className="relative group">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" />
                  <input
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
                    placeholder="Tìm tiêu đề..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Store size={10} className="text-slate-300" />
                  Cửa hàng
                </label>
                <CustomSelect
                  name="filterStore"
                  label=""
                  hideLabel
                  icon={Store}
                  defaultValue={filterStore}
                  placeholder="Chọn cửa hàng"
                  options={stores.map(s => ({ id: s, name: s }))}
                  onChange={(val) => setFilterStore(String(val))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Tag size={10} className="text-slate-300" />
                  Mã vận đơn
                </label>
                <div className="relative group">
                  <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" />
                  <input
                    value={filterQr1}
                    onChange={(e) => setFilterQr1(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
                    placeholder="Nhập mã QR..."
                  />
                </div>
              </div>

              <div className="flex gap-2 h-11">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all ${showFilters ? 'bg-brand/10 text-brand outline outline-1 outline-brand/30' : ''}`}
                >
                  <Filter size={16} />
                  <span className="text-xs">{showFilters ? 'Ẩn bớt' : 'Thêm bộ lọc'}</span>
                </button>
                <button
                  onClick={handleSearch}
                  className="flex-[1.5] flex items-center justify-center gap-2 px-4 bg-gradient-to-r from-brand to-brand-dark hover:shadow-lg hover:shadow-brand/30 text-white font-bold rounded-2xl transition-all active:scale-[0.98] group"
                >
                  <Search size={16} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm">Tìm kiếm</span>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-visible"
                >
                  <div className="pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 border-t border-slate-100">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Shield size={10} className="text-slate-300" />
                        Riêng tư
                      </label>
                      <CustomSelect
                        name="filterIsPublished"
                        label=""
                        hideLabel
                        icon={Shield}
                        defaultValue={filterIsPublished === null ? '' : String(filterIsPublished)}
                        placeholder="Tất cả hiển thị"
                        options={[
                          { id: 'all', name: 'Tất cả' },
                          { id: 'true', name: 'Công khai' },
                          { id: 'false', name: 'Riêng tư' }
                        ]}
                        onChange={(val) => setFilterIsPublished(val === 'all' ? null : val === 'true')}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Package size={10} className="text-slate-300" />
                        Loại đơn
                      </label>
                      <CustomSelect
                        name="filterOrderType"
                        label=""
                        hideLabel
                        icon={Package}
                        defaultValue={filterOrderType}
                        placeholder="Tất cả loại"
                        options={[
                          { id: 'all', name: 'Tất cả' },
                          { id: '0', name: 'Đơn mới' },
                          { id: '1', name: 'Đơn hoàn' }
                        ]}
                        onChange={(val) => setFilterOrderType(val === 'all' ? '' : String(val))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <User size={10} className="text-slate-300" />
                        Người quay
                      </label>
                      <div className="relative group">
                        <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" />
                        <input
                          value={filterRecordedBy}
                          onChange={(e) => setFilterRecordedBy(e.target.value)}
                          className="w-full h-11 pl-10 pr-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
                          placeholder="ID người quay..."
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        <Shield size={10} className="text-slate-300" />
                        Thiết bị
                      </label>
                      <div className="relative group">
                        <Shield size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" />
                        <input
                          value={filterDeviceId}
                          onChange={(e) => setFilterDeviceId(e.target.value)}
                          className="w-full h-11 pl-10 pr-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
                          placeholder="ID thiết bị..."
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {error && (
        <div className="px-6 py-3 text-sm text-rose-600 bg-rose-50 border-t border-rose-100">{error}</div>
      )}
      <div className="overflow-x-auto flex-1 min-h-0">
        <div className="h-full overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
              <tr className="text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4">Mã video</th>
                <th className="px-6 py-4">Cửa hàng</th>
                <th className="px-6 py-4">Người quay</th>
                <th className="px-6 py-4">Thiết bị</th>
                <th className="px-6 py-4">Tiêu đề</th>
                <th className="px-6 py-4">Mã vận đơn</th>
                <th className="px-6 py-4 min-w-[120px]">Dung lượng</th>
                <th className="px-6 py-4">Thời lượng</th>
                <th className="px-6 py-4">Thời gian quay</th>
                <th className="px-6 py-4">Kết thúc</th>
                <th className="px-6 py-4">Tự xóa</th>
                <th className="px-6 py-4">Số ngày giữ</th>
                <th className="px-6 py-4">Tạo lúc</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={14} className="px-6 py-6 text-center text-slate-500 text-sm">Đang tải dữ liệu...</td>
                </tr>
              )}
              {!loading && sortedVideos.map((vid: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-900 font-bold">{String(vid.id)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{String(vid.store_name ?? '')}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{vid.recorded_by_name ? String(vid.recorded_by_name) : <span className="text-slate-400">—</span>}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{String(vid.device_id ?? '')}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <span className="inline-block max-w-48 truncate align-middle">{String(vid.title ?? '')}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                      {String(vid.qr_code_1 ?? vid.qr_code_2 ?? '') || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-lg bg-brand/10 text-brand text-xs font-bold">{toMB(vid.size_bytes)}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{String(vid.duration_seconds ?? '')}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{fmtDate(vid.recorded_at)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{fmtDate(vid.finished_at)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${vid.is_auto_delete ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>{vid.is_auto_delete ? 'Có' : 'Không'}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {String(vid.keep_days ?? '')}
                    {vid.keep_day_times && (
                      <span className="ml-2 text-brand font-bold bg-brand/5 px-2 py-0.5 rounded-lg border border-brand/10">
                        ( {fmtDate(vid.keep_day_times)} )
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{fmtDate(vid.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewVideo(vid)}
                        className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-all" title="Xem video"
                      >
                        <Eye size={18} />
                      </button>
                      <div className="px-2" title={vid.is_published ? "Hủy công khai" : "Công khai video"}>
                        <Toggle
                          checked={!!vid.is_published}
                          onChange={(checked) => handleTogglePublish(vid.id, checked)}
                        />
                      </div>
                      <button
                        onClick={() => onDeleteVideo(vid.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Xóa video"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-4 flex items-center justify-center gap-4 border-t border-slate-100">
        <button
          disabled={page <= 1 || loading}
          onClick={() => setPage(p => Math.max(1, p - 1))}
          className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold text-slate-600">Trang {page} / {totalPages} • {filteredVideos.length} mục</span>
        <button
          disabled={page >= totalPages || loading}
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <AnimatePresence>
        {showPublicModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPublicModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <ExternalLink size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Video đã được công khai</h3>
                      <p className="text-sm text-slate-500">Người dùng có thể xem video qua liên kết này</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPublicModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-2 p-1 pl-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-sm font-medium text-slate-600 truncate flex-1">
                    {publicUrl}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(publicUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-sm ${copied
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                      }`}
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Sao chép
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setShowPublicModal(false)}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200/50"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoManagement;
