import { request } from "@/lib/api";
import type { Paged } from "@/types/api";
import type { Product, ProductListParams, ProductSummary, ShippingFee, ShippingFeePayload } from "../types";

export const productApi = {
  list: async (params: ProductListParams) => {
    const { data } = await request<Paged<ProductSummary>>("/products", { query: { ...params } });
    return data!;
  },

  detail: async (id: string) => {
    const { data } = await request<Product>(`/products/${id}`);
    return data!;
  },

  fillings: async () => {
    const { data } = await request<Paged<{ id: string; name: string }>>("/fillings", { query: { pageSize: 50 } });
    return data!.items;
  },

  shippingFee: async (payload: ShippingFeePayload) => {
    const { data } = await request<ShippingFee>("/shipping/fee-estimate", { method: "POST", body: payload, auth: true });
    return data!;
  },
};
