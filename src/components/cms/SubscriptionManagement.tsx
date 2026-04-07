import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, CheckCircle2, ChevronRight, X, AlertCircle } from 'lucide-react';

interface SubscriptionPlan {
  id: number;
  name: string;
  max_stores: number;
  max_storage_gb: number;
  max_devices: number;
  price: number;
  created_at: string;
  is_visible: boolean;
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
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timeLeftRef = useRef(0);
  const [toastError, setToastError] = useState<string | null>(null);
  const [initLoadingId, setInitLoadingId] = useState<number | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const handleCancelPayment = async () => {
    if (orderId) {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/payment/cancel`;
        const token = localStorage.getItem('token');

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({ order_id: orderId })
        });
      } catch (err) {
        console.error('Lỗi khi hủy thanh toán:', err);
      }
    }
    setSelectedPlan(null);
    setOrderId(null);
    setQrUrl(null);
    setTimeLeft(0);
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    setToastError(null);
    setInitLoadingId(plan.id);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const endpoint = `${apiBase}/api/v1/payment/init`;
      const token = localStorage.getItem('token');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ plan_id: plan.id })
      });
      const data = await res.json();

      if (res.ok && data?.status === true && data?.data?.qr_url) {
        setSelectedPlan(plan);
        setQrUrl(data.data.qr_url);
        setOrderId(data.data.order_id);
        timeLeftRef.current = 15 * 60;
        setTimeLeft(15 * 60);
      } else {
        setToastError(data?.message || 'Không thể tạo mã thanh toán');
      }
    } catch (err) {
      setToastError('Lỗi kết nối khi tạo mã thanh toán');
    } finally {
      setInitLoadingId(null);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (orderId && !showSuccess) {
      interval = setInterval(async () => {
        if (timeLeftRef.current <= 0) {
          setOrderId(null);
          setToastError('Mã QR đã hết hạn. Vui lòng chọn lại gói.');
          setSelectedPlan(null);
          setQrUrl(null);
          clearInterval(interval);
          return;
        }

        timeLeftRef.current -= 1;
        setTimeLeft(timeLeftRef.current);

        try {
          const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
          const endpoint = `${apiBase}/api/v1/payment/status/${orderId}`;
          const token = localStorage.getItem('token');
          const headers: Record<string, string> = { 'Accept': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await fetch(endpoint, { headers });
          const data = await res.json().catch(() => ({}));

          if (res.ok && data?.status === true) {
            const statusStr = String(data?.data?.status || data?.data?.payment_status || data?.data?.state || '').toUpperCase();
            if (statusStr === 'PAID' || statusStr === 'SUCCESS' || statusStr === 'COMPLETED' || data?.data?.is_paid === true) {
              setShowSuccess(true);
              if (selectedPlan) onPay(selectedPlan);
              setOrderId(null);
              clearInterval(interval);
            }
          }
        } catch (e) {
          // Ignore network errors during polling
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [orderId, showSuccess, selectedPlan, onPay]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const endpoint = `${apiBase}/api/v1/subcription?page=1&per_page=50`;
        const token = localStorage.getItem('token');

        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();

        const res = await fetch(endpoint, { headers });
        const data = await res.json();

        const ok = res.ok && (data?.status === true || data?.status_code === 0);
        if (ok && data?.data?.data) {
          // Sắp xếp theo giá tăng dần và lọc các gói ẩn (phải có is_visible === true)
          const sorted = data.data.data
            .filter((p: any) => p.is_visible === true)
            .sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.price - b.price);
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

  useEffect(() => {
    // Chỉ fetch lịch sử thanh toán trên màn hình chính
    if (!showUpgrade) {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        setHistoryError(null);
        try {
          const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
          const endpoint = `${apiBase}/api/v1/payment/history?page=${historyPage}&per_page=10`;
          const token = localStorage.getItem('token');
          const headers: Record<string, string> = { 'Accept': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await fetch(endpoint, { headers });
          const data = await res.json();

          if (res.ok && (data?.status === true || data?.status_code === 0)) {
            const listObj = data?.data; // { data: [...], current_page, last_page, per_page, total }
            const items = Array.isArray(listObj?.data) ? listObj.data : [];
            setPaymentHistory(items);

            // Set pagination logic
            if (listObj?.last_page) {
              setHistoryTotalPages(listObj.last_page);
            } else if (listObj?.total && listObj?.per_page) {
              setHistoryTotalPages(Math.ceil(listObj.total / listObj.per_page));
            } else {
              setHistoryTotalPages(items.length === 10 ? historyPage + 1 : historyPage);
            }
          } else {
            setHistoryError(data?.message || 'Không thể lấy lịch sử thanh toán');
          }
        } catch (err) {
          setHistoryError('Lỗi kết nối máy chủ lấy lịch sử thanh toán');
        } finally {
          setLoadingHistory(false);
        }
      };

      fetchHistory();
    }
  }, [showUpgrade, showSuccess, historyPage]);

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      <AnimatePresence>
        {toastError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 bg-rose-50 text-rose-600 border border-rose-200 px-4 py-3 rounded-xl text-sm font-bold shadow-lg z-[300] flex items-center gap-3 w-max max-w-[90%]"
          >
            <AlertCircle size={18} />
            <span>{toastError}</span>
            <button onClick={() => setToastError(null)} className="ml-2 hover:bg-rose-100 rounded-lg p-1 transition-colors"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {!showUpgrade ? (
        <div className="flex flex-col h-full gap-6 overflow-hidden">
          <div className="bg-slate-900 flex-shrink-0 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
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
                  <p className="text-white/60 text-sm">Bạn chưa đăng ký gói nào</p>
                )}
              </div>
              <button
                onClick={() => setShowUpgrade(true)}
                className="px-8 py-3.5 bg-brand hover:bg-brand-dark text-white font-bold rounded-2xl transition-all shadow-xl shadow-brand/20 active:scale-95"
              >
                Nâng cấp gói ngay
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col flex-1 min-h-0">
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-6 flex-shrink-0">Lịch sử thanh toán</h3>
            <div className={`space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar ${paymentHistory.length === 0 ? 'flex flex-col justify-center' : ''}`}>
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                  <div className="w-8 h-8 border-4 border-slate-100 border-t-brand rounded-full animate-spin"></div>
                  <span className="text-sm font-bold">Đang tải lịch sử thanh toán...</span>
                </div>
              ) : historyError ? (
                <div className="flex flex-col items-center justify-center h-full text-rose-500 gap-2">
                  <span className="text-sm font-bold">{historyError}</span>
                  <button onClick={() => setHistoryPage(1)} className="text-xs bg-rose-50 px-4 py-2 rounded-lg font-bold">Thử lại</button>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                  <span className="text-sm font-bold">Chưa có giao dịch nào</span>
                </div>
              ) : (
                paymentHistory.map((p, i) => {
                  const statusStr = String(p.Status || p.status || p.state || '').toUpperCase();
                  const isSuccess = statusStr === 'SUCCESS' || statusStr === 'PAID' || p.is_paid === true || statusStr === 'COMPLETED';
                  const isPending = statusStr === 'PENDING';

                  return (
                    <div key={p.ID || p.OrderID || p.order_id || i} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4 w-2/3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isSuccess ? 'bg-emerald-50 text-emerald-500' : isPending ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'}`}>
                          <CreditCard size={22} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {p.Description || p.Description || p.OrderID || p.order_id || 'Thanh toán gói dịch vụ'}
                          </p>
                          <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
                            {new Date(p.CreatedAt || p.created_at || p.payment_time || Date.now()).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-base font-bold text-slate-900">{Number(p.Amount || p.amount || 0).toLocaleString('vi-VN')}đ</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isSuccess ? 'text-emerald-600' :
                          isPending ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                          {isSuccess ? 'THÀNH CÔNG' : isPending ? 'CHỜ THANH TOÁN' : 'THẤT BẠI'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {historyTotalPages > 1 && (
              <div className="flex flex-shrink-0 items-center justify-between pt-6 mt-4 border-t border-slate-100">
                <button
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  disabled={historyPage === 1 || loadingHistory}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Trang trước
                </button>
                <div className="text-sm text-slate-500 font-medium">
                  Trang <span className="font-bold text-slate-800">{historyPage}</span> / {historyTotalPages}
                </div>
                <button
                  onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                  disabled={historyPage === historyTotalPages || loadingHistory}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-y-auto pb-10 space-y-6 md:space-y-8 custom-scrollbar pr-4">
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
              subscriptions.map((plan) => {
                const isCurrentPlan = currentSubscriptions?.some(sub => sub.plan_id === plan.id && sub.status === 'active');
                return (
                  <div key={plan.id} className={`p-8 rounded-[2.5rem] border flex flex-col transition-all relative overflow-hidden ${isCurrentPlan ? 'border-brand/30 bg-brand/5 shadow-md' : 'border-slate-200 bg-white hover:border-brand hover:shadow-lg'}`}>
                    {isCurrentPlan && (
                      <div className="absolute top-0 right-0 bg-brand text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                        Đang sử dụng
                      </div>
                    )}
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
                      onClick={() => handleSelectPlan(plan)}
                      disabled={initLoadingId === plan.id || isCurrentPlan}
                      className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
                        isCurrentPlan 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 opacity-100 disabled:opacity-100'
                          : 'bg-brand text-white hover:bg-brand-dark disabled:opacity-70'
                      }`}
                    >
                      {initLoadingId === plan.id ? (
                        <>
                          <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isCurrentPlan ? 'border-emerald-600/30 border-t-emerald-600' : 'border-white/30 border-t-white'}`}></div>
                          Đang tạo mã...
                        </>
                      ) : isCurrentPlan ? (
                        <>
                          <CheckCircle2 size={18} />
                          Đang sử dụng
                        </>
                      ) : 'Chọn gói'}
                    </button>
                  </div>
                );
              })
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
              onClick={handleCancelPayment}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[800px] bg-white rounded-[2rem] shadow-2xl p-8 md:p-10"
            >

              {showSuccess ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <div className="text-center mb-8">
                    <p className="text-2xl font-bold text-slate-800 mb-2">Thanh toán thành công!</p>
                    <p className="text-slate-500">Gói dịch vụ của bạn đã được cập nhật.</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSuccess(false);
                      setSelectedPlan(null);
                    }}
                    className="px-10 py-3.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
                  >Đóng</button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Xác nhận thanh toán</h2>
                    <p className="text-sm text-slate-500">
                      Bạn đang chọn gói <span className="font-bold text-slate-700">{selectedPlan.name}</span>
                    </p>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 mb-8">
                    {/* Left Column - Plan Details */}
                    <div className="flex-1 flex flex-col gap-4">
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100/60 transition-all hover:bg-slate-100">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Gói đã chọn</p>
                        <p className="text-xl font-bold text-slate-800 tracking-tight">{selectedPlan.name}</p>
                      </div>

                      <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 transition-all hover:bg-emerald-50">
                        <p className="text-xs text-emerald-600/80 font-bold uppercase tracking-wider mb-2">Giá thanh toán</p>
                        <p className="text-3xl font-bold text-emerald-600 tracking-tight mb-1">{(selectedPlan.price).toLocaleString('vi-VN')}đ</p>
                        <p className="text-[11px] text-emerald-600/60 font-medium">mỗi tháng</p>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100 flex flex-col justify-center transition-all hover:bg-slate-100">
                          <p className="text-xl font-bold text-slate-800 mb-1">{selectedPlan.max_stores}</p>
                          <p className="text-[10px] text-slate-500 font-bold">Cửa hàng</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100 flex flex-col justify-center transition-all hover:bg-slate-100">
                          <p className="text-xl font-bold text-slate-800 mb-1">{selectedPlan.max_storage_gb}</p>
                          <p className="text-[10px] text-slate-500 font-bold">GB</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100 flex flex-col justify-center transition-all hover:bg-slate-100">
                          <p className="text-xl font-bold text-slate-800 mb-1">{selectedPlan.max_devices}</p>
                          <p className="text-[10px] text-slate-500 font-bold">Thiết bị</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - QR Code */}
                    <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-3xl relative min-h-[300px]">
                      {timeLeft > 0 && !showSuccess && qrUrl && (
                        <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-lg flex items-center gap-2 z-10">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs font-bold text-white font-mono tracking-wider">{formatTime(timeLeft)}</span>
                        </div>
                      )}

                      <div className="w-56 h-56 bg-white rounded-2xl flex items-center justify-center mb-5 relative">
                        {qrUrl ? (
                          <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply transition-opacity duration-300" />
                        ) : (
                          <div className="w-full h-full bg-slate-50 flex items-center justify-center opacity-50">
                            <svg className="w-24 h-24 text-slate-300" fill="currentColor" viewBox="0 0 100 100">
                              <rect x="10" y="10" width="30" height="30" fill="currentColor" />
                              <rect x="60" y="10" width="30" height="30" fill="currentColor" />
                              <rect x="10" y="60" width="30" height="30" fill="currentColor" />
                              <rect x="20" y="20" width="10" height="10" fill="white" />
                              <rect x="70" y="20" width="10" height="10" fill="white" />
                              <rect x="20" y="70" width="10" height="10" fill="white" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-500 text-center px-4">
                        Quét mã QR bằng ứng dụng ngân hàng để thanh toán tự động
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 p-1">
                    <button
                      onClick={handleCancelPayment}
                      className="px-6 py-3.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors min-w-[140px]"
                    >
                      Hủy thao tác
                    </button>
                    <button
                      onClick={() => {
                        setShowSuccess(true);
                        onPay(selectedPlan);
                      }}
                      className="flex-1 py-3.5 font-bold text-white bg-brand hover:bg-brand-dark rounded-xl transition-all shadow-lg shadow-brand/20 active:scale-95"
                    >
                      Tôi đã thanh toán
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
