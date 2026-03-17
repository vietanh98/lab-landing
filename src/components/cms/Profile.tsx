import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirmVis, setShowConfirmVis] = useState(false);

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
          try { localStorage.setItem('user_info', JSON.stringify(info)); } catch {}
        } else {
          const raw = localStorage.getItem('user_info');
          if (raw) {
            const info = JSON.parse(raw);
            setUser(info);
            setPhoneDraft(String(info?.phone || ''));
          }
          setError(data?.message || null);
        }
      } catch {
        const raw = localStorage.getItem('user_info');
        if (raw) {
          const info = JSON.parse(raw);
          setUser(info);
          setPhoneDraft(String(info?.phone || ''));
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

  const handleSavePhone = async () => {
    setInfoMsg(null);
    const phone = phoneDraft.trim();
    if (phone && !phoneRegex.test(phone)) {
      setInfoMsg('Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84901234567)');
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

      const tryUpdate = async (apiBase: string) => {
        const endpoint = `${apiBase}/api/v1/users/${userId}`;
        const resp = await fetch(endpoint, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ user_id: userId, phone }),
        });
        const respData = await resp.json().catch(() => ({}));
        const ok = resp.ok && (respData?.status === true || respData?.status_code === 0 || respData?.success === true);
        return { ok, respData };
      };

      const apiBases = [
        import.meta.env.VITE_API_BASE_URL,
        'http://localhost:8000',
        'http://localhost:3000',
      ].filter((v, i, arr) => !!v && arr.indexOf(v) === i) as string[];

      let r: { ok: boolean; respData: any } | null = null;
      for (const base of apiBases) {
        const rr = await tryUpdate(base);
        r = rr;
        if (rr.ok) break;
      }

      if (!r?.ok) {
        setInfoMsg(r?.respData?.message || 'Cập nhật số điện thoại không thành công');
        return;
      }

      const updatedUser = r.respData?.data?.user ?? r.respData?.data ?? { ...(user || {}), phone };
      setUser(updatedUser);
      try { localStorage.setItem('user_info', JSON.stringify(updatedUser)); } catch {}
      setInfoMsg('Cập nhật số điện thoại thành công');
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold text-slate-900">Trang cá nhân</h2>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex gap-2 p-4 border-b border-slate-100">
          <button
            className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer ${activeTab === 'info' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'}`}
            onClick={() => { setActiveTab('info'); setStatusMsg(null); }}
          >
            Thông tin cá nhân
          </button>
          <button
            className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer ${activeTab === 'security' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'}`}
            onClick={() => { setActiveTab('security'); setInfoMsg(null); }}
          >
            Bảo mật
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'info' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-2 text-slate-500">Đang tải...</div>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tên đăng nhập</p>
                    <p className="text-sm text-slate-900 font-bold">{user?.username || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</p>
                    <p className="text-sm text-slate-900 font-bold">{user?.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Số điện thoại</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="tel"
                        value={phoneDraft}
                        onChange={(e) => { setPhoneDraft(e.target.value); setInfoMsg(null); }}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand transition-all"
                        placeholder="VD: 0912345678"
                      />
                      <button
                        type="button"
                        onClick={handleSavePhone}
                        disabled={phoneSaving || phoneDraft.trim() === String(user?.phone || '').trim()}
                        className="px-4 py-3 bg-brand hover:bg-brand-dark disabled:bg-slate-300 text-white font-bold rounded-xl transition-all"
                      >
                        {phoneSaving ? 'Đang lưu...' : 'Lưu'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Trạng thái</p>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${Number(user?.status) === 2 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                      {Number(user?.status) === 2 ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>
                </>
              )}
              {infoMsg && (
                <div className={`col-span-2 text-sm ${infoMsg.includes('thành công') ? 'text-emerald-600' : 'text-rose-600'}`}>{infoMsg}</div>
              )}
              {error && <div className="col-span-2 text-rose-600 text-sm">{error}</div>}
            </div>
          ) : (
            <div className="max-w-md space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    aria-label="toggle-old-password"
                  >
                    {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    aria-label="toggle-new-password"
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Xác nhận mật khẩu</label>
                <div className="relative">
                  <input
                    type={showConfirmVis ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmVis(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    aria-label="toggle-confirm-password"
                  >
                    {showConfirmVis ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {statusMsg && (
                <div className={`text-sm ${statusMsg.includes('thành công') ? 'text-emerald-600' : 'text-rose-600'}`}>{statusMsg}</div>
              )}
              <div className="pt-2">
                <button
                  onClick={handleChangePassword}
                  className="px-6 py-3 bg-brand hover:bg-brand-dark text-white font-bold rounded-xl"
                >
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
