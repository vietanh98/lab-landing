import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Shield, Zap, User, Mail, Phone, Calendar, Clock, CreditCard } from 'lucide-react';

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [fullNameDraft, setFullNameDraft] = useState('');
  const [dobDraft, setDobDraft] = useState('');
  const [genderDraft, setGenderDraft] = useState('');
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirmVis, setShowConfirmVis] = useState(false);

  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  useEffect(() => {
    const fetchMe = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = `${apiBase}/api/v1/auth/me`;
        const headers: Record<string, string> = { Accept: 'application/json, text/plain, */*' };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['X-Timestamp'] = Date.now().toString();
        const res = await fetch(endpoint, { headers });
        const data = await res.json().catch(() => ({}));
        const ok = res.ok && (data?.status === true || data?.status_code === 0 || data?.success === true);
        if (ok) {
          const info = data?.data ?? {};
          setUser(info);
          setPhoneDraft(String(info?.phone || ''));
          setEmailDraft(String(info?.email || ''));
          setFullNameDraft(String(info?.full_name || info?.name || ''));
          setDobDraft(formatDateForInput(info?.date_of_birth || ''));
          setGenderDraft(String(info?.gender ?? ''));
          try { localStorage.setItem('user_info', JSON.stringify(info)); } catch {}
        } else {
          const raw = localStorage.getItem('user_info');
          if (raw) {
            const info = JSON.parse(raw);
            setUser(info);
            setPhoneDraft(String(info?.phone || ''));
            setEmailDraft(String(info?.email || ''));
            setFullNameDraft(String(info?.full_name || info?.name || ''));
            setDobDraft(formatDateForInput(info?.date_of_birth || ''));
            setGenderDraft(String(info?.gender ?? ''));
          }
          setError(data?.message || null);
        }
      } catch {
        const raw = localStorage.getItem('user_info');
        if (raw) {
          const info = JSON.parse(raw);
          setUser(info);
          setPhoneDraft(String(info?.phone || ''));
          setEmailDraft(String(info?.email || ''));
          setFullNameDraft(String(info?.full_name || info?.name || ''));
          setDobDraft(formatDateForInput(info?.date_of_birth || ''));
          setGenderDraft(String(info?.gender ?? ''));
        }
        setError('Không thể kết nối đến máy chủ');
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const phoneRegex = /^(?:\+?84|0)(3|5|7|8|9)\d{8}$/;

  const getUserId = () => {
    const u = user || {};
    const candidate = u.id ?? u.user_id ?? u.sub ?? u.userId;
    const n = Number(candidate);
    if (!Number.isNaN(n) && n > 0) return n;
    const tokenRaw = localStorage.getItem('token');
    if (tokenRaw) {
      try {
        const payload = JSON.parse(atob(tokenRaw.split('.')[1]));
        const fromToken = payload.sub || payload.user_id || payload.id;
        const nn = Number(fromToken);
        if (!Number.isNaN(nn) && nn > 0) return nn;
      } catch {}
    }
    return null;
  };

  const handleSaveProfile = async () => {
    setInfoMsg(null);
    const phone = phoneDraft.trim();
    const email = emailDraft.trim();
    const full_name = fullNameDraft.trim();
    const date_of_birth = dobDraft.trim();
    const gender = genderDraft ? Number(genderDraft) : null;

    if (phone && !phoneRegex.test(phone)) {
      setInfoMsg('Số điện thoại không hợp lệ');
      return;
    }
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      setInfoMsg('Email không hợp lệ');
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setInfoMsg('Không xác định được tài khoản. Vui lòng đăng nhập lại.');
      return;
    }

    setPhoneSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        'X-Timestamp': Date.now().toString(),
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const endpoint = `${apiBase}/api/v1/users/${userId}`;
      const resp = await fetch(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ user_id: userId, phone, email, full_name, date_of_birth, gender }),
      });
      const respData = await resp.json().catch(() => ({}));
      const ok = resp.ok && (respData?.status === true || respData?.status_code === 0 || respData?.success === true);

      if (!ok) {
        setInfoMsg(respData?.message || 'Cập nhật thông tin không thành công');
        return;
      }

      const updatedUser = respData?.data?.user ?? respData?.data ?? { ...(user || {}), phone, email, full_name, date_of_birth, gender };
      setUser(updatedUser);
      setDobDraft(formatDateForInput(updatedUser?.date_of_birth || ''));
      try { localStorage.setItem('user_info', JSON.stringify(updatedUser)); } catch {}
      setInfoMsg('Cập nhật thông tin thành công');
    } catch {
      setInfoMsg('Không thể kết nối máy chủ');
    } finally {
      setPhoneSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setStatusMsg(null);
    if (!oldPassword || !newPassword || !confirmPassword) {
      setStatusMsg('Vui lòng nhập đủ các trường');
      return;
    }
    if (newPassword.length < 6) {
      setStatusMsg('Mật khẩu mới phải từ 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg('Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const endpoint = `${apiBase}/api/v1/auth/change-pass`;
      const headers: Record<string, string> = { Accept: 'application/json, text/plain, */*' };
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      headers['X-Timestamp'] = Date.now().toString();
      const form = new FormData();
      form.append('old_password', oldPassword);
      form.append('new_password', newPassword);
      form.append('confirm_password', confirmPassword);
      const res = await fetch(endpoint, { method: 'POST', headers, body: form });
      const data = await res.json().catch(() => ({}));
      const ok = res.ok && (data?.status === true || data?.status_code === 0);
      if (!ok) {
        setStatusMsg(data?.message || 'Đổi mật khẩu không thành công');
      } else {
        setStatusMsg('Đổi mật khẩu thành công');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setStatusMsg('Không thể kết nối máy chủ');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 mb-1">Cài đặt tài khoản</h2>
          <p className="text-slate-500 text-sm">Quản lý thông tin cá nhân và bảo mật của bạn</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <div className="md:w-64 border-r border-slate-100 bg-slate-50/50 p-6 space-y-2 rounded-l-[2.5rem]">
          <button
            onClick={() => setActiveTab('info')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'info' ? 'bg-white text-brand shadow-sm shadow-brand/5 border border-slate-100' : 'text-slate-500 hover:bg-white/50'
            }`}
          >
            <User size={18} />
            Thông tin cá nhân
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'security' ? 'bg-white text-brand shadow-sm shadow-brand/5 border border-slate-100' : 'text-slate-500 hover:bg-white/50'
            }`}
          >
            <Shield size={18} />
            Bảo mật
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 lg:p-12">
          {activeTab === 'info' ? (
            <div className="max-w-3xl space-y-10">
              {loading ? (
                <div className="flex items-center gap-3 text-slate-500 py-10">
                  <Clock className="animate-spin text-brand" />
                  Đang tải dữ liệu...
                </div>
              ) : (
                <>
                  {/* Basic Info Grid */}
                  <div className="space-y-6 md:space-y-8">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                      <div className="group">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">
                          <User size={14} /> Tên đăng nhập
                        </label>
                        <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 font-medium select-none cursor-not-allowed">
                          {user?.username || '—'}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 ml-1 italic">Tên đăng nhập không thể thay đổi</p>
                      </div>

                      <div className="group">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">
                          <User size={14} /> Họ và tên
                        </label>
                        <input
                          type="text"
                          value={fullNameDraft}
                          onChange={(e) => { setFullNameDraft(e.target.value); setInfoMsg(null); }}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-slate-900 font-medium"
                          placeholder="Nhập họ và tên"
                        />
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                      <div className="group">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">
                          <Mail size={14} /> Email liên hệ
                        </label>
                        <input
                          type="email"
                          value={emailDraft}
                          onChange={(e) => { setEmailDraft(e.target.value); setInfoMsg(null); }}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-slate-900 font-medium"
                          placeholder="shop@example.com"
                        />
                      </div>

                      <div className="group">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">
                          <Phone size={14} /> Số điện thoại
                        </label>
                        <input
                          type="tel"
                          value={phoneDraft}
                          onChange={(e) => { setPhoneDraft(e.target.value); setInfoMsg(null); }}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-slate-900 font-medium"
                          placeholder="0912 xxx xxx"
                        />
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                      <div className="group">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">
                          <Calendar size={14} /> Ngày sinh
                        </label>
                        <input
                          type="date"
                          value={dobDraft}
                          onChange={(e) => { setDobDraft(e.target.value); setInfoMsg(null); }}
                          className="w-full px-4 py-[11px] bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-slate-900 font-medium"
                        />
                      </div>

                      <div className="group">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-brand transition-colors">
                          <User size={14} /> Giới tính
                        </label>
                        <div className="flex items-center gap-6 px-4 py-[11px] bg-white border border-slate-200 rounded-2xl">
                          {[{ value: "1", label: "Nam" }, { value: "2", label: "Nữ" }, { value: "3", label: "Khác" }].map(option => (
                            <label key={option.value} className="flex items-center gap-2 cursor-pointer group/radio">
                              <div className="relative flex items-center justify-center w-5 h-5">
                                <input 
                                  type="radio" 
                                  name="gender" 
                                  value={option.value} 
                                  checked={String(genderDraft) === option.value} 
                                  onChange={(e) => { setGenderDraft(e.target.value); setInfoMsg(null); }} 
                                  className="peer sr-only" 
                                />
                                <div className="w-5 h-5 border-2 border-slate-300 rounded-full peer-checked:border-brand peer-focus-visible:ring-4 ring-brand/20 transition-all peer-checked:bg-white group-hover/radio:border-slate-400"></div>
                                <div className="absolute w-2.5 h-2.5 bg-brand rounded-full scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                              </div>
                              <span className={`text-sm font-medium transition-colors ${String(genderDraft) === option.value ? 'text-slate-900' : 'text-slate-600 group-hover/radio:text-slate-900'}`}>
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 mb-2 group w-full md:w-1/2 md:pr-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      <Clock size={14} /> Trạng thái tài khoản
                    </label>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                        Number(user?.status) === 2 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${Number(user?.status) === 2 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {Number(user?.status) === 2 ? 'Hoạt động' : 'Đang khóa'}
                      </span>
                    </div>
                  </div>

                  {/* Message and Save Actions */}
                  <div className="pt-4 space-y-4">
                    {infoMsg && (
                      <div className={`p-4 rounded-2xl text-sm font-medium animate-in slide-in-from-top-2 ${
                        infoMsg.includes('thành công') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {infoMsg}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={phoneSaving || (phoneDraft.trim() === String(user?.phone || '').trim() && emailDraft.trim() === String(user?.email || '').trim() && fullNameDraft.trim() === String(user?.full_name || user?.name || '').trim() && dobDraft.trim() === String(user?.date_of_birth || '').trim() && genderDraft === String(user?.gender ?? ''))}
                      className="px-10 py-4 bg-brand hover:bg-brand-dark disabled:bg-slate-200 disabled:text-slate-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-brand/20 active:scale-95"
                    >
                      {phoneSaving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
                    </button>
                  </div>



                  {/* Subscriptions section */}
                  {user?.dashboard?.subscriptions && user.dashboard.subscriptions.length > 0 && (
                    <div className="pt-10 border-t border-slate-100">
                      <div className="flex items-center gap-2 mb-6">
                        <Zap className="text-amber-500" size={20} />
                        <h3 className="text-lg font-bold text-slate-900">Gói dịch vụ đang dùng</h3>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {user.dashboard.subscriptions.map((sub: any, idx: number) => (
                          <div key={idx} className="relative group overflow-hidden bg-white border border-slate-200 rounded-[2rem] p-6 transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:border-brand/20">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16 group-hover:bg-brand/10 transition-colors" />
                            
                            <div className="flex justify-between items-start mb-6 relative z-10">
                              <div>
                                <h4 className="text-xl font-black text-slate-900">{sub.plan_name}</h4>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                                  <Clock size={10} /> ID: #{sub.subscription_id}
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                sub.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {sub.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                              <div className="p-3 bg-slate-50 rounded-2xl">
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Cửa hàng</p>
                                <p className="text-lg font-bold text-slate-900">{sub.max_stores}</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-2xl">
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Lưu trữ</p>
                                <p className="text-lg font-bold text-slate-900">{sub.max_storage_gb} GB</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-50">
                              <span className="text-slate-400 font-medium">Hết hạn vào:</span>
                              <span className="flex items-center gap-1.5 text-slate-900 font-bold bg-slate-50 px-3 py-1 rounded-full">
                                <Calendar size={12} className="text-brand" />
                                {new Date(sub.expires_at).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-medium">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-md space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mật khẩu hiện tại</label>
                  <div className="relative group">
                    <input
                      type={showOld ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-4 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-slate-900"
                      placeholder="Nhập mật khẩu cũ"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOld(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-brand transition-colors"
                    >
                      {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mật khẩu mới</label>
                  <div className="relative group">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-slate-900"
                      placeholder="Mật khẩu tối thiểu 6 ký tự"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-brand transition-colors"
                    >
                      {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Xác nhận mật khẩu mới</label>
                  <div className="relative group">
                    <input
                      type={showConfirmVis ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/5 transition-all text-slate-900"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmVis(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-brand transition-colors"
                    >
                      {showConfirmVis ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {statusMsg && (
                <div className={`p-4 rounded-2xl text-sm font-medium animate-in slide-in-from-top-2 ${
                  statusMsg.includes('thành công') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {statusMsg}
                </div>
              )}
              
              <button
                onClick={handleChangePassword}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
              >
                Cập nhật mật khẩu
              </button>

              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                <div className="flex items-start gap-3">
                  <Clock className="text-amber-600 mt-1" size={18} />
                  <div>
                    <h5 className="text-sm font-bold text-amber-900">Lưu ý bảo mật</h5>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      Sử dụng mật khẩu mạnh bao gồm chữ cái, số và ký hiệu đặc biệt. Đừng bao giờ chia sẻ mật khẩu của bạn với bất kỳ ai.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
