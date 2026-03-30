const originalFetch = window.fetch;

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.map(cb => cb(token));
};

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

window.fetch = async (...args) => {
  const [resource, config] = args;
  const url = typeof resource === 'string' ? resource : resource instanceof Request ? resource.url : '';
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  let response = await originalFetch(...args);

  // Intercept 401s from our API, but don't intercept login or refresh attempts
  if (response.status === 401 && url.startsWith(apiBase) && !url.includes('/auth/login') && !url.includes('/auth/refresh') && !url.includes('/auth/register')) {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      return response;
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await originalFetch(`${apiBase}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*'
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        const refreshData = await refreshRes.json().catch(() => ({}));
        const newAccessToken = refreshData?.data?.access_token || refreshData?.access_token || refreshData?.token;
        const newRefreshToken = refreshData?.data?.refresh_token || refreshData?.refresh_token;

        if (newAccessToken) {
          localStorage.setItem('token', newAccessToken);
          if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);
          
          isRefreshing = false;
          onRefreshed(newAccessToken);
          refreshSubscribers = [];
        } else {
          throw new Error('Refresh failed');
        }
      } catch (err) {
        isRefreshing = false;
        refreshSubscribers = [];
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('isLoggedIn');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
        return response;
      }
    }

    return new Promise<Response>((resolve) => {
      subscribeTokenRefresh((newToken: string) => {
        const newConfig = { ...(config || {}) } as RequestInit;
        
        // Ensure new headers are initialized and overwrite the old Authorization header
        let newHeaders = new Headers(newConfig.headers);
        newHeaders.delete('Authorization');
        
        const plainHeaders: Record<string, string> = {};
        newHeaders.forEach((value, key) => plainHeaders[key] = value);
        plainHeaders['Authorization'] = `Bearer ${newToken}`;
        
        newConfig.headers = plainHeaders;
        
        resolve(originalFetch(resource, newConfig));
      });
    });
  }

  return response;
};

export {};
