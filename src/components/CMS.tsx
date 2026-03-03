import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  Store, 
  Video, 
  Users, 
  LogOut, 
  Bell, 
  Search, 
  Plus, 
  MoreVertical,
  TrendingUp,
  Clock,
  Shield,
  CreditCard,
  Trash2,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2
} from 'lucide-react';

type Tab = 'dashboard' | 'subscription' | 'stores' | 'videos' | 'users';

interface StoreData {
  id: string;
  name: string;
  videos: number;
}

interface VideoData {
  id: string;
  orderId: string;
  store: string;
  time: string;
  size: string;
  thumbnail: string;
}

interface UserData {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'Online' | 'Offline';
}

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-brand text-white shadow-lg shadow-brand/20' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon size={20} />
    <span className="font-semibold text-sm">{label}</span>
  </button>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const Dashboard = ({ stats }: { stats: any }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: 'Tổng Video', value: stats.totalVideos, change: '+12%', icon: Video, color: 'bg-blue-500' },
        { label: 'Dung lượng', value: '45.2 GB', change: '75%', icon: Shield, color: 'bg-emerald-500' },
        { label: 'Cửa hàng', value: stats.totalStores, change: 'Active', icon: Store, color: 'bg-orange-500' },
        { label: 'Nhân viên', value: stats.totalUsers, change: 'Online', icon: Users, color: 'bg-purple-500' },
      ].map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${stat.color} text-white`}>
              <stat.icon size={24} />
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              stat.change.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
            }`}>
              {stat.change}
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
        </div>
      ))}
    </div>

    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold text-slate-900">Video gần đây</h3>
          <button className="text-brand text-sm font-bold hover:underline">Xem tất cả</button>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-10 bg-slate-200 rounded-lg overflow-hidden">
                  <img src={`https://picsum.photos/seed/vid${i}/100/60`} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Đơn hàng #DH882{i}</p>
                  <p className="text-xs text-slate-500">Shop Mẹ Bé • 2 phút trước</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-slate-400">12.4 MB</span>
                <button className="p-2 text-slate-400 hover:text-slate-600">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-8">Gói hiện tại</h3>
        <div className="bg-brand/5 p-6 rounded-2xl border border-brand/10 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="text-brand" size={24} />
            <span className="font-bold text-slate-900">Gói Chuyên Nghiệp</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Sử dụng</span>
              <span className="font-bold text-slate-900">450 / 500 video</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="w-[90%] h-full bg-brand" />
            </div>
          </div>
        </div>
        <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all">
          Nâng cấp ngay
        </button>
      </div>
    </div>
  </div>
);

const Subscription = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('Chuyên Nghiệp');

  const plans = [
    { name: 'Cơ bản', price: 'Miễn phí', features: ['50 video/tháng', 'HD 720p'] },
    { name: 'Chuyên Nghiệp', price: '199.000đ', features: ['500 video/tháng', 'Full HD 1080p'] },
    { name: 'Doanh nghiệp', price: '499.000đ', features: ['Không giới hạn', '4K Ultra HD'] },
  ];

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Quản lý gói đăng ký</h3>
          <p className="text-slate-500 mt-1">Gói hiện tại: <span className="font-bold text-brand">{currentPlan}</span></p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand/20"
        >
          Đổi gói dịch vụ
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CreditCard size={20} className="text-brand" />
            Thông tin thanh toán
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-500">Chu kỳ thanh toán</span>
              <span className="font-bold text-slate-900">Hàng tháng</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-slate-500">Ngày hết hạn</span>
              <span className="font-bold text-slate-900">25/04/2024</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Phương thức</span>
              <span className="font-bold text-slate-900">Visa **** 4242</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-brand" />
            Lịch sử giao dịch
          </h4>
          <div className="space-y-3">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold text-slate-900">Hóa đơn #INV-00{i}</p>
                  <p className="text-slate-500 text-xs">15/0{i}/2024</p>
                </div>
                <span className="font-bold text-slate-900">199.000đ</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Chọn gói dịch vụ">
        <div className="space-y-4">
          {plans.map((plan) => (
            <button
              key={plan.name}
              onClick={() => {
                setCurrentPlan(plan.name);
                setIsModalOpen(false);
              }}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                currentPlan === plan.name ? 'border-brand bg-brand/5' : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-900">{plan.name}</span>
                <span className="text-brand font-bold">{plan.price}</span>
              </div>
              <p className="text-xs text-slate-500">{plan.features.join(' • ')}</p>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
};

const Stores = ({ stores, onAdd, onDelete }: { stores: StoreData[], onAdd: (s: Omit<StoreData, 'id' | 'videos'>) => void, onDelete: (id: string) => void }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStore, setNewStore] = useState({ name: '' });

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold text-slate-900">Danh sách cửa hàng</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand/20"
        >
          <Plus size={20} />
          Thêm cửa hàng
        </button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <div key={store.id} className="p-6 rounded-2xl border border-slate-100 hover:border-brand/30 transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                <Store className="text-slate-400 group-hover:text-brand" />
              </div>
              <button 
                onClick={() => onDelete(store.id)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">{store.name}</h4>
            <div className="flex items-center gap-2 text-xs font-bold text-brand">
              <Video size={14} />
              {store.videos} Video đã lưu
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Thêm cửa hàng mới">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tên cửa hàng</label>
            <input 
              type="text" 
              value={newStore.name}
              onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-brand"
              placeholder="Nhập tên shop..."
            />
          </div>
          <button 
            onClick={() => {
              onAdd(newStore as Omit<StoreData, 'id' | 'videos'>);
              setNewStore({ name: '' });
              setIsModalOpen(false);
            }}
            className="w-full py-3.5 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20"
          >
            Lưu cửa hàng
          </button>
        </div>
      </Modal>
    </div>
  );
};

const Videos = ({ videos, onDelete }: { videos: VideoData[], onDelete: (id: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewVideo, setPreviewVideo] = useState<VideoData | null>(null);
  const itemsPerPage = 5;

  const filteredVideos = useMemo(() => {
    return videos.filter(v => v.orderId.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [videos, searchTerm]);

  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
  const currentVideos = filteredVideos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h3 className="text-2xl font-bold text-slate-900">Quản lý Video</h3>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Tìm mã đơn hàng..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-brand transition-all"
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider">Video</th>
              <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider">Mã đơn hàng</th>
              <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider">Cửa hàng</th>
              <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider">Thời gian</th>
              <th className="pb-4 font-bold text-slate-400 text-sm uppercase tracking-wider">Dung lượng</th>
              <th className="pb-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {currentVideos.map((video) => (
              <tr key={video.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="py-4">
                  <div className="w-20 h-12 bg-slate-200 rounded-lg overflow-hidden relative group/thumb">
                    <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setPreviewVideo(video)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
                <td className="py-4 font-bold text-slate-900">{video.orderId}</td>
                <td className="py-4 text-slate-600">{video.store}</td>
                <td className="py-4 text-slate-500 text-sm">{video.time}</td>
                <td className="py-4 text-slate-500 text-sm">{video.size}</td>
                <td className="py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setPreviewVideo(video)}
                      className="p-2 text-slate-400 hover:text-brand transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => onDelete(video.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-4">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-bold text-slate-600">Trang {currentPage} / {totalPages}</span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      <Modal isOpen={!!previewVideo} onClose={() => setPreviewVideo(null)} title={`Xem trước: ${previewVideo?.orderId}`}>
        <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden mb-6">
          <img src={previewVideo?.thumbnail} alt="" className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30">
              <Clock size={32} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-xl bg-slate-50">
            <p className="text-slate-500 mb-1">Cửa hàng</p>
            <p className="font-bold text-slate-900">{previewVideo?.store}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50">
            <p className="text-slate-500 mb-1">Thời gian</p>
            <p className="font-bold text-slate-900">{previewVideo?.time}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const UserManagement = ({ users, onAdd, onEdit, onDelete }: { users: UserData[], onAdd: (u: Omit<UserData, 'id' | 'status'>) => void, onEdit: (u: UserData) => void, onDelete: (id: string) => void }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({ name: '', role: '', email: '' });

  const handleOpenModal = (user?: UserData) => {
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, role: user.role, email: user.email });
    } else {
      setEditingUser(null);
      setFormData({ name: '', role: '', email: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingUser) {
      onEdit({ ...editingUser, ...formData });
    } else {
      onAdd(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold text-slate-900">Quản lý nhân viên</h3>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand/20"
        >
          <Plus size={20} />
          Thêm nhân viên
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-6 rounded-2xl border border-slate-100 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center font-bold text-lg">
                {user.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{user.name}</h4>
                <p className="text-slate-500 text-xs">{user.role} • {user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${user.status === 'Online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <button 
                onClick={() => handleOpenModal(user)}
                className="p-2 text-slate-400 hover:text-brand transition-colors"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => onDelete(user.id)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Sửa thông tin nhân viên' : 'Thêm nhân viên mới'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và tên</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-brand"
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Vai trò</label>
            <select 
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-brand bg-white"
            >
              <option value="">Chọn vai trò...</option>
              <option value="Quản lý kho">Quản lý kho</option>
              <option value="Nhân viên đóng gói">Nhân viên đóng gói</option>
              <option value="Kế toán">Kế toán</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-brand"
              placeholder="email@company.com"
            />
          </div>
          <button 
            onClick={handleSubmit}
            className="w-full py-3.5 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20"
          >
            {editingUser ? 'Cập nhật' : 'Thêm nhân viên'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default function CMS() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // State Management
  const [stores, setStores] = useState<StoreData[]>([
    { id: '1', name: 'Shop Mẹ Bé', videos: 450 },
    { id: '2', name: 'Gia Dụng Thông Minh', videos: 120 },
    { id: '3', name: 'Thời Trang Nam', videos: 85 },
  ]);

  const [videos, setVideos] = useState<VideoData[]>([
    { id: '1', orderId: '#DH99231', store: 'Shop Mẹ Bé', time: '20/03/2024 14:20', size: '15.4 MB', thumbnail: 'https://picsum.photos/seed/vlist1/120/80' },
    { id: '2', orderId: '#DH99232', store: 'Shop Mẹ Bé', time: '20/03/2024 14:25', size: '12.1 MB', thumbnail: 'https://picsum.photos/seed/vlist2/120/80' },
    { id: '3', orderId: '#DH99233', store: 'Gia Dụng Thông Minh', time: '20/03/2024 15:10', size: '18.2 MB', thumbnail: 'https://picsum.photos/seed/vlist3/120/80' },
    { id: '4', orderId: '#DH99234', store: 'Thời Trang Nam', time: '20/03/2024 16:05', size: '14.8 MB', thumbnail: 'https://picsum.photos/seed/vlist4/120/80' },
    { id: '5', orderId: '#DH99235', store: 'Shop Mẹ Bé', time: '20/03/2024 16:30', size: '16.1 MB', thumbnail: 'https://picsum.photos/seed/vlist5/120/80' },
    { id: '6', orderId: '#DH99236', store: 'Shop Mẹ Bé', time: '20/03/2024 16:45', size: '11.4 MB', thumbnail: 'https://picsum.photos/seed/vlist6/120/80' },
    { id: '7', orderId: '#DH99237', store: 'Gia Dụng Thông Minh', time: '20/03/2024 17:00', size: '13.9 MB', thumbnail: 'https://picsum.photos/seed/vlist7/120/80' },
  ]);

  const [users, setUsers] = useState<UserData[]>([
    { id: '1', name: 'Nguyễn Văn An', role: 'Quản lý kho', email: 'an.nv@gmail.com', status: 'Online' },
    { id: '2', name: 'Trần Thị Bình', role: 'Nhân viên đóng gói', email: 'binh.tt@gmail.com', status: 'Offline' },
    { id: '3', name: 'Lê Văn Cường', role: 'Nhân viên đóng gói', email: 'cuong.lv@gmail.com', status: 'Online' },
  ]);

  // Handlers
  const handleAddStore = (s: Omit<StoreData, 'id' | 'videos'>) => {
    setStores([...stores, { ...s, id: Date.now().toString(), videos: 0 }]);
  };
  const handleDeleteStore = (id: string) => {
    setStores(stores.filter(s => s.id !== id));
  };

  const handleDeleteVideo = (id: string) => {
    setVideos(videos.filter(v => v.id !== id));
  };

  const handleAddUser = (u: Omit<UserData, 'id' | 'status'>) => {
    setUsers([...users, { ...u, id: Date.now().toString(), status: 'Offline' }]);
  };
  const handleEditUser = (u: UserData) => {
    setUsers(users.map(user => user.id === u.id ? u : user));
  };
  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const stats = {
    totalVideos: videos.length.toLocaleString(),
    totalStores: stores.length.toString(),
    totalUsers: users.length.toString()
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats} />;
      case 'subscription': return <Subscription />;
      case 'stores': return <Stores stores={stores} onAdd={handleAddStore} onDelete={handleDeleteStore} />;
      case 'videos': return <Videos videos={videos} onDelete={handleDeleteVideo} />;
      case 'users': return <UserManagement users={users} onAdd={handleAddUser} onEdit={handleEditUser} onDelete={handleDeleteUser} />;
      default: return <Dashboard stats={stats} />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col fixed h-full z-20">
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <Video className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-display font-bold tracking-tight text-slate-900">
            LabBox<span className="text-brand">™</span>
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Package} 
            label="Gói đăng ký" 
            active={activeTab === 'subscription'} 
            onClick={() => setActiveTab('subscription')} 
          />
          <SidebarItem 
            icon={Store} 
            label="Cửa hàng" 
            active={activeTab === 'stores'} 
            onClick={() => setActiveTab('stores')} 
          />
          <SidebarItem 
            icon={Video} 
            label="Quản lý Video" 
            active={activeTab === 'videos'} 
            onClick={() => setActiveTab('videos')} 
          />
          <SidebarItem 
            icon={Users} 
            label="Nhân viên" 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
          />
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-semibold text-sm"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-10">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-display font-bold text-slate-900">
              {activeTab === 'dashboard' ? 'Tổng quan' : 
               activeTab === 'subscription' ? 'Gói dịch vụ' :
               activeTab === 'stores' ? 'Cửa hàng' :
               activeTab === 'videos' ? 'Video' : 'Nhân viên'}
            </h2>
            <p className="text-slate-500">Chào mừng trở lại, Shop Mẹ Bé!</p>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">Shop Mẹ Bé</p>
                <p className="text-xs text-slate-500">Admin</p>
              </div>
              <div className="w-10 h-10 bg-brand text-white rounded-xl flex items-center justify-center font-bold">
                M
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </main>
    </div>
  );
}
