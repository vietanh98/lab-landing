import React from 'react';
import { Video, Store, Users, Box, TrendingUp, Play, Eye, Trash2 } from 'lucide-react';

interface DashboardProps {
  videos: any[];
  stores: any[];
  staff: any[];
  onViewVideo: (video: any) => void;
  onDeleteVideo: (id: string) => void;
  onUpgrade: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ videos, stores, staff, onViewVideo, onDeleteVideo, onUpgrade }) => {
  return (
    <div className="space-y-8">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Tổng video', value: videos.length.toString(), icon: <Video className="text-brand" />, trend: '+12%', color: 'bg-brand/10' },
          { label: 'Cửa hàng', value: stores.length.toString().padStart(2, '0'), icon: <Store className="text-emerald-600" />, trend: '0%', color: 'bg-emerald-100' },
          { label: 'Nhân viên', value: staff.length.toString().padStart(2, '0'), icon: <Users className="text-amber-600" />, trend: '+1', color: 'bg-amber-100' },
          { label: 'Dung lượng', value: '45.2 GB', icon: <Box className="text-rose-600" />, trend: '75%', color: 'bg-rose-100' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center`}>
                {stat.icon}
              </div>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <TrendingUp size={14} />
                {stat.trend}
              </span>
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

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <h3 className="font-bold text-slate-900 mb-6">Gói dịch vụ</h3>
          <div className="bg-slate-900 rounded-2xl p-6 text-white mb-6">
            <p className="text-brand text-xs font-bold uppercase tracking-wider mb-1">Chuyên nghiệp</p>
            <h4 className="text-xl font-bold mb-4">199.000đ / tháng</h4>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Video đã dùng</span>
                <span>450/500</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-brand w-[90%]" />
              </div>
            </div>
            <button 
              onClick={onUpgrade}
              className="w-full py-3 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-xl transition-all"
            >
              Nâng cấp ngay
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Box size={16} className="text-emerald-500" />
              Lưu trữ 500 video
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Box size={16} className="text-emerald-500" />
              Chất lượng Full HD
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
