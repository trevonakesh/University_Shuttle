// Base URL of the UniShuttle backend API.
// Configure NEXT_PUBLIC_API_URL for deployed environments; defaults to local dev.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

const TOKEN_KEY = 'unishuttle_admin_token';

export const getToken = (): string | null =>
  typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);

export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

// Uploads an image the same way the app's sign-up flow does
// (POST /api/upload, multipart field "image") and returns its URL path.
export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const token = getToken();
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData
  });
  const data = await res.json();
  if (!res.ok || !data.url) {
    throw new Error(data.message ?? 'Upload failed');
  }
  return data.url as string;
};

// fetch with the admin JWT attached; kicks back to /login when the session
// is missing, expired, or not an admin.
export const authFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  if (!token) {
    window.location.href = '/login';
    throw new Error('Not logged in');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401 || res.status === 403) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  return res;
};
