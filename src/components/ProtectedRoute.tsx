
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ReactNode } from 'react';
type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Run once on mount: read token and decide redirect/verify.
    // Intentionally not including `navigate` in deps to avoid re-running
    // if navigate identity changes and causing update loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!token && !refreshToken) {
      // Nếu không có cả token và refresh_token, điều hướng về trang chủ
      localStorage.removeItem('isLoggedIn');
      navigate('/', { replace: true });
      return;
    }

    // Set verified only if not already true to avoid unnecessary updates
    setIsVerified(prev => prev || true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nếu chưa verify xong thì trả về null hoặc loading spinner để tránh lộ nội dung CMS
  if (!isVerified) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;