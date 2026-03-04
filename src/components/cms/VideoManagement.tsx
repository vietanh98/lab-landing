import React, { useEffect, useState } from 'react';
import { Eye, ArrowUpRight, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface VideoManagementProps {
  videos: any[];
  onViewVideo: (video: any) => void;
  onDeleteVideo: (id: string) => void;
}

const VideoManagement: React.FC<VideoManagementProps> = ({ videos, onViewVideo, onDeleteVideo }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTitle, setSearchTitle] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterQr1, setFilterQr1] = useState('');

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/video/list?page=${page}&per_page=${perPage}`;
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
          setItems(list);

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
    fetchVideos();
  }, [page, perPage]);

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

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 flex flex-col gap-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-slate-900">Quản lý Video</div>
          <div className="flex items-center gap-2">
            <select
              value={perPage}
              onChange={(e) => {
                setPage(1);
                setPerPage(Number(e.target.value) || 10);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
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
          <select
            value={filterStore}
            onChange={(e) => {
              setFilterStore(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none"
          >
            <option value="">Cửa hàng (tất cả)</option>
            {stores.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
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
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Mã video</th>
              <th className="px-6 py-4">Cửa hàng</th>
              <th className="px-6 py-4">Thiết bị</th>
              <th className="px-6 py-4">Tiêu đề</th>
              <th className="px-6 py-4">QR Code 1</th>
              <th className="px-6 py-4">QR Code 2</th>
              <th className="px-6 py-4">Đường dẫn file</th>
              <th className="px-6 py-4">Ảnh thumbnail</th>
              <th className="px-6 py-4">Dung lượng</th>
              <th className="px-6 py-4">Thời lượng</th>
              <th className="px-6 py-4">Tự cấu hình</th>
              <th className="px-6 py-4">Thời gian quay</th>
              <th className="px-6 py-4">Kết thúc</th>
              <th className="px-6 py-4">Tự xóa</th>
              <th className="px-6 py-4">Số ngày giữ</th>
              <th className="px-6 py-4">Logo overlay</th>
              <th className="px-6 py-4">Tạo lúc</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={18} className="px-6 py-6 text-center text-slate-500 text-sm">Đang tải dữ liệu...</td>
              </tr>
            )}
            {!loading && filteredVideos.map((vid: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 text-sm text-slate-900 font-bold">{String(vid.id)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{String(vid.store_name ?? '')}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{String(vid.device_id ?? '')}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <span className="inline-block max-w-48 truncate align-middle">{String(vid.title ?? '')}</span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700">{String(vid.qr_code_1 ?? '') || '—'}</span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700">{String(vid.qr_code_2 ?? '') || '—'}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  <span className="inline-block max-w-48 truncate align-middle">{String(vid.file_path ?? '')}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  <span className="inline-block max-w-40 truncate align-middle">{String(vid.thumbnail_path ?? '')}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>{typeof vid.size_bytes === 'number' ? vid.size_bytes.toLocaleString('vi-VN') : String(vid.size_bytes ?? '')}</span>
                    <span className="px-2 py-1 rounded-lg bg-brand/10 text-brand text-xs font-bold">{toMB(vid.size_bytes)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{String(vid.duration_seconds ?? '')}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${vid.is_auto_config ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>{vid.is_auto_config ? 'Có' : 'Không'}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{fmtDate(vid.recorded_at)}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{fmtDate(vid.finished_at)}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${vid.is_auto_delete ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>{vid.is_auto_delete ? 'Có' : 'Không'}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{String(vid.keep_days ?? '')}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${vid.has_logo_overlay ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>{vid.has_logo_overlay ? 'Có' : 'Không'}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{fmtDate(vid.created_at)}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{String(vid.updated_at ?? '')}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onViewVideo(vid)}
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
