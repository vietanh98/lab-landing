import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, CheckCircle2, ChevronRight } from 'lucide-react';

interface SubscriptionPlan {
  id: number;
  name: string;
  max_stores: number;
  max_storage_gb: number;
  max_devices: number;
  price: number;
  created_at: string;
}

interface SubscriptionManagementProps {
  showUpgrade: boolean;
  setShowUpgrade: (show: boolean) => void;
  onPay: (plan: SubscriptionPlan) => void;
  pricingPlans?: any[];
  currentSubscriptions?: Array<{
    subscription_id: number;
    plan_id: number;
    plan_name: string;
    max_stores: number;
    max_storage_gb: number;
    max_devices: number;
    price: number;
    status: string;
  }>;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ showUpgrade, setShowUpgrade, onPay, pricingPlans: initialPlans, currentSubscriptions }) => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const endpoint = `${apiBase}/api/v1/subcription?page=1&per_page=10`;
        const token = localStorage.getItem('token');

        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();

        const res = await fetch(endpoint, { headers });
        const data = await res.json();

        const ok = res.ok && (data?.status === true || data?.status_code === 0);
        if (ok && data?.data?.data) {
          // Sắp xếp theo giá tăng dần
          const sorted = data.data.data.sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.price - b.price);
          setSubscriptions(sorted);
        } else {
          setError(data?.message || 'Không thể lấy danh sách gói');
          // Fallback to initial plans if provided
          if (initialPlans) setSubscriptions(initialPlans);
        }
      } catch (err) {
        setError('Không thể kết nối đến máy chủ');
        if (initialPlans) setSubscriptions(initialPlans);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [initialPlans]);

  return (
    <div className="w-full h-screen bg-slate-50 p-8 overflow-y-auto">
      {!showUpgrade ? (
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div>
                <p className="text-brand font-bold text-sm uppercase tracking-widest mb-2">Gói hiện tại</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-display font-bold">
                    {currentSubscriptions && currentSubscriptions.length ? currentSubscriptions[0].plan_name : 'Chưa có gói'}
                  </h2>
                  {currentSubscriptions && currentSubscriptions.length ? (
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${currentSubscriptions[0].status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/80'}`}>
                      {currentSubscriptions[0].status}
                    </span>
                  ) : null}
                </div>
                {currentSubscriptions && currentSubscriptions.length ? (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold">
                      {(currentSubscriptions[0].price).toLocaleString('vi-VN')}đ/tháng
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold">
                      {currentSubscriptions[0].max_stores} cửa hàng
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold">
                      {currentSubscriptions[0].max_storage_gb} GB
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold">
                      {currentSubscriptions[0].max_devices} thiết bị
                    </span>
                  </div>
                ) : (
                  <p className="text-white/70 text-sm">Bạn chưa đăng ký gói nào</p>
                )}
              </div>
              <button 
                onClick={() => setShowUpgrade(true)}
                className="px-8 py-4 bg-brand hover:bg-brand-dark text-white font-bold rounded-2xl transition-all shadow-xl shadow-brand/20 active:scale-95"
              >
                Nâng cấp gói ngay
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
            <h3 className="font-bold text-slate-900 mb-6">Lịch sử thanh toán</h3>
            <div className="space-y-4">
              {[
                { date: '01/02/2024', amount: '199.000đ', status: 'Thành công' },
                { date: '01/01/2024', amount: '199.000đ', status: 'Thành công' },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Thanh toán gói tháng {p.date.split('/')[1]}</p>
                      <p className="text-xs text-slate-500">{p.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{p.amount}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{p.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <button 
            onClick={() => setShowUpgrade(false)}
            className="flex items-center gap-2 text-slate-500 hover:text-brand font-bold transition-colors"
          >
            <ChevronRight className="rotate-180" size={20} />
            Quay lại
          </button>
          
          <div className="grid grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-3 py-12 text-center text-slate-500">Đang tải các gói...</div>
            ) : error ? (
              <div className="col-span-3 py-12 text-center text-rose-600">Lỗi: {error}</div>
            ) : subscriptions.length === 0 ? (
              <div className="col-span-3 py-12 text-center text-slate-500">Không có gói nào</div>
            ) : (
              subscriptions.map((plan) => (
                <div key={plan.id} className="p-8 rounded-[2.5rem] border border-slate-200 bg-white flex flex-col transition-all hover:border-brand hover:shadow-lg">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-display font-bold text-slate-900">{(plan.price).toLocaleString('vi-VN')}đ</span>
                    <span className="text-slate-500 text-xs">/tháng</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">Created: {new Date(plan.created_at).toLocaleDateString('vi-VN')}</p>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-sm text-slate-600">
                      <CheckCircle2 size={16} className="text-brand" />
                      {plan.max_stores} cửa hàng
                    </li>
                    <li className="flex items-center gap-3 text-sm text-slate-600">
                      <CheckCircle2 size={16} className="text-brand" />
                      {plan.max_storage_gb} GB lưu trữ
                    </li>
                    <li className="flex items-center gap-3 text-sm text-slate-600">
                      <CheckCircle2 size={16} className="text-brand" />
                      {plan.max_devices} thiết bị
                    </li>
                  </ul>
                  <button 
                    onClick={() => setSelectedPlan(plan)}
                    className="w-full py-4 rounded-2xl font-bold transition-all bg-brand text-white hover:bg-brand-dark"
                  >
                    Chọn gói
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlan(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-8 md:p-12"
            >
              {showSuccess ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-center mb-6">
                    <p className="text-2xl font-display font-bold text-brand mb-2">Cảm ơn bạn đã thanh toán!</p>
                    <p className="text-slate-600">Chúng tôi sẽ cập nhật gói dịch vụ sớm nhất.</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSuccess(false);
                      setSelectedPlan(null);
                    }}
                    className="mt-6 px-8 py-3 rounded-xl bg-brand text-white font-bold hover:bg-brand-dark transition-colors"
                  >Đóng</button>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-display font-bold text-slate-900 mb-2 text-center">
                    Xác nhận thanh toán
                  </h2>
                  <p className="text-slate-500 text-center mb-10">
                    Bạn đang chọn gói <strong>{selectedPlan.name}</strong>
                  </p>

                  <div className="grid md:grid-cols-2 gap-8 mb-10">
                    {/* Payment Info */}
                    <div className="space-y-6">
                      <div className="p-6 bg-slate-50 rounded-2xl">
                        <p className="text-sm text-slate-500 mb-2">Gói đã chọn</p>
                        <p className="text-2xl font-bold text-slate-900">{selectedPlan.name}</p>
                      </div>

                      <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200">
                        <p className="text-sm text-slate-500 mb-2">Giá thanh toán</p>
                        <p className="text-3xl font-display font-bold text-emerald-600">{(selectedPlan.price).toLocaleString('vi-VN')}đ</p>
                        <p className="text-xs text-slate-500 mt-1">mỗi tháng</p>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-100 rounded-xl text-center">
                          <p className="text-2xl font-bold text-slate-900">{selectedPlan.max_stores}</p>
                          <p className="text-xs text-slate-500 mt-1">Cửa hàng</p>
                        </div>
                        <div className="p-4 bg-slate-100 rounded-xl text-center">
                          <p className="text-2xl font-bold text-slate-900">{selectedPlan.max_storage_gb}</p>
                          <p className="text-xs text-slate-500 mt-1">GB</p>
                        </div>
                        <div className="p-4 bg-slate-100 rounded-xl text-center">
                          <p className="text-2xl font-bold text-slate-900">{selectedPlan.max_devices}</p>
                          <p className="text-xs text-slate-500 mt-1">Thiết bị</p>
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <div className="w-48 h-48 bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-4">
                        <svg className="w-32 h-32 text-slate-300" fill="currentColor" viewBox="0 0 100 100">
                          <rect x="10" y="10" width="30" height="30" fill="currentColor" />
                          <rect x="60" y="10" width="30" height="30" fill="currentColor" />
                          <rect x="10" y="60" width="30" height="30" fill="currentColor" />
                          <rect x="20" y="20" width="10" height="10" fill="white" />
                          <rect x="70" y="20" width="10" height="10" fill="white" />
                          <rect x="20" y="70" width="10" height="10" fill="white" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-600 text-center">
                        Quét mã QR để thanh toán
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedPlan(null)}
                      className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => {
                        setShowSuccess(true);
                        onPay(selectedPlan);
                      }}
                      className="flex-1 py-3 font-bold text-white bg-brand rounded-xl hover:bg-brand-dark transition-all shadow-lg shadow-brand/20"
                    >
                      Xác nhận thanh toán
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionManagement;
