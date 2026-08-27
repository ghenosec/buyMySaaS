import { Category, Paginated, Saas } from './types';

function apiV1Url(value: string) {
  const url = new URL(value);
  url.pathname = `${url.pathname.replace(/\/$/, '').replace(/\/api\/v1$/, '')}/api/v1`;
  return url.toString().replace(/\/$/, '');
}

const publicApiEnvironment = process.env.NEXT_PUBLIC_API_URL;
const serverApiEnvironment = process.env.API_URL;

if (process.env.NODE_ENV === 'production' && !publicApiEnvironment)
  throw new Error('NEXT_PUBLIC_API_URL não configurada');
if (process.env.NODE_ENV === 'production' && !serverApiEnvironment)
  throw new Error('API_URL não configurada');

export const browserApiUrl = apiV1Url(
  publicApiEnvironment ?? 'http://localhost:3001',
);
const serverApiUrl = apiV1Url(
  serverApiEnvironment ?? 'http://localhost:3001',
);

export async function publicApi<T>(
  path: string,
  fallback: T,
  init?: RequestInit,
): Promise<T> {
  try {
    const options: RequestInit =
      init?.cache === 'no-store'
        ? init
        : { ...init, next: { revalidate: 60, ...init?.next } };
    const response = await fetch(`${serverApiUrl}${path}`, options);
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}
export async function clientApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${browserApiUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => ({ message: 'Não foi possível concluir a ação' }))) as {
      message?: string;
    };
    throw new Error(body.message ?? 'Não foi possível concluir a ação');
  }
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}
export const emptyPage: Paginated<Saas> = {
  data: [],
  meta: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
};
export async function getCatalog(query = '') {
  return publicApi<Paginated<Saas>>(`/saas${query}`, emptyPage);
}
export async function getCategories() {
  return publicApi<Category[]>('/categories', []);
}
export function money(cents?: number | null, currency = 'BRL') {
  if (cents === null || cents === undefined) return 'Preço sob consulta';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(
    cents / 100,
  );
}
