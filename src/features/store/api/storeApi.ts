import { fetchAllPages, request } from "@/lib/api";
import type { OrderSummary } from "@/features/orders/types";
import type { Paged } from "@/types/api";

const countOf = async (path: string) => {
  const { data } = await request<Paged<unknown>>(path, { auth: true, query: { page: 1, pageSize: 1 } });
  return data?.totalCount ?? 0;
};

export const storeApi = {
  allOrders: () => fetchAllPages<OrderSummary>("/orders/organizer/me", { sortBy: "createdAt", isDescending: true }, true),
  productCount: () => countOf("/products/me"),
  boxCount: () => countOf("/box-items/me"),
};
