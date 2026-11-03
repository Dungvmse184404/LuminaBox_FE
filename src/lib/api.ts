import { env } from "@/lib/env";

const TOKEN_KEY = "luminabox.tokens";

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = String(status)) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ApiEnvelope<T> {
  isSuccess: boolean;
  value?: { code: string; message: string; data?: T } | null;
  error?: { code: string; message: string } | null;
}

export interface ApiResponse<T> {
  message: string;
  data: T | undefined;
}

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  query?: Record<string, QueryValue>;
}

export function loadTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: Tokens | null) {
  try {
    if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    return;
  }
}

async function parse<T>(response: Response): Promise<ApiResponse<T>> {
  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }

  if (!response.ok || !body?.isSuccess) {
    const message =
      body?.error?.message ??
      (response.status === 401 ? "Phiên đăng nhập đã hết hạn." : "Không thể kết nối tới máy chủ.");
    throw new ApiError(message, response.status, body?.error?.code);
  }

  return { message: body.value?.message ?? "", data: body.value?.data };
}

function withQuery(path: string, query: RequestOptions["query"]): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function fetchOrThrow(input: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new ApiError("Không thể kết nối tới máy chủ.", 0, "NETWORK_ERROR");
  }
}

let refreshing: Promise<Tokens | null> | null = null;

export async function refreshTokens(): Promise<Tokens | null> {
  const current = loadTokens();
  if (!current) return null;

  refreshing ??= fetchOrThrow(`${env.apiBase}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: current.refreshToken }),
  })
    .then((res) => parse<Tokens>(res))
    .then(({ data }) => {
      saveTokens(data ?? null);
      return data ?? null;
    })
    .catch(() => {
      saveTokens(null);
      return null;
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

export async function request<T = undefined>(
  path: string,
  { method = "GET", body, auth = false, query }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const url = withQuery(path, query);

  if (env.useMock) {
    const { handleMock } = await import("@/mocks/server");
    return handleMock<T>(method, url, body);
  }

  const isForm = body instanceof FormData;
  const send = (tokens: Tokens | null) =>
    fetchOrThrow(`${env.apiBase}${url}`, {
      method,
      headers: {
        ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
        ...(auth && tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });

  let response = await send(loadTokens());

  if (auth && response.status === 401) {
    const renewed = await refreshTokens();
    if (renewed) response = await send(renewed);
  }

  return parse<T>(response);
}
