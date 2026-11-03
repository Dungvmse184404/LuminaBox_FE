import { ApiError, type ApiResponse } from "@/lib/api";
import type { ListParams, Paged } from "@/types/api";

interface MockContext {
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
}

type Handler = (ctx: MockContext) => unknown | Promise<unknown>;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: Handler;
  message: string;
}

const routes: Route[] = [];

export function mock(method: string, path: string, handler: Handler, message = "") {
  const keys: string[] = [];
  const source = path
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/:(\w+)/g, (_, key: string) => {
      keys.push(key);
      return "([^/]+)";
    });
  routes.push({ method, pattern: new RegExp(`^${source}$`), keys, handler, message });
}

export const mockError = (status: number, message: string) => new ApiError(message, status);

export const newId = () => crypto.randomUUID();

export function paginate<T>(all: T[], query: URLSearchParams): Paged<T> {
  const pageSize = Number(query.get("pageSize")) || 10;
  const pageIndex = Math.max(1, Number(query.get("page")) || 1);
  const start = (pageIndex - 1) * pageSize;
  return {
    items: all.slice(start, start + pageSize),
    totalCount: all.length,
    pageIndex,
    pageSize,
    totalPages: Math.max(1, Math.ceil(all.length / pageSize)),
  };
}

export const listParams = (query: URLSearchParams): ListParams => ({
  search: query.get("search") ?? undefined,
  sortBy: query.get("sortBy") ?? undefined,
  isDescending: query.get("isDescending") !== "false",
  page: Number(query.get("page")) || 1,
  pageSize: Number(query.get("pageSize")) || 10,
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let registered: Promise<unknown> | null = null;

export async function handleMock<T>(method: string, url: string, body: unknown): Promise<ApiResponse<T>> {
  registered ??= import("@/mocks/handlers");
  await registered;
  await sleep(120 + Math.random() * 180);

  const [path, qs = ""] = url.split("?");
  for (const route of routes) {
    if (route.method !== method) continue;
    const match = route.pattern.exec(path);
    if (!match) continue;

    const params = Object.fromEntries(route.keys.map((key, i) => [key, decodeURIComponent(match[i + 1])]));
    const data = await route.handler({ params, query: new URLSearchParams(qs), body });
    return { message: route.message, data: data as T };
  }

  throw new ApiError(`No mock handler for ${method} ${path}`, 404);
}
