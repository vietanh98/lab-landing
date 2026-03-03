import React from 'react';
import { Eye, ArrowUpRight, Trash2 } from 'lucide-react';

interface VideoManagementProps {
  videos: any[];
  onViewVideo: (video: any) => void;
  onDeleteVideo: (id: string) => void;
}

const VideoManagement: React.FC<VideoManagementProps> = ({ videos, onViewVideo, onDeleteVideo }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Mã Video</th>
              <th className="px-6 py-4">Mã đơn hàng</th>
              <th className="px-6 py-4">Cửa hàng</th>
              <th className="px-6 py-4">Thời gian</th>
              <th className="px-6 py-4">Dung lượng</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {videos.map((vid, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 font-bold text-slate-900">{vid.id}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{vid.orderId}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{vid.store}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{vid.time}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{vid.size}</td>
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
  );
};

export default VideoManagement;
