import React, { useEffect, useState, useRef } from 'react';
import { Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import CustomSelect from '../ui/CustomSelect';

interface StaffManagementProps {
  staff: any[];
  onEditStaff: (member: any) => void;
  onDeleteStaff: (id: string) => void;
  refreshKey?: number;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ staff: initialStaff, onEditStaff, onDeleteStaff, refreshKey }) => {
  const [items, setItems] = useState<any[]>(initialStaff || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const hasFetchedRef = useRef(false);
  const lastRefreshKeyRef = useRef<number | undefined>(undefined);
  const lastQueryRef = useRef<string>('');

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      let query = `?page=${page}&per_page=${perPage}`;
      if (filterSearch) query += `&search=${encodeURIComponent(filterSearch)}`;
      if (filterRole) query += `&role_id=${filterRole}`;
      if (filterStatus) query += `&status=${filterStatus}`;
      
      const endpoint = `${apiBase}/api/v1/users${query}`;
      const headers: Record<string, string> = { Accept: 'application/json, text/plain, */*' };
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      headers['X-Timestamp'] = Date.now().toString();

      const res = await fetch(endpoint, { method: 'GET', headers });
      const data = await res.json().catch(() => ({}));
      const ok = res.ok && (data?.status === true || data?.status_code === 0);

      if (!ok) {
        setError(data?.message || 'Không thể tải danh sách nhân viên');
        // fallback to initialStaff if API fails
        if (page === 1) setItems(initialStaff || []);
      } else {
        const rawList = Array.isArray(data?.data?.items)
          ? data.data.items
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.users)
              ? data.users
              : [];
        
        const mapped = rawList.map((u: any) => ({
          ...u,
          id: (u.id !== undefined && u.id !== null ? String(u.id) : u.user_id !== undefined && u.user_id !== null ? String(u.user_id) : u.username || u.email || '') || '',
          name: u.full_name || u.name || u.username || u.email || 'Không rõ tên',
          role: u.role || u.role_name || 'Nhân viên',
          status: u.status || (u.is_active === false ? 'Offline' : 'Online'),
        }));
        setItems(mapped);

        // Pagination metadata
        const total = Number(data?.data?.total_items ?? data?.data?.total ?? data?.meta?.total ?? data?.pagination?.total ?? 0);
        const lastPage = Number(data?.data?.total_pages ?? data?.meta?.last_page ?? data?.pagination?.total_pages ?? 0);
        
        setTotalItems(total);
        if (lastPage > 0) {
          setTotalPages(lastPage);
        } else if (total > 0) {
          setTotalPages(Math.max(1, Math.ceil(total / perPage)));
        } else {
          setTotalPages(1);
        }
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ');
      if (page === 1) setItems(initialStaff || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const queryKey = `${page}:${perPage}:${filterSearch}:${filterRole}:${filterStatus}`;
    const shouldFetch = !hasFetchedRef.current || lastRefreshKeyRef.current !== refreshKey || lastQueryRef.current !== queryKey;
    if (shouldFetch) {
      hasFetchedRef.current = true;
      lastRefreshKeyRef.current = refreshKey;
      lastQueryRef.current = queryKey;
      fetchStaff();
    }
  }, [page, perPage, refreshKey, filterSearch, filterRole, filterStatus]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
      <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">
            Danh sách nhân viên {totalItems > 0 && `(${totalItems})`}
          </span>
          <div className="flex items-center gap-2 min-w-[120px]">
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={filterSearch}
            onChange={(e) => {
              setFilterSearch(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand transition-all"
            placeholder="Tìm theo tên, email, username..."
          />
          <CustomSelect
            name="filterRole"
            label=""
            hideLabel
            defaultValue={filterRole}
            placeholder="Vai trò (tất cả)"
            options={[
              { id: '26', name: 'Admin' },
              { id: '28', name: 'Chủ shop' },
              { id: '27', name: 'Nhân viên' }
            ]}
            onChange={(val) => {
              setFilterRole(String(val));
              setPage(1);
            }}
          />
          <CustomSelect
            name="filterStatus"
            label=""
            hideLabel
            defaultValue={filterStatus}
            placeholder="Trạng thái (tất cả)"
            options={[
              { id: '2', name: 'Hoạt động' },
              { id: '1', name: 'Không hoạt động' }
            ]}
            onChange={(val) => {
              setFilterStatus(String(val));
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-sm">
            <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Nhân viên</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Số điện thoại</th>
              <th className="px-6 py-4">Vai trò</th>
              <th className="px-6 py-4">Ngày tạo</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-slate-400">Đang tải dữ liệu...</td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-slate-400">Không tìm thấy nhân viên nào</td>
              </tr>
            )}
            {!loading && items.map((s, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">
                      {(s.name || s.full_name || s.username || s.email || '?').charAt(0)}
                    </div>
                    <span className="font-bold text-slate-900">
                      {s.name || s.full_name || s.username || s.email || 'Không rõ tên'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{s.username || '—'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{s.email || '—'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{s.phone || '—'}</td>
                <td className="px-6 py-4">
                  {(() => {
                    const roleName =
                      (Array.isArray(s.roles) && s.roles.length > 0
                        ? s.roles.map((r: any) => r.description || r.name || r.role_name).join(', ')
                        : s.role_name || s.role || '—');
                    return <span className="text-sm text-slate-600 font-medium">{roleName}</span>;
                  })()}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {s.created_at
                    ? new Date(s.created_at).toLocaleString('vi-VN')
                    : '—'}
                </td>
                <td className="px-6 py-4">
                  {(() => {
                    const numericStatus = Number(s.status);
                    const isActive = numericStatus === 2;
                    const statusText =
                      numericStatus === 1
                        ? 'Không hoạt động'
                        : numericStatus === 2
                        ? 'Hoạt động'
                        : 'Không rõ';
                    return (
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        <span className="text-sm text-slate-600">{statusText}</span>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => onEditStaff(s)}
                      className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg" title="Sửa nhân viên"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => onDeleteStaff(s.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg" title="Xóa nhân viên"
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

      {/* Pagination Controls */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Record info */}
        <span className="text-xs text-slate-400 font-medium order-2 sm:order-1">
          {totalItems > 0
            ? `Hiển thị ${Math.min((page - 1) * perPage + 1, totalItems)}–${Math.min(page * perPage, totalItems)} trong ${totalItems} nhân viên`
            : 'Không có dữ liệu'}
        </span>

        {/* Page buttons */}
        <div className="flex items-center gap-1 order-1 sm:order-2">
          {/* Prev */}
          <button
            disabled={page === 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-30 hover:bg-slate-50 hover:border-slate-300 transition-all"
            title="Trang trước"
          >
            <ChevronLeft size={15} />
          </button>

          {/* Page numbers */}
          {(() => {
            const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
            if (totalPages <= 7) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              pages.push(1);
              if (page > 4) pages.push('ellipsis-start');
              const start = Math.max(2, page - 1);
              const end = Math.min(totalPages - 1, page + 1);
              for (let i = start; i <= end; i++) pages.push(i);
              if (page < totalPages - 3) pages.push('ellipsis-end');
              pages.push(totalPages);
            }
            return pages.map((p, idx) => {
              if (p === 'ellipsis-start' || p === 'ellipsis-end') {
                return (
                  <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm select-none">
                    …
                  </span>
                );
              }
              const isActive = p === page;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  disabled={loading}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold transition-all border ${
                    isActive
                      ? 'bg-brand text-white border-brand shadow-sm shadow-brand/30 scale-105'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  } disabled:opacity-60`}
                >
                  {p}
                </button>
              );
            });
          })()}

          {/* Next */}
          <button
            disabled={page === totalPages || loading}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-30 hover:bg-slate-50 hover:border-slate-300 transition-all"
            title="Trang sau"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Spacer for alignment on sm+ */}
        <div className="hidden sm:block w-[180px] order-3" />
      </div>
    </div>
  );
};

export default StaffManagement;
