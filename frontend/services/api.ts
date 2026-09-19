const DEFAULT_API_URL = 'http://localhost:3000/api';

export const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;

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
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
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
