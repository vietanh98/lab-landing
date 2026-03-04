import React, { useEffect, useState, useRef } from 'react';
import { Store, Edit, Trash2, Plus } from 'lucide-react';

interface StoreManagementProps {
  stores: any[];
  refreshKey?: number;
  onEditStore: (store: any) => void;
  onDeleteStore: (id: string) => void;
  onAddStore: () => void;
}

const StoreManagement: React.FC<StoreManagementProps> = ({ stores, refreshKey, onEditStore, onDeleteStore, onAddStore }) => {
  const [localStores, setLocalStores] = useState<any[]>(stores || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const lastRefreshKeyRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const endpoint = `${apiBase}/api/v1/store`;
        const token = localStorage.getItem('token');

        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(endpoint, { headers });
        const data = await res.json();

        const ok = res.ok && (data?.status === true || data?.status_code === 0);
        if (ok) {
          // API returns pagination object under `data` with items in `data.data`.
          // Try multiple fallbacks: data.data.data, data.data, data.stores, raw data
          const listCandidate = data?.data?.data ?? data?.data ?? data?.stores ?? data ?? [];
          const items = Array.isArray(listCandidate)
            ? listCandidate
            : (Array.isArray(listCandidate?.data) ? listCandidate.data : []);
          setLocalStores(items);
        } else {
          setError(data?.message || 'Không thể lấy danh sách cửa hàng');
        }
      } catch (err) {
        setError('Không thể kết nối đến máy chủ');
      } finally {
        setLoading(false);
      }
    };

    const shouldFetch =
      !hasFetchedRef.current ||
      lastRefreshKeyRef.current !== refreshKey;

    if (!shouldFetch) return;

    hasFetchedRef.current = true;
    lastRefreshKeyRef.current = refreshKey;
    fetchStores();
  }, [refreshKey]);

  const handleUpdateStore = async (store: any) => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${apiBase}/api/v1/store/${store.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          user_id: store.user_id,
          name: store.name,
          logo: store.logo,
          position: store.position,
          id: store.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Update thất bại');
      }

      // ✅ Cập nhật lại local state
      setLocalStores(prev =>
        prev.map(s => (s.id === store.id ? { ...s, ...store } : s))
      );

      alert('Cập nhật cửa hàng thành công');
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra khi cập nhật');
    }
  };

  const handleDelete = (id: string) => {
    if (onDeleteStore) onDeleteStore(id);
    // setLocalStores(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div>
      {loading && (
        <div className="p-6 text-center">Đang tải danh sách cửa hàng...</div>
      )}

      {error && (
        <div className="p-6 text-center text-red-600">
          <div>{error}</div>
          <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-brand text-white rounded-lg">Thử lại</button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {localStores.map((store, i) => (
            <div key={store.id || i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start justify-between group">
              <div className="flex gap-4">
                {store.logo ? (
                  <img src={store.logo} alt={store.name || 'logo'} className="w-12 h-12 object-cover rounded-2xl" />
                ) : (
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Store size={24} />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900">{store.name}</h3>
                  {store.user_name && <p className="text-xs text-slate-500 mt-0.5">owner: {store.user_name}</p>}
                  <div className="text-xs text-slate-500 mt-1">
                    {store.total_video_count != null && (
                      <span className="mr-2">🎥 {store.total_video_count}</span>
                    )}
                    {store.total_size_bytes != null && (
                      <span>💾 {Math.round(store.total_size_bytes/1024)}KB</span>
                    )}
                  </div>
                  <span className="inline-block mt-3 text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full uppercase tracking-wider">
                    {store.status}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => onEditStore && onEditStore(store)}
                  className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg" title="Sửa cửa hàng"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(store.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg" title="Xóa cửa hàng"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={onAddStore}
            className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-brand hover:text-brand transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-brand/10 transition-colors">
              <Plus size={24} />
            </div>
            <span className="font-bold">Thêm cửa hàng mới</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default StoreManagement;
