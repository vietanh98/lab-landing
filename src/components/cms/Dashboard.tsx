import React, { useState, useEffect } from 'react';
import { Video, Store, Users, TrendingUp, Play, Eye, Trash2, ChevronRight, History, HardDrive, CalendarClock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
// Shared formatter — everyone in the app renders storage as GB now.
import { formatBytesAsGB, formatGB, storageUsagePercent } from '../../utils/format';

interface DashboardProps {
  videos: any[];
  stores: any[];
  staff: any[];
  metrics?: {
    total_stores?: number;
    total_videos?: number;
    total_size_bytes?: number;
    total_employees?: number;
    total_lifetime_bytes?: number;
    remaining_storage_bytes?: number;
    subscription_expires_at?: string;
    subscriptions?: any;
  } | null;
  onViewVideo: (video: any) => void;
  onDeleteVideo: (id: string) => void;
  onUpgrade: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ videos, stores, staff, metrics, onViewVideo, onDeleteVideo, onUpgrade }) => {
  const [timeFilter, setTimeFilter] = useState<'day' | 'month' | 'year'>('day');

  // `personal` block fetched from the new /api/v1/dashboard endpoint. It's a
  // superset of the old `metrics` prop (which comes from /auth/me) and also
  // carries quota usage percentage, days-until-expiry, plan name, etc. We
  // prefer `personal` when present and fall back to `metrics` so the UI keeps
  // working if the new endpoint isn't deployed yet.
  const [personal, setPersonal] = useState<any | null>(null);
  const eff = personal || metrics || {};

  const totalVideos = typeof eff?.total_videos === 'number' ? eff.total_videos : videos.length;
  const totalStores = typeof eff?.total_stores === 'number' ? eff.total_stores : stores.length;
  const totalEmployees = typeof eff?.total_employees === 'number' ? eff.total_employees : staff.length;

  const [apiChartData, setApiChartData] = useState<any[]>([]);
  const [growthValue, setGrowthValue] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // Fetch the new unified dashboard endpoint once on mount. For a non-admin
  // user the response shape is `{ is_admin: false, personal: {...}, admin: null }`.
  // Anything inside `personal` (quota usage, expiry countdown, plan name)
  // becomes visible to the user — the admin block is dropped by the backend.
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${apiBase}/api/v1/dashboard`, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data?.status === true) && data?.data?.personal) {
          setPersonal(data.data.personal);
        }
      } catch {
        // Silent fail — fall back to the `metrics` prop (legacy /auth/me data).
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    const fetchRecentVideos = async () => {
      setLoadingRecent(true);
      try {
        const userInfoStr = localStorage.getItem('user_info');
        if (!userInfoStr) return;
        const userInfo = JSON.parse(userInfoStr);
        const userId = userInfo?.id || userInfo?.user_id;
        if (!userId) return;

        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/users/${userId}/videos/today`;
        const headers: Record<string, string> = { Accept: 'application/json' };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(endpoint, { headers });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data?.status === true || data?.success === true)) {
          const candidate = data?.data?.data ?? data?.data ?? data?.videos ?? [];
          const list = Array.isArray(candidate) ? candidate : [];
          
          const mapped = list.map((v: any) => ({
            ...v,
            url: v.file_url || (v.file_path ? `https://media.labbox.vn/${v.file_path.replace(/^\//, '')}` : ''),
            orderId: String(v.qr_code_1 ?? v.qr_code_2 ?? v.order_id ?? v.title ?? ''),
            store: v.store_name || '',
            time: v.recorded_at ? new Date(v.recorded_at).toLocaleString('vi-VN') : (v.created_at ? new Date(v.created_at).toLocaleString('vi-VN') : '')
          }));
          setRecentVideos(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch recent videos', err);
      } finally {
        setLoadingRecent(false);
      }
    };
    fetchRecentVideos();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/video/stats?type=${timeFilter}`;
        const headers: Record<string, string> = { Accept: 'application/json' };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch(endpoint, { headers });
        const data = await res.json();
        
        if (data?.status && data?.data) {
          const stats = data.data;
          const transformed = (stats.new_orders || []).map((d: any, i: number) => ({
            label: d.label,
            new: d.count,
            returned: stats.return_orders?.[i]?.count || 0
          }));
          setApiChartData(transformed);
          setGrowthValue(stats.growth || 0);
        }
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [timeFilter]);

  const currentData = apiChartData.length > 0 ? apiChartData : [
    { label: '08:00', new: 0, returned: 0 },
    { label: '10:00', new: 0, returned: 0 },
    { label: '12:00', new: 0, returned: 0 },
    { label: '14:00', new: 0, returned: 0 },
    { label: '16:00', new: 0, returned: 0 },
    { label: '18:00', new: 0, returned: 0 },
    { label: '20:00', new: 0, returned: 0 },
  ];
  const maxValue = Math.max(...currentData.map(d => Math.max(d.new, d.returned))) || 1;


  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700/50 backdrop-blur-md">
          <p className="text-[10px] font-bold border-b border-slate-700 pb-1.5 mb-1.5 opacity-60 uppercase tracking-wider">{label}</p>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-[9px] font-medium text-slate-300">{entry.name}:</span>
                </div>
                <span className="text-[10px] font-black">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Derived quota numbers — re-computed each render so `personal` updates flow
  // through. `usage_percent` comes straight from the backend when it's present
  // (it already clamps at 100); we fall back to a local calculation if only
  // the legacy `metrics` prop is available.
  const usedBytes = Number(eff?.total_lifetime_bytes ?? 0);
  const remainingBytes = Number(eff?.remaining_storage_bytes ?? 0);
  const maxGB = Number(eff?.max_storage_gb ?? 0);
  const usagePct = typeof eff?.usage_percent === 'number'
    ? eff.usage_percent
    : storageUsagePercent(usedBytes, maxGB);
  const daysLeft = typeof eff?.days_until_expiry === 'number' ? eff.days_until_expiry : null;

  // Expiry banner colour ramps from info → warning → error as the deadline
  // approaches. Negative = already expired.
  const expiryBanner = (() => {
    if (!eff?.subscription_expires_at) return null;
    if (daysLeft == null) return null;
    if (daysLeft < 0) return { color: 'rose', text: `Gói đã hết hạn ${Math.abs(daysLeft)} ngày trước` };
    if (daysLeft <= 7) return { color: 'amber', text: `Gói sẽ hết hạn sau ${daysLeft} ngày` };
    return null;
  })();

  return (
    <div className="space-y-6 min-w-0">
      {/* Expiry warning banner (shown only when plan is <=7d or expired) */}
      {expiryBanner && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
          expiryBanner.color === 'rose'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <AlertTriangle size={20} />
          <div className="flex-1">
            <p className="font-bold">{expiryBanner.text}</p>
            {eff?.plan_name && <p className="text-xs opacity-75">Gói hiện tại: {eff.plan_name}</p>}
          </div>
          <button
            onClick={onUpgrade}
            className="text-sm font-bold underline-offset-2 hover:underline"
          >
            Gia hạn
          </button>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
        {[
          { label: 'Tổng video', value: String(totalVideos), icon: <Video className="text-brand" />, trend: '', color: 'bg-brand/10' },
          { label: 'Cửa hàng', value: String(totalStores), icon: <Store className="text-emerald-600" />, trend: '', color: 'bg-emerald-100' },
          { label: 'Nhân viên', value: String(totalEmployees), icon: <Users className="text-amber-600" />, trend: '', color: 'bg-amber-100' },
          { label: 'Dung lượng đã dùng', value: formatBytesAsGB(usedBytes), icon: <History className="text-indigo-600" />, trend: '', color: 'bg-indigo-100' },
          { label: 'Dung lượng còn lại', value: formatBytesAsGB(remainingBytes), icon: <HardDrive className="text-cyan-600" />, trend: '', color: 'bg-cyan-100' },
          { label: 'Hết hạn gói', value: eff?.subscription_expires_at ? new Date(eff.subscription_expires_at).toLocaleDateString('vi-VN') : '—', icon: <CalendarClock className="text-violet-600" />, trend: '', color: 'bg-violet-100' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${stat.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                {React.cloneElement(stat.icon as any, { size: 20 })}
              </div>
              <span className="text-xs font-bold text-slate-400"></span>
            </div>
            <p className="text-xs font-medium text-slate-500 truncate">{stat.label}</p>
            <h3 className="text-lg xl:text-xl font-bold text-slate-900 mt-1 truncate">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Storage progress — only shown when we know the quota (max_storage_gb).
          Bar colour ramps red once >=95% to flag imminent over-quota. */}
      {maxGB > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hạn mức lưu trữ</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {formatBytesAsGB(usedBytes)}{' '}
                <span className="text-sm font-medium text-slate-500">/ {formatGB(maxGB)}</span>
              </p>
            </div>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              usagePct >= 95 ? 'bg-rose-100 text-rose-700'
                : usagePct >= 75 ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {usagePct.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                usagePct >= 95 ? 'bg-rose-500'
                  : usagePct >= 75 ? 'bg-amber-500'
                  : 'bg-brand'
              }`}
              style={{ width: `${Math.min(100, usagePct)}%` }}
            />
          </div>
          {eff?.plan_name && (
            <p className="text-xs text-slate-500 mt-2">Gói: {eff.plan_name}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-w-0">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Hoạt động gần đây</h3>
            <button className="text-brand text-sm font-bold">Xem tất cả</button>
          </div>
          <div className="space-y-6">
            {loadingRecent ? (
              <p className="text-sm text-slate-500 text-center py-4">Đang tải...</p>
            ) : recentVideos.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Chưa có video nào hôm nay</p>
            ) : recentVideos.slice(0, 4).map((vid, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => onViewVideo(vid)}
                    className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand/10 group-hover:text-brand transition-colors"
                  >
                    <Play size={20} fill="currentColor" />
                  </button>
                  <div>
                    <p className="text-sm font-bold text-slate-900 line-clamp-1">Đã quay video đơn {vid.orderId || 'Không xác định'}</p>
                    <p className="text-xs text-slate-500">{vid.store || 'Không có cửa hàng'} • {vid.time || ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onViewVideo(vid)}
                    className="p-2 text-slate-400 hover:text-brand"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => onDeleteVideo(vid.id)}
                    className="p-2 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col h-full min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Thống kê quay video</h3>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(['day', 'month', 'year'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    timeFilter === t 
                      ? 'bg-white text-brand shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'day' ? 'Ngày' : t === 'month' ? 'Tháng' : 'Năm'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col pt-4">
            <div className="h-56 mt-4 mb-2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={currentData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F27D26" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#F27D26" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorReturned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FB7185" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#FB7185" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }}
                    dy={10}
                    interval={timeFilter === 'day' ? 3 : timeFilter === 'month' ? 4 : 2}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="new"
                    name="Đơn mới"
                    stroke="#F27D26"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorNew)"
                    animationDuration={1500}
                  />
                  <Area
                    type="monotone"
                    dataKey="returned"
                    name="Đơn hoàn"
                    stroke="#FB7185"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorReturned)"
                    animationDuration={1500}
                    animationDelay={200}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#F27D26]" />
                  <span className="text-xs font-bold text-slate-600">Đơn mới</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FB7185]" />
                  <span className="text-xs font-bold text-slate-600">Đơn hoàn</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tăng trưởng</p>
                    <p className="text-sm font-bold text-slate-900">{growthValue >= 0 ? '+' : ''}{growthValue}% so với {timeFilter === 'day' ? 'hôm qua' : timeFilter === 'month' ? 'tháng trước' : 'năm trước'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
