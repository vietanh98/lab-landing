import React, { useState } from 'react';
import { Video, Store, Users, Box, TrendingUp, Play, Eye, Trash2, ChevronRight } from 'lucide-react';
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
    subscriptions?: any;
  } | null;
  onViewVideo: (video: any) => void;
  onDeleteVideo: (id: string) => void;
  onUpgrade: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ videos, stores, staff, metrics, onViewVideo, onDeleteVideo, onUpgrade }) => {
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('day');

  const toHumanSize = (bytes?: number) => {
    if (!bytes || typeof bytes !== 'number' || isNaN(bytes)) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(gb >= 10 ? 0 : 1)} GB`;
  };

  const totalVideos = typeof metrics?.total_videos === 'number' ? metrics!.total_videos : videos.length;
  const totalStores = typeof metrics?.total_stores === 'number' ? metrics!.total_stores : stores.length;
  const totalEmployees = typeof metrics?.total_employees === 'number' ? metrics!.total_employees : staff.length;
  const totalSizeStr = toHumanSize(metrics?.total_size_bytes);

  const chartData = {
    day: [
      { label: '08:00', value: 12 },
      { label: '10:00', value: 34 },
      { label: '12:00', value: 45 },
      { label: '14:00', value: 28 },
      { label: '16:00', value: 56 },
      { label: '18:00', value: 42 },
      { label: '20:00', value: 15 },
    ],
    week: [
      { label: 'Thứ 2', value: 120 },
      { label: 'Thứ 3', value: 150 },
      { label: 'Thứ 4', value: 180 },
      { label: 'Thứ 5', value: 140 },
      { label: 'Thứ 6', value: 210 },
      { label: 'Thứ 7', value: 250 },
      { label: 'Chủ nhật', value: 190 },
    ],
    month: [
      { label: 'Tuần 1', value: 850 },
      { label: 'Tuần 2', value: 940 },
      { label: 'Tuần 3', value: 1100 },
      { label: 'Tuần 4', value: 890 },
    ]
  };

  return (
    <div className="space-y-8">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Tổng video', value: String(totalVideos), icon: <Video className="text-brand" />, trend: '', color: 'bg-brand/10' },
          { label: 'Cửa hàng', value: String(totalStores), icon: <Store className="text-emerald-600" />, trend: '', color: 'bg-emerald-100' },
          { label: 'Nhân viên', value: String(totalEmployees), icon: <Users className="text-amber-600" />, trend: '', color: 'bg-amber-100' },
          { label: 'Dung lượng', value: totalSizeStr, icon: <Box className="text-rose-600" />, trend: '', color: 'bg-rose-100' },
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
              {(['day', 'week', 'month'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    timeFilter === t 
                      ? 'bg-white text-brand shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'day' ? 'Ngày' : t === 'week' ? 'Tuần' : 'Tháng'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex items-end justify-between h-48 gap-2 px-2 mt-4 mb-4">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={timeFilter}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-end justify-between w-full h-full gap-3"
                >
                  {chartData[timeFilter].map((item, idx) => {
                    const max = Math.max(...chartData[timeFilter].map(d => d.value));
                    const height = (item.value / max) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                            {item.value} video
                          </div>
                          <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 mx-auto -mt-1" />
                        </div>

                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: idx * 0.05 }}
                          className="w-full bg-gradient-to-t from-brand/20 to-brand rounded-t-lg group-hover:to-brand-dark transition-colors relative min-h-[4px]"
                        />
                        <span className="text-[10px] text-slate-400 font-bold mt-3 block whitespace-nowrap">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tăng trưởng</p>
                    <p className="text-sm font-bold text-slate-900">+12.5% so với {timeFilter === 'day' ? 'hôm qua' : timeFilter === 'week' ? 'tuần trước' : 'tháng trước'}</p>
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
