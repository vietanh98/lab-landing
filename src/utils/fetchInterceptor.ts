// Global fetch interceptor.
//
// Purpose: catch 401 responses from our own API, call /auth/refresh once, and
// replay the original request with the new access token. Multiple concurrent
// requests that all receive 401 at the same time are coalesced — only one
// refresh network call is made and every queued request replays with the
// fresh token.
//
// Guardrails added on top of the original version:
//   1. Max 3 refresh attempts per 60-second window. If the refresh endpoint
//      is down, we stop hammering it and force logout instead of spinning
//      forever.
//   2. Queued subscribers are drained on refresh FAILURE too, resolving with
//      an empty token so pending requests don't hang indefinitely.
//   3. Queue length cap to protect against runaway loops.

const originalFetch = window.fetch;

// Coalescing state — only ONE refresh call should be in flight at a time.
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Rate limiting — if the backend's /auth/refresh is persistently broken we
// don't want the interceptor to retry forever.
const REFRESH_WINDOW_MS = 60_000;
const MAX_REFRESH_ATTEMPTS = 3;
let refreshWindowStart = 0;
let refreshAttemptsInWindow = 0;

// Safety ceiling for the subscriber queue. Under normal load the queue is
// cleared within a single refresh round-trip; a runaway value here means
// something is in a loop and we'd rather fail loud than silently grow.
const MAX_QUEUE_LENGTH = 50;

const drainSubscribers = (token: string) => {
  const subs = refreshSubscribers;
  refreshSubscribers = [];
  for (const cb of subs) cb(token);
};

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  if (refreshSubscribers.length >= MAX_QUEUE_LENGTH) {
    // Refuse to grow the queue further — force a logout as a circuit breaker.
    cb('');
    return;
  }
  refreshSubscribers.push(cb);
};

const recordRefreshAttempt = (): boolean => {
  const now = Date.now();
  if (now - refreshWindowStart > REFRESH_WINDOW_MS) {
    refreshWindowStart = now;
    refreshAttemptsInWindow = 0;
  }
  refreshAttemptsInWindow += 1;
  return refreshAttemptsInWindow <= MAX_REFRESH_ATTEMPTS;
};

const forceLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('isLoggedIn');
  if (window.location.pathname !== '/') {
    window.location.href = '/';
  }
};

window.fetch = async (...args) => {
  const [resource, config] = args;
  const url = typeof resource === 'string' ? resource : resource instanceof Request ? resource.url : '';
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  let response = await originalFetch(...args);

  // Only intercept 401s from our own API. Auth endpoints are allowed through
  // untouched so the interceptor can't loop on its own refresh call.
  const shouldIntercept =
    response.status === 401 &&
    url.startsWith(apiBase) &&
    !url.includes('/auth/login') &&
    !url.includes('/auth/refresh') &&
    !url.includes('/auth/register');

  if (!shouldIntercept) return response;

  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    forceLogout();
    return response;
  }

  // Rate-limit the refresh endpoint itself — a backend outage shouldn't turn
  // every request into a refresh retry.
  if (!recordRefreshAttempt()) {
    // eslint-disable-next-line no-console
    console.warn('[fetchInterceptor] refresh attempt cap reached, forcing logout');
    forceLogout();
    return response;
  }

  if (!isRefreshing) {
    isRefreshing = true;
    try {
      const refreshRes = await originalFetch(`${apiBase}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const refreshData = await refreshRes.json().catch(() => ({}));
      const newAccessToken = refreshData?.data?.access_token || refreshData?.access_token || refreshData?.token;
      const newRefreshToken = refreshData?.data?.refresh_token || refreshData?.refresh_token;

      if (!refreshRes.ok || !newAccessToken) {
        throw new Error('refresh failed');
      }

      localStorage.setItem('token', newAccessToken);
      if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);

      isRefreshing = false;
      drainSubscribers(newAccessToken);
    } catch {
      // Drain with an empty token so every waiting request resolves quickly
      // instead of hanging. Then clear auth state and send the user home.
      isRefreshing = false;
      drainSubscribers('');
      forceLogout();
      return response;
    }
  }

  // Queue this request for replay once the in-flight refresh completes.
  return new Promise<Response>(resolve => {
    subscribeTokenRefresh((newToken: string) => {
      // Empty token means the refresh failed — give up and return the 401 we
      // already have so the caller can show its own error state.
      if (!newToken) {
        resolve(response);
        return;
      }
      const newConfig = { ...(config || {}) } as RequestInit;
      const newHeaders = new Headers(newConfig.headers);
      newHeaders.delete('Authorization');

      const plainHeaders: Record<string, string> = {};
      newHeaders.forEach((value, key) => (plainHeaders[key] = value));
      plainHeaders['Authorization'] = `Bearer ${newToken}`;
      newConfig.headers = plainHeaders;

      resolve(originalFetch(resource, newConfig));
    });
  });
};

export {};
