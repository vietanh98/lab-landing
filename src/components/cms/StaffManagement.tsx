import React, { useEffect, useState, useRef } from 'react';
import { Edit, Trash2, ChevronLeft, ChevronRight, Search, ShieldCheck, Activity, X as XIcon } from 'lucide-react';
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
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [roles, setRoles] = useState<any[]>([{ id: 'all', name: 'Tất cả vai trò' }]);
  const [appliedFilters, setAppliedFilters] = useState({
    filterSearch: '',
    filterRole: '',
    filterStatus: '',
  });
  const hasFetchedRef = useRef(false);
  const lastRefreshKeyRef = useRef<number | undefined>(undefined);
  const lastQueryRef = useRef<string>('');

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      let query = `?page=${page}&per_page=${perPage}`;
      if (appliedFilters.filterSearch) query += `&search=${encodeURIComponent(appliedFilters.filterSearch)}`;
      if (appliedFilters.filterRole) query += `&role_id=${appliedFilters.filterRole}`;
      if (appliedFilters.filterStatus) query += `&status=${appliedFilters.filterStatus}`;
      
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
        // Backend response shape for /api/v1/users:
        //   { status, data: [...userResponses], extra_data: MetaData }
        // where MetaData carries { total, last_page, current_page, per_page, ... }.
        // The earlier code probed `data.data.items` / `data.data.total` which
        // never matched our API — `data.data` IS the array, it doesn't have
        // `.items` or `.total` attached to it. Result: pagination never worked.
        const rawList = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.items)
            ? data.data.items
            : Array.isArray(data?.data?.data)
              ? data.data.data
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

        // Extract roles from the current list and update roles state if needed
        const currentStaffRoles = new Map();
        rawList.forEach((u: any) => {
          if (Array.isArray(u.roles)) {
            u.roles.forEach((r: any) => {
              currentStaffRoles.set(String(r.id), r.description || r.name);
            });
          }
        });

        if (currentStaffRoles.size > 0) {
          setRoles(prev => {
            const newRoles = [...prev];
            currentStaffRoles.forEach((name, id) => {
              if (!newRoles.find(r => String(r.id) === id)) {
                newRoles.push({ id, name });
              }
            });
            return newRoles;
          });
        }

        // Pagination metadata — the BE's PaginateResponse uses
        // `extra_data.{total, last_page, current_page, per_page}`. We keep
        // the older probe paths as fallbacks for any legacy / differently-
        // wrapped endpoint that might still respond to this URL.
        const total = Number(
          data?.extra_data?.total ??
          data?.data?.total_items ??
          data?.data?.total ??
          data?.meta?.total ??
          data?.pagination?.total ??
          0
        );
        const lastPage = Number(
          data?.extra_data?.last_page ??
          data?.data?.total_pages ??
          data?.data?.last_page ??
          data?.meta?.last_page ??
          data?.pagination?.total_pages ??
          0
        );

        setTotalItems(total);
        if (lastPage > 0) {
          setTotalPages(lastPage);
        } else if (total > 0) {
          // Fallback when the server didn't surface `last_page` but we know
          // the total — derive it from perPage so navigation still works.
          setTotalPages(Math.max(1, Math.ceil(total / perPage)));
        } else {
          setTotalPages(1);
        }

        // Defensive: if the current page is now beyond the last page
        // (possible after a filter change reduces the result set), pull it
        // back. The watch-triggered refetch will then load the right slice.
        if (lastPage > 0 && page > lastPage) {
          setPage(lastPage);
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
    const queryKey = `${page}:${perPage}:${appliedFilters.filterSearch}:${appliedFilters.filterRole}:${appliedFilters.filterStatus}`;
    const shouldFetch = !hasFetchedRef.current || lastRefreshKeyRef.current !== refreshKey || lastQueryRef.current !== queryKey;
    if (shouldFetch) {
      hasFetchedRef.current = true;
      lastRefreshKeyRef.current = refreshKey;
      lastQueryRef.current = queryKey;
      fetchStaff();
    }
  }, [page, perPage, refreshKey, appliedFilters]);

  // ---------- Auto-apply filters ----------
  //
  // The old UX required clicking a "Tìm kiếm" button to commit a filter
  // change. That's now gone — typing in the search box or touching a dropdown
  // applies the filter automatically. Two rules keep this efficient:
  //
  //   (a) Free-text search is debounced (400ms) so we don't spam the API
  //       on every keystroke. A trailing/leading space shouldn't register
  //       as a new search either — we trim before comparing.
  //   (b) Dropdown changes apply immediately because they're discrete user
  //       actions — no point waiting.
  //
  // Each applied-filter mutation also resets the page to 1, so a user who
  // was browsing page 5 doesn't end up staring at an empty page 5 of a
  // narrower result set.

  useEffect(() => {
    const next = filterSearch.trim();
    const handle = setTimeout(() => {
      setAppliedFilters(prev => (prev.filterSearch === next ? prev : { ...prev, filterSearch: next }));
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [filterSearch]);

  useEffect(() => {
    const nextRole = filterRole === 'all' ? '' : filterRole;
    const nextStatus = filterStatus === 'all' ? '' : filterStatus;
    setAppliedFilters(prev => {
      if (prev.filterRole === nextRole && prev.filterStatus === nextStatus) return prev;
      return { ...prev, filterRole: nextRole, filterStatus: nextStatus };
    });
    setPage(1);
  }, [filterRole, filterStatus]);

  // Shortcut for the "Xoá bộ lọc" button — only visible when any filter is
  // currently active so the UI stays uncluttered when there's nothing to clear.
  const hasActiveFilter =
    filterSearch.trim().length > 0 || filterRole !== 'all' || filterStatus !== 'all';

  const clearAllFilters = () => {
    setFilterSearch('');
    setFilterRole('all');
    setFilterStatus('all');
    // The debounce / immediate effects above will flush applied-filter state
    // back to empty and reset page to 1 on the next tick.
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/rbac/roles`;
        const headers: Record<string, string> = { Accept: 'application/json' };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();
        const res = await fetch(endpoint, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data?.status === true || data?.status_code === 0)) {
          const listCandidate = data?.data?.data ?? data?.data ?? data?.roles ?? data ?? [];
          const list = Array.isArray(listCandidate) ? listCandidate : (Array.isArray(listCandidate?.data) ? listCandidate.data : []);
          const mappedRoles = list.map((r: any) => ({ id: String(r.id), name: r.description || r.name }));
          setRoles(prev => {
            const allRoles = [...prev];
            mappedRoles.forEach(r => {
              if (!allRoles.find(existing => String(existing.id) === String(r.id))) {
                allRoles.push(r);
              }
            });
            return allRoles;
          });
        }
      } catch (err) {
        console.error('Error fetching roles', err);
      }
    };
    fetchRoles();
  }, []);

  return (
    // Root uses `h-full min-h-0` so the card always fits the viewport slot
    // given by CMSLayout (which provides a flex-1 + min-h-0 chain down to
    // here). We intentionally keep `overflow-visible` on the card itself —
    // the filter dropdowns (CustomSelect) render with absolute positioning
    // and would be clipped if we used `overflow-hidden`. Only the table
    // container below gets its own scroll.
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-visible flex flex-col h-full min-h-0">
      {/* Filter bar — natural height, stays pinned at top of the card. */}
      <div className="flex-shrink-0 p-4 border-b border-slate-100 flex flex-col gap-4 relative z-50">
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
        
        <div className="mx-2 mb-2 p-3 bg-white rounded-[1.5rem] border border-slate-100 shadow-lg shadow-slate-200/30 relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-2xl -mr-12 -mt-12" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <Search size={10} className="text-slate-300" />
                Tìm kiếm
              </label>
              <div className="relative group">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" />
                <input
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  // `pr-10` reserves space on the right so the inline clear
                  // button (rendered only when the field has content) doesn't
                  // overlap the typed text.
                  className="w-full h-11 pl-10 pr-10 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all"
                  placeholder="Tên, email, username..."
                />
                {filterSearch.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterSearch('')}
                    title="Xoá từ khoá"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                  >
                    <XIcon size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <ShieldCheck size={10} className="text-slate-300" />
                Vai trò
              </label>
              <CustomSelect
                name="filterRole"
                label=""
                hideLabel
                icon={ShieldCheck}
                defaultValue={filterRole}
                placeholder="Tất cả vai trò"
                options={roles}
                onChange={(val) => setFilterRole(String(val))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <Activity size={10} className="text-slate-300" />
                Trạng thái
              </label>
              <CustomSelect
                name="filterStatus"
                label=""
                hideLabel
                icon={Activity}
                defaultValue={filterStatus}
                placeholder="Tất cả trạng thái"
                options={[
                  { id: 'all', name: 'Tất cả trạng thái' },
                  { id: '2', name: 'Hoạt động' },
                  { id: '1', name: 'Không hoạt động' }
                ]}
                onChange={(val) => setFilterStatus(String(val))}
              />
            </div>

            {/*
              The old "Tìm kiếm" submit button is gone — filters apply live.
              We reuse the 4th column for a "Xoá bộ lọc" shortcut that only
              shows up when at least one filter is active, so the filter bar
              stays quiet when nothing's filtered.
            */}
            <div className="h-11">
              {hasActiveFilter ? (
                <button
                  onClick={clearAllFilters}
                  className="w-full h-full flex items-center justify-center gap-2 px-4 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-2xl transition-all active:scale-[0.98]"
                  title="Xoá tất cả bộ lọc"
                >
                  <XIcon size={16} />
                  <span className="text-sm">Xoá bộ lọc</span>
                </button>
              ) : (
                // Reserve the visual slot so the grid doesn't collapse and
                // shift the other three columns when this button disappears.
                <div className="w-full h-full" aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/*
        Table container is the only part that should scroll. `flex-1 min-h-0`
        makes it consume the remaining height between filter and pagination
        (without forcing the card to grow), and `overflow-auto` handles both
        wide tables and long row lists. `<thead sticky top-0>` keeps the
        column headers visible while the body scrolls.
      */}
      <div className="flex-1 min-h-0 overflow-auto">
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

      {/* Pagination Controls — natural height, stays pinned at bottom. */}
      <div className="flex-shrink-0 p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
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
