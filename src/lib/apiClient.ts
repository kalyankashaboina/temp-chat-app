// ─── Typed API client — wraps fetch with credentials & error handling ────────
import { API_BASE_URL } from '@/config';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: 'include', // send cookie every request
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, opts?: RequestInit) => request<T>(path, { method: 'GET', ...opts }),
  post: <T>(path: string, body?: unknown, opts?: RequestInit) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), ...opts }),
  put: <T>(path: string, body?: unknown, opts?: RequestInit) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body), ...opts }),
  delete: <T>(path: string, opts?: RequestInit) => request<T>(path, { method: 'DELETE', ...opts }),
};
