import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ReactNode } from 'react';

type ProtectedRouteProps = {
  children: ReactNode;
};

/**
 * Gate component for every /cms/* route. Behaviour:
 *
 *  1. If neither access nor refresh token exists → redirect to the landing page.
 *  2. If the access token is missing but a refresh token is present → attempt
 *     one refresh call synchronously. On success, persist the new tokens and
 *     let the user through. On failure, redirect and clear the cached login.
 *  3. If the access token exists → let the user through immediately. The
 *     fetchInterceptor handles 401s for any subsequent requests.
 *
 * Previously the component short-circuited on step 1 even when the user had a
 * valid refresh token — a simple page reload on an expired access token would
 * silently log them out. The proactive refresh below keeps them signed in
 * across reloads.
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  // 'checking' = we haven't decided yet (refresh in flight).
  // 'ok'       = user is allowed in.
  // 'denied'   = redirecting to landing.
  const [status, setStatus] = useState<'checking' | 'ok' | 'denied'>('checking');

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refresh_token');

      // No credentials at all → hard redirect.
      if (!token && !refreshToken) {
        localStorage.removeItem('isLoggedIn');
        if (!cancelled) setStatus('denied');
        navigate('/', { replace: true });
        return;
      }

      // Access token present — trust it for now, fetchInterceptor can still
      // swap in a fresh one if the server returns 401.
      if (token) {
        if (!cancelled) setStatus('ok');
        return;
      }

      // Only a refresh token — try to exchange it for a new access token so
      // a user who just reloaded an expired session doesn't get bounced out.
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const res = await fetch(`${apiBase}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        const data = await res.json().catch(() => ({}));
        const newAccess = data?.data?.access_token || data?.access_token || data?.token;
        const newRefresh = data?.data?.refresh_token || data?.refresh_token;

        if (res.ok && newAccess) {
          localStorage.setItem('token', newAccess);
          if (newRefresh) localStorage.setItem('refresh_token', newRefresh);
          if (!cancelled) setStatus('ok');
          return;
        }
        throw new Error('refresh failed');
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('isLoggedIn');
        if (!cancelled) setStatus('denied');
        navigate('/', { replace: true });
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
    // `navigate`'s identity can change across renders in some router setups;
    // we only want to run this once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status !== 'ok') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
