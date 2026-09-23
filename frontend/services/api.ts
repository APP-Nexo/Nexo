import Constants from 'expo-constants';

const DEFAULT_API_URL = 'http://localhost:3000/api';

// The backend's LAN IP changes whenever the machine switches networks —
// hardcoding it in EXPO_PUBLIC_API_URL means updating it by hand every time.
// `hostUri` is the host:port the Expo dev server is *actually* being reached
// at right now (set by the CLI, dev-only) — same LAN path a phone or browser
// already used to load this bundle, so the API must be reachable there too.
// An explicit EXPO_PUBLIC_API_URL (e.g. pointing at a deployed backend) still
// wins when set.
function resolveDevApiUrl(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  return host ? `http://${host}:3000/api` : null;
}

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || resolveDevApiUrl() || DEFAULT_API_URL;

// Uploaded files (avatars, banners) are served from the API's origin, not
// under /api — the backend returns paths like `/uploads/avatars/x.jpg`.
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

// The access token is short-lived (15min). When a request 401s, this handler
// (wired by AuthContext) tries to refresh it and returns the new token, so the
// request can be retried once transparently instead of surfacing a spurious error.
type UnauthorizedHandler = () => Promise<string | null>;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

async function rawFetch(path: string, method: string, body: unknown, token?: string | null) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = {};
  // FormData bodies must NOT get an explicit Content-Type: fetch needs to set
  // it itself (multipart/form-data; boundary=...) based on the actual parts.
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      'Não foi possível conectar ao servidor. Verifique sua conexão e a URL da API.',
      0,
      'NETWORK_ERROR',
    );
  }
}

async function parse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message ?? 'Ocorreu um erro inesperado.';
    const code = data?.code ?? 'UNKNOWN_ERROR';
    throw new ApiError(message, response.status, code);
  }

  return data as T;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  let response = await rawFetch(path, method, body, token);

  if (response.status === 401 && token && unauthorizedHandler) {
    const refreshedToken = await unauthorizedHandler();
    if (refreshedToken) {
      response = await rawFetch(path, method, body, refreshedToken);
    }
  }

  return parse<T>(response);
}
