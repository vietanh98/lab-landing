import React from 'react';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 w-full h-full">
      <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert size={40} className="text-rose-500" />
      </div>
      <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">404 / 403</h1>
      <p className="text-slate-500 max-w-md mb-8">
        Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập vào nội dung này.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>
        <button
          onClick={() => navigate('/cms')}
          className="px-6 py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-lg shadow-brand/20"
        >
          <Home size={18} />
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default NotFound;
