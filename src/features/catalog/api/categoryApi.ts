import { request } from "@/lib/api";
import type { ListParams, Paged } from "@/types/api";
import type { Category, CategoryPayload } from "../types";

export const categoryApi = {
  list: async (params: ListParams) => {
    const { data } = await request<Paged<Category>>("/cake-categories", { query: { ...params } });
    return data!;
  },

  create: async (payload: CategoryPayload) => {
    const { data } = await request<Category>("/cake-categories", { method: "POST", body: payload, auth: true });
    return data!;
  },
};
