import React, { useState, useEffect } from 'react';
import { Video, Store, Users, Box, TrendingUp, Play, Eye, Trash2, ChevronRight, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    subscriptions?: any;
  } | null;
  onViewVideo: (video: any) => void;
  onDeleteVideo: (id: string) => void;
  onUpgrade: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ videos, stores, staff, metrics, onViewVideo, onDeleteVideo, onUpgrade }) => {
  const [timeFilter, setTimeFilter] = useState<'day' | 'month' | 'year'>('day');

  const toHumanSize = (bytes?: number) => {
    if (!bytes || typeof bytes !== 'number' || isNaN(bytes)) return '0 GB';
    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(gb >= 10 ? 0 : 1)} GB`;
  };

  const totalVideos = typeof metrics?.total_videos === 'number' ? metrics!.total_videos : videos.length;
  const totalStores = typeof metrics?.total_stores === 'number' ? metrics!.total_stores : stores.length;
  const totalEmployees = typeof metrics?.total_employees === 'number' ? metrics!.total_employees : staff.length;
  const totalSizeStr = toHumanSize(metrics?.total_size_bytes);

  const [apiChartData, setApiChartData] = useState<any[]>([]);
  const [growthValue, setGrowthValue] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

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

  const generatePath = (key: 'new' | 'returned') => {
    if (currentData.length < 2) return '';
    const points = currentData.map((d, i) => {
      const x = (i / (currentData.length - 1)) * 100;
      const y = 100 - (d[key] / maxValue) * 100;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="space-y-8">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Tổng video', value: String(totalVideos), icon: <Video className="text-brand" />, trend: '', color: 'bg-brand/10' },
          { label: 'Cửa hàng', value: String(totalStores), icon: <Store className="text-emerald-600" />, trend: '', color: 'bg-emerald-100' },
          { label: 'Nhân viên', value: String(totalEmployees), icon: <Users className="text-amber-600" />, trend: '', color: 'bg-amber-100' },
          { label: 'Dung lượng', value: totalSizeStr, icon: <Box className="text-rose-600" />, trend: '', color: 'bg-rose-100' },
          { label: 'Dung lượng trọn đời', value: toHumanSize(metrics?.total_lifetime_bytes), icon: <History className="text-indigo-600" />, trend: '', color: 'bg-indigo-100' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center`}>
                {stat.icon}
              </div>
              <span className="text-xs font-bold text-slate-400"></span>
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Hoạt động gần đây</h3>
            <button className="text-brand text-sm font-bold">Xem tất cả</button>
          </div>
          <div className="space-y-6">
            {videos.slice(0, 4).map((vid, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                    <Play size={20} fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Đã quay video đơn {vid.orderId}</p>
                    <p className="text-xs text-slate-500">{vid.store} • {vid.time}</p>
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

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col h-full min-h-[450px]">
          <div className="flex items-center justify-between mb-8">
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

          <div className="flex-1 flex flex-col">
            <div className="h-48 mt-8 mb-4 relative">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="w-full border-t border-slate-100 h-0" />
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={timeFilter}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative"
                >
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    {/* New Orders Line */}
                    <motion.path
                      d={generatePath('new')}
                      fill="none"
                      stroke="#4F46E5"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                    {/* Returned Orders Line */}
                    <motion.path
                      d={generatePath('returned')}
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    />

                    {/* Points and Tooltips */}
                    {currentData.map((d, i) => {
                      const x = (i / (currentData.length - 1)) * 100;
                      const yNew = 100 - (d.new / maxValue) * 100;
                      const yReturned = 100 - (d.returned / maxValue) * 100;
                      
                      return (
                        <g key={i}>
                          <circle cx={x} cy={yNew} r="1.5" fill="#4F46E5" className="cursor-pointer" />
                          <circle cx={x} cy={yReturned} r="1.5" fill="#EF4444" className="cursor-pointer" />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Labels and Hover areas */}
                  <div className="absolute inset-0 flex justify-between">
                    {currentData.map((d, i) => (
                      <div key={i} className="group relative flex-1 flex flex-col justify-end">
                        <div className="absolute inset-y-0 w-px bg-slate-100 opacity-0 group-hover:opacity-100 left-1/2 -translate-x-1/2 pointer-events-none" />
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-32">
                          <div className="bg-slate-900 text-white p-2 rounded-xl shadow-xl space-y-1">
                            <p className="text-[10px] font-bold border-bottom border-slate-700 pb-1 mb-1">{d.label}</p>
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span className="text-[9px]">Mới:</span>
                              </span>
                              <span className="text-[9px] font-bold">{d.new}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                <span className="text-[9px]">Hoàn:</span>
                              </span>
                              <span className="text-[9px] font-bold">{d.returned}</span>
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1" />
                        </div>

                        <span className="text-[10px] text-slate-400 font-bold mt-3 block text-center absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                          {d.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-brand" />
                  <span className="text-xs font-bold text-slate-600">Đơn mới</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
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
