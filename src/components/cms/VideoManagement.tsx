import React, { useEffect, useState, useRef } from 'react';
import { Eye, ArrowUpRight, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import CustomSelect from '../ui/CustomSelect';

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
  const hasFetchedRef = useRef(false);
  const lastQueryRef = useRef<string>('');

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/video/list?page=${page}&per_page=${perPage}${storeId ? `&store_id=${storeId}` : ''}`;
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
            url: v.file_path ? `https://media.labbox.vn/${v.file_path.replace(/^\//, '')}` : '',
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
    const key = `${page}:${perPage}:${storeId ?? ''}`;
    if (hasFetchedRef.current && lastQueryRef.current === key) {
      return;
    }
    hasFetchedRef.current = true;
    lastQueryRef.current = key;
    fetchVideos();
  }, [page, perPage, storeId]);

  const stores = Array.from(new Set(items.map((v) => v.store_name).filter(Boolean)));
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
    const titleOk = !searchTitle || String(v.title || '').toLowerCase().includes(searchTitle.toLowerCase());
    const storeOk = !filterStore || String(v.store_name || '') === filterStore;
    const qrOk = !filterQr1 || String(v.qr_code_1 || '').toLowerCase().includes(filterQr1.toLowerCase());
    return titleOk && storeOk && qrOk;
  });
  const sortedVideos = [...filteredVideos].sort((a: any, b: any) =>
    String(a.store_name || '').localeCompare(String(b.store_name || ''))
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[76vh] flex flex-col">
      <div className="p-4 flex flex-col gap-3 border-b border-slate-100">
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
          <input
            value={searchTitle}
            onChange={(e) => {
              setSearchTitle(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none"
            placeholder="Tiêu đề"
          />
          <CustomSelect
            name="filterStore"
            label=""
            hideLabel
            defaultValue={filterStore}
            placeholder="Cửa hàng (tất cả)"
            options={stores.map(s => ({ id: s, name: s }))}
            onChange={(val) => {
              setFilterStore(String(val));
              setPage(1);
            }}
          />
          <input
            value={filterQr1}
            onChange={(e) => {
              setFilterQr1(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none"
            placeholder="QR Code 1"
          />
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
                <td colSpan={13} className="px-6 py-6 text-center text-slate-500 text-sm">Đang tải dữ liệu...</td>
              </tr>
            )}
            {!loading && sortedVideos.map((vid: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 text-sm text-slate-900 font-bold">{String(vid.id)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{String(vid.store_name ?? '')}</td>
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
                <td className="px-6 py-4 text-sm text-slate-500">{String(vid.keep_days ?? '')}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{fmtDate(vid.created_at)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onViewVideo(vid)}
                      className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-all" title="Xem video"
                    >
                      <Eye size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-all" title="Tải về">
                      <ArrowUpRight size={18} />
                    </button>
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
    </div>
  );
};

export default VideoManagement;
