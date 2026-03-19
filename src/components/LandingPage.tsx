import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Video,
  Shield,
  Zap,
  CheckCircle2,
  Play,
  ChevronRight,
  Star,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
  X,
  Menu
} from 'lucide-react';

// Re-import AuthModal or define it here. Since it was in App.tsx, I'll move it here.
declare var grecaptcha: any;

const AuthModal = ({ isOpen, mode, onClose }: { isOpen: boolean, mode: 'login' | 'register', onClose: () => void }) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    otp: '',
    password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);
  const [resendUntil, setResendUntil] = useState<number | null>(null);
  const [resendSecondsLeft, setResendSecondsLeft] = useState<number>(0);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setCurrentMode(mode);
    setErrors({});
    setStatusMsg(null);
    setIsLoading(false);
    setRegisterStep(1);
    setResendUntil(null);
    setResendSecondsLeft(0);
    setIsOtpVerified(false);
    setFormData(prev => ({ ...prev, otp: '' }));
  }, [isOpen, mode]);

  React.useEffect(() => {
    if (!resendUntil) return;
    const tick = () => {
      const s = Math.max(0, Math.ceil((resendUntil - Date.now()) / 1000));
      setResendSecondsLeft(s);
      if (s === 0) setResendUntil(null);
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [resendUntil]);

  if (!isOpen) return null;

  const clearFieldError = (name: string) => {
    if (!errors[name]) return;
    setErrors(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const phoneRegex = /^(?:\+?84|0)(3|5|7|8|9)\d{8}$/;
  const normalizePhone = (raw: string) => {
    const p = String(raw || '').trim().replace(/\s+/g, '');
    if (!p) return p;
    if (p.startsWith('+84')) return p;
    if (p.startsWith('+')) return p;
    if (p.startsWith('84')) return `+${p}`;
    if (p.startsWith('0')) return `+84${p.slice(1)}`;
    return p;
  };

  const getApiBase = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const isApiOk = (res: Response, data: any) =>
    res.ok && (data?.status === true || data?.status_code === 0 || data?.success === true);

  const validateLogin = () => {
    const next: Record<string, string> = {};
    if (!formData.username) next.username = 'Vui lòng nhập tên đăng nhập';
    if (!formData.password) next.password = 'Vui lòng nhập mật khẩu';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateRegisterStep1 = () => {
    const next: Record<string, string> = {};
    const normalized = normalizePhone(formData.phone);
    if (!normalized || !phoneRegex.test(normalized)) next.phone = 'Số điện thoại không hợp lệ (VD: +84901234567)';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateRegisterStep2 = () => {
    const next: Record<string, string> = {};
    if (!formData.otp) next.otp = 'Vui lòng nhập mã OTP';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateRegisterStep3 = () => {
    const next: Record<string, string> = {};
    if (!formData.username) next.username = 'Vui lòng nhập tên đăng nhập';
    else if (formData.username.length < 3) next.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    if (!formData.full_name) next.full_name = 'Vui lòng nhập họ và tên hoặc tên shop';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) next.email = 'Email không hợp lệ';
    if (!formData.password || formData.password.length < 6) next.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (formData.password !== formData.confirm_password) next.confirm_password = 'Mật khẩu xác nhận không khớp';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const sendOtp = async () => {
    setStatusMsg(null);
    if (!validateRegisterStep1()) return;
    setIsOtpVerified(false);
    setIsLoading(true);
    try {
      const apiBase = getApiBase();
      const phone = normalizePhone(formData.phone);
      setFormData(prev => ({ ...prev, phone }));

      // Get reCAPTCHA token
      const recaptchaToken = await new Promise<string>((resolve, reject) => {
        if (typeof grecaptcha === 'undefined') {
          reject(new Error('Hệ thống bảo vệ reCAPTCHA chưa sẵn sàng. Vui lòng tải lại trang.'));
          return;
        }
        grecaptcha.ready(() => {
          grecaptcha.execute('6LdVy48sAAAAAARFNw8u9EELmrV_liJTcD-Cr-uY', { action: 'send_otp' })
            .then((token: string) => resolve(token))
            .catch(reject);
        });
      });

      const res = await fetch(`${apiBase}/api/v1/auth/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
        },
        body: JSON.stringify({ phone, token: recaptchaToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!isApiOk(res, data)) {
        setStatusMsg({ type: 'error', text: data?.message || 'Gửi OTP không thành công. Vui lòng thử lại.' });
        return;
      }
      setResendUntil(Date.now() + 30 * 1000);
      setStatusMsg({ type: 'success', text: 'Đã gửi mã OTP thành công.' });
      setRegisterStep(2);
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e?.message || 'Gửi OTP không thành công. Vui lòng thử lại.' });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    setStatusMsg(null);
    if (!validateRegisterStep2()) return;
    setIsLoading(true);
    try {
      const apiBase = getApiBase();
      const phone = normalizePhone(formData.phone);
      setFormData(prev => ({ ...prev, phone }));

      const res = await fetch(`${apiBase}/api/v1/auth/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
        },
        body: JSON.stringify({ phone, code: formData.otp.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!isApiOk(res, data)) {
        setErrors({ otp: data?.message || 'Mã OTP không đúng' });
        return;
      }
      setStatusMsg({ type: 'success', text: 'Xác nhận mã OTP thành công.' });
      setIsOtpVerified(true);
      setRegisterStep(3);
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e?.message || 'Không thể xác nhận OTP. Vui lòng thử lại.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (currentMode === 'login') {
      if (!validateLogin()) return;
    } else {
      if (registerStep !== 3) return;
      if (!isOtpVerified) {
        setRegisterStep(2);
        setErrors({ otp: 'Vui lòng xác nhận OTP trước' });
        return;
      }
      if (!validateRegisterStep3()) return;
    }

    setIsLoading(true);

    try {
      const apiBase = getApiBase();
      const endpoint = currentMode === 'login'
        ? `${apiBase}/api/v1/auth/login`
        : `${apiBase}/api/v1/auth/register`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*'
        },
        body: JSON.stringify(
          currentMode === 'login'
            ? { username: formData.username, password: formData.password }
            : (() => {
              const phone = normalizePhone(formData.phone);
              const { otp, ...rest } = formData;
              return { ...rest, phone };
            })()
        )
      });

      const data = await response.json();
      const apiSuccess = response.ok && (data?.status === true || data?.status_code === 0);

      if (apiSuccess) {
        if (currentMode === 'login') {
          setStatusMsg({ type: 'success', text: 'Đăng nhập thành công! Đang chuyển hướng...' });

          // Lưu thông tin đăng nhập (API trả token tại data.data.access_token)
          const token = data?.data?.access_token || data?.access_token || data?.token;
          if (token) localStorage.setItem('token', token);
          localStorage.setItem('user_info', JSON.stringify(data.data || data || {}));

          setTimeout(() => {
            window.location.href = '/cms';
          }, 1000);
        } else {
          // Mode Đăng ký
          setStatusMsg({ type: 'success', text: 'Đăng ký thành công!' });
          setTimeout(() => setCurrentMode('login'), 2000);
        }
      } else {
        // Hiển thị lỗi cụ thể từ API trả về (ví dụ: "Sai mật khẩu", "User không tồn tại")
        setStatusMsg({
          type: 'error',
          text: data?.message || data?.errors?.[0] || (currentMode === 'login' ? 'Đăng nhập thất bại' : 'Đăng ký thất bại')
        });
      }
    } catch (error) {
      console.error("Auth Error:", error);
      setStatusMsg({ type: 'error', text: 'Không thể kết nối đến máy chủ.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  return (
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
        className={`relative w-full ${currentMode === 'register' ? 'max-w-2xl' : 'max-w-md'} bg-white rounded-3xl shadow-2xl p-8 transition-all duration-300`}
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-3xl font-display font-bold text-slate-900">
            {currentMode === 'login' ? 'Chào mừng trở lại' : 'Bắt đầu với LabBox'}
          </h2>
          <p className="text-slate-500 mt-1">
            {currentMode === 'login' ? 'Đăng nhập để quản lý đơn hàng của bạn' : 'Tạo tài khoản để bảo vệ shop của bạn ngay hôm nay'}
          </p>
        </div>

        {statusMsg && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
            {statusMsg.text}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {currentMode === 'login' ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên đăng nhập</label>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.username ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
                  placeholder="username"
                />
                {errors.username && <p className="text-red-500 text-[10px] mt-1">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu</label>
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type="password"
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.password ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-500 text-[10px] mt-1">{errors.password}</p>}
              </div>
            </>
          ) : registerStep === 1 ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                type="tel"
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.phone ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
                placeholder="+84xxxxxxxxx"
              />
              {errors.phone && <p className="text-red-500 text-[10px] mt-1">{errors.phone}</p>}
            </div>
          ) : registerStep === 2 ? (
            <div>
              <div className="flex items-center justify-between gap-4">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mã OTP</label>
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={isLoading || !!resendUntil}
                  className="text-xs font-bold text-brand hover:underline disabled:text-slate-400 disabled:no-underline"
                >
                  {resendUntil ? `Gửi lại (${resendSecondsLeft}s)` : 'Gửi lại'}
                </button>
              </div>
              <input
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                type="text"
                className={`w-full px-4 py-2.5 rounded-xl border ${errors.otp ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
                placeholder="Nhập mã OTP"
              />
              {errors.otp && <p className="text-red-500 text-[10px] mt-1">{errors.otp}</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="tel"
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên đăng nhập</label>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.username ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
                  placeholder="username"
                />
                {errors.username && <p className="text-red-500 text-[10px] mt-1">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và Tên / Tên Shop</label>
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.full_name ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
                  placeholder="Nguyễn Văn A"
                />
                {errors.full_name && <p className="text-red-500 text-[10px] mt-1">{errors.full_name}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.email ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
                  placeholder="name@company.com"
                />
                {errors.email && <p className="text-red-500 text-[10px] mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu</label>
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type="password"
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.password ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-500 text-[10px] mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Xác nhận mật khẩu</label>
                <input
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  type="password"
                  className={`w-full px-4 py-2.5 rounded-xl border ${errors.confirm_password ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all`}
                  placeholder="••••••••"
                />
                {errors.confirm_password && <p className="text-red-500 text-[10px] mt-1">{errors.confirm_password}</p>}
              </div>
            </div>
          )}

          {currentMode === 'register' && registerStep > 1 ? (
            <button
              type="button"
              onClick={() => {
                setStatusMsg(null);
                setErrors({});
                setRegisterStep(s => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
              }}
              className="w-full py-3 text-slate-600 font-bold rounded-xl bg-slate-100 hover:bg-slate-200 transition-all"
            >
              Quay lại
            </button>
          ) : null}

          {currentMode === 'login' ? (
            <button
              disabled={isLoading}
              className="w-full py-3.5 bg-brand hover:bg-brand-dark disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-brand/20 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Đăng nhập'
              )}
            </button>
          ) : registerStep === 1 ? (
            <button
              type="button"
              onClick={sendOtp}
              disabled={isLoading}
              className="w-full py-3.5 bg-brand hover:bg-brand-dark disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-brand/20 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Gửi mã OTP'
              )}
            </button>
          ) : registerStep === 2 ? (
            <button
              type="button"
              onClick={verifyOtp}
              disabled={isLoading}
              className="w-full py-3.5 bg-brand hover:bg-brand-dark disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-brand/20 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Xác thực OTP'
              )}
            </button>
          ) : (
            <button
              disabled={isLoading}
              className="w-full py-3.5 bg-brand hover:bg-brand-dark disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-brand/20 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Đăng ký tài khoản'
              )}
            </button>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            {currentMode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button
              onClick={() => {
                setCurrentMode(currentMode === 'login' ? 'register' : 'login');
                setStatusMsg(null);
                setErrors({});
                setRegisterStep(1);
                setResendUntil(null);
                setResendSecondsLeft(0);
                setIsOtpVerified(false);
                setFormData(prev => ({ ...prev, otp: '' }));
              }}
              className="ml-2 text-brand font-bold hover:underline"
            >
              {currentMode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const Navbar = ({ onOpenAuth }: { onOpenAuth: (mode: 'login' | 'register') => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-6'
      }`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="LabBox Logo" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-brand/20" />
          <span className="text-xl font-display font-bold tracking-tight text-slate-900">
            LabBox
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Tính năng', 'Bảng giá', 'Về chúng tôi', 'Liên hệ'].map((item) => (
            <a key={item} href="#" className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => onOpenAuth('login')}
            className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-brand transition-colors"
          >
            Đăng nhập
          </button>
          <button
            onClick={() => onOpenAuth('register')}
            className="px-6 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-bold rounded-xl shadow-lg shadow-brand/20 transition-all active:scale-95"
          >
            Dùng thử miễn phí
          </button>
        </div>

        <button
          className="md:hidden p-2 text-slate-600"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="p-6 flex flex-col gap-4">
              {['Tính năng', 'Bảng giá', 'Về chúng tôi', 'Liên hệ'].map((item) => (
                <a key={item} href="#" className="text-lg font-semibold text-slate-600">{item}</a>
              ))}
              <hr className="border-slate-100" />
              <button
                onClick={() => { onOpenAuth('login'); setIsMobileMenuOpen(false); }}
                className="w-full py-3 text-center font-bold text-slate-700"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => { onOpenAuth('register'); setIsMobileMenuOpen(false); }}
                className="w-full py-4 bg-brand text-white font-bold rounded-xl"
              >
                Dùng thử miễn phí
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default function LandingPage() {
  const [authModal, setAuthModal] = useState<{ isOpen: boolean, mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login'
  });

  const openAuth = (mode: 'login' | 'register') => setAuthModal({ isOpen: true, mode });
  const closeAuth = () => setAuthModal({ ...authModal, isOpen: false });

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar onOpenAuth={openAuth} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-brand/10 blur-[100px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 text-brand rounded-full text-sm font-bold mb-6">
                <Zap size={16} />
                <span>Giải pháp quay video đóng gói số 1 Việt Nam</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-display font-bold leading-[1.1] mb-8 tracking-tight">
                Bằng chứng thép cho <span className="text-brand">mọi đơn hàng</span> của bạn.
              </h1>
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
                LabBox giúp các nhà bán hàng Shopee, TikTok, Lazada quay video đóng gói 4K tự động,
                truy xuất nhanh chóng khi có khiếu nại. Bảo vệ shop, giảm hoàn hàng.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => openAuth('register')}
                  className="px-8 py-4 bg-brand hover:bg-brand-dark text-white font-bold rounded-2xl shadow-xl shadow-brand/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  Bắt đầu ngay miễn phí
                  <ChevronRight size={20} />
                </button>
                <button className="px-8 py-4 bg-white border-2 border-slate-100 hover:border-brand/20 text-slate-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2">
                  <Play size={20} className="text-brand" />
                  Xem demo 2 phút
                </button>
              </div>

              <div className="mt-12 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                      <img src={`https://picsum.photos/seed/user${i}/40/40`} alt="" />
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex text-brand">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  <p className="text-slate-500 font-medium">Hơn 2,000+ shop đã tin dùng</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 bg-white rounded-[2.5rem] p-4 shadow-2xl border border-slate-100">
                <img
                  src="https://picsum.photos/seed/dashboard/1200/800"
                  alt="LabBox Dashboard"
                  className="rounded-[2rem] w-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand/20 blur-3xl rounded-full -z-10" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-brand/10 blur-3xl rounded-full -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-display font-bold mb-6">Tính năng vượt trội</h2>
            <p className="text-lg text-slate-600">
              Chúng tôi xây dựng LabBox với mục tiêu duy nhất: Giúp bạn yên tâm bán hàng,
              mọi việc đối soát đã có chúng tôi lo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Quay video 4K tự động',
                desc: 'Tự động bắt đầu quay khi quét mã đơn hàng, chất lượng 4K sắc nét từng chi tiết sản phẩm.',
                icon: Video,
                color: 'bg-blue-500'
              },
              {
                title: 'Bằng chứng thép',
                desc: 'Video được lưu trữ an toàn, không thể chỉnh sửa, đảm bảo tính minh bạch tuyệt đối khi đối soát.',
                icon: Shield,
                color: 'bg-emerald-500'
              },
              {
                title: 'Truy xuất tức thì',
                desc: 'Tìm kiếm video theo mã đơn hàng chỉ trong 1 giây. Không còn mất thời gian lục lại camera.',
                icon: Zap,
                color: 'bg-orange-500'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-2 group">
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-${feature.color.split('-')[1]}-200`}>
                  <feature.icon size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-brand transition-colors">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <img src="https://picsum.photos/seed/team1/400/600" alt="" className="rounded-3xl mt-12" referrerPolicy="no-referrer" />
                <img src="https://picsum.photos/seed/team2/400/600" alt="" className="rounded-3xl" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand/5 blur-3xl rounded-full" />
            </div>
            <div>
              <h2 className="text-4xl font-display font-bold mb-8">Về LabBox</h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                LabBox ra đời từ sự thấu hiểu nỗi đau của các nhà bán hàng online khi phải đối mặt với các khiếu nại vô lý, tráo hàng, hoặc mất hàng trong quá trình vận chuyển.
              </p>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                Đội ngũ của chúng tôi bao gồm những chuyên gia công nghệ và những người từng kinh doanh thương mại điện tử, cam kết mang lại giải pháp bảo vệ quyền lợi chính đáng cho người bán.
              </p>
              <div className="space-y-4">
                {['Hơn 5 năm kinh nghiệm TMĐT', 'Hỗ trợ kỹ thuật 24/7', 'Hệ thống ổn định 99.9%'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-brand/10 text-brand rounded-full flex items-center justify-center">
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="font-bold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-slate-900 text-white rounded-[4rem] mx-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-display font-bold mb-6">Bảng giá linh hoạt</h2>
            <p className="text-slate-400">Chọn gói dịch vụ phù hợp nhất với quy mô shop của bạn.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Cơ bản',
                price: 'Miễn phí',
                desc: 'Cho shop mới bắt đầu',
                features: ['Lưu trữ 50 video/tháng', 'Chất lượng HD', 'Tìm kiếm theo mã đơn', 'Hỗ trợ qua email'],
                cta: 'Bắt đầu ngay',
                popular: false
              },
              {
                name: 'Chuyên nghiệp',
                price: '199.000đ',
                period: '/tháng',
                desc: 'Cho shop đang tăng trưởng',
                features: ['Lưu trữ 500 video/tháng', 'Chất lượng 4K', 'Tự động quét mã', 'Hỗ trợ ưu tiên 24/7', 'Phân quyền nhân viên'],
                cta: 'Dùng thử 7 ngày',
                popular: true
              },
              {
                name: 'Doanh nghiệp',
                price: 'Liên hệ',
                desc: 'Cho chuỗi cửa hàng lớn',
                features: ['Lưu trữ không giới hạn', 'Hệ thống riêng biệt', 'API tích hợp', 'Quản lý đa kho', 'Đào tạo tận nơi'],
                cta: 'Nhận tư vấn',
                popular: false
              }
            ].map((plan, i) => (
              <div key={i} className={`relative p-10 rounded-[3rem] border transition-all ${plan.popular ? 'bg-brand border-brand scale-105 z-10 shadow-2xl shadow-brand/20' : 'bg-white/5 border-white/10'
                }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-brand px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                    Phổ biến nhất
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className={plan.popular ? 'text-white/80' : 'text-slate-400'}>{plan.desc}</p>
                <div className="my-8">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-lg opacity-60">{plan.period}</span>}
                </div>
                <ul className="space-y-4 mb-10">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 size={18} className={plan.popular ? 'text-white' : 'text-brand'} />
                      <span className={plan.popular ? 'text-white' : 'text-slate-300'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openAuth('register')}
                  className={`w-full py-4 rounded-2xl font-bold transition-all ${plan.popular ? 'bg-white text-brand hover:bg-slate-100' : 'bg-brand text-white hover:bg-brand-dark'
                    }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="bg-brand/5 p-16 rounded-[3rem] border border-brand/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
            <h2 className="text-4xl lg:text-5xl font-display font-bold mb-8">
              Sẵn sàng bảo vệ shop của bạn?
            </h2>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">
              Tham gia cùng 2,000+ nhà bán hàng thông thái đã chọn LabBox để tối ưu quy trình và bảo vệ lợi nhuận.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => openAuth('register')}
                className="px-10 py-5 bg-brand hover:bg-brand-dark text-white font-bold rounded-2xl shadow-xl shadow-brand/20 transition-all hover:scale-105 active:scale-95"
              >
                Đăng ký ngay - Miễn phí
              </button>
              <button className="px-10 py-5 bg-white border-2 border-slate-100 hover:border-brand/20 text-slate-700 font-bold rounded-2xl transition-all">
                Liên hệ bộ phận kinh doanh
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 pt-20 pb-10 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <img src="/logo.png" alt="LabBox Logo" className="w-8 h-8 object-contain rounded-lg" />
                <span className="text-xl font-display font-bold tracking-tight text-slate-900">
                  LabBox
                </span>
              </div>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Giải pháp quay video đóng gói và quản lý đơn hàng thông minh dành cho nhà bán hàng TMĐT.
              </p>
              <div className="flex gap-4">
                {[Facebook, Twitter, Instagram].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-brand hover:border-brand transition-all">
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6">Sản phẩm</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                {['Tính năng', 'Bảng giá', 'Hướng dẫn sử dụng', 'Tải ứng dụng'].map(item => (
                  <li key={item}><a href="#" className="hover:text-brand transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">Công ty</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                {['Về chúng tôi', 'Tuyển dụng', 'Chính sách bảo mật', 'Điều khoản dịch vụ'].map(item => (
                  <li key={item}><a href="#" className="hover:text-brand transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">Liên hệ</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li className="flex items-center gap-3">
                  <Mail size={16} className="text-brand" />
                  <span>support@labbox.vn</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={16} className="text-brand" />
                  <span>1900 8888</span>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin size={16} className="text-brand" />
                  <span>Tòa nhà Innovation, Quận 1, TP.HCM</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
            <p>© 2024 LabBox. Tất cả quyền được bảo lưu. Thiết kế bởi LabBox Team.</p>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {authModal.isOpen && (
          <AuthModal
            isOpen={authModal.isOpen}
            mode={authModal.mode}
            onClose={closeAuth}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
