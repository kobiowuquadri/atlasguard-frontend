/**
 * Minimal client for the AtlasGuard API. The browser calls same-origin `/api/v1/*`, which
 * Next.js proxies to the API, so the HTTP-only session cookie is first-party.
 */

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
}

export const API_PREFIX = '/api/v1';

function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return `${API_PREFIX}${path}${qs ? `?${qs}` : ''}`;
}

async function parseError(res: Response): Promise<ApiError> {
  try {
    const json = (await res.json()) as { error?: { code?: string; message?: string; details?: unknown; requestId?: string } };
    const err = json.error;
    return new ApiError(res.status, err?.code ?? 'INTERNAL_ERROR', err?.message ?? `Request failed (${res.status})`, err?.details, err?.requestId);
  } catch {
    return new ApiError(
      res.status,
      res.status === 502 || res.status === 503 || res.status === 504 ? 'API_UNREACHABLE' : 'INTERNAL_ERROR',
      res.status >= 500 ? 'The AtlasGuard API is not reachable right now. Please try again shortly.' : `Request failed (${res.status})`,
    );
  }
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<{ data: T; meta?: PageMeta }> {
  let res: Response;
  try {
    res = await fetch(buildUrl(path, options.query), {
      method,
      headers: options.body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: 'same-origin',
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'Network error: check your connection and try again.');
  }
  if (!res.ok) throw await parseError(res);
  const json = (await res.json()) as { success: boolean; data: T; meta?: PageMeta };
  return { data: json.data, meta: json.meta };
}

export const api = {
  get: async <T>(path: string, query?: Query, signal?: AbortSignal) => (await request<T>('GET', path, { query, signal })).data,
  page: async <T>(path: string, query?: Query, signal?: AbortSignal) => {
    const res = await request<T[]>('GET', path, { query, signal });
    return { items: res.data, meta: res.meta as PageMeta };
  },
  post: async <T>(path: string, body?: unknown) => (await request<T>('POST', path, { body: body ?? {} })).data,
  patch: async <T>(path: string, body?: unknown) => (await request<T>('PATCH', path, { body: body ?? {} })).data,
  delete: async <T>(path: string) => (await request<T>('DELETE', path)).data,
};

/** Downloads a file endpoint (reports, dataset export) through the session. */
export async function downloadFile(path: string, query?: Query, fallbackName = 'download'): Promise<void> {
  const res = await fetch(buildUrl(path, query), { credentials: 'same-origin' });
  if (!res.ok) throw await parseError(res);
  const disposition = res.headers.get('content-disposition') ?? '';
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = match?.[1] ?? fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Saves an already-fetched JSON value as a file. */
export function saveJson(value: unknown, filename: string): void {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}
