import { request } from "@/lib/api";
import type { PriceTier } from "@/features/products/types";
import type { Paged } from "@/types/api";
import type { BoxPayload, CatalogListParams, CatalogStatus, MyBox, MyProduct, MyVariant, ProductPayload, StockPayload, VariantPayload } from "../types";

export type CatalogKind = "product-items" | "box-items";

export const catalogApi = {
  products: async (params: CatalogListParams) => {
    const { data } = await request<Paged<MyProduct>>("/products/me", { auth: true, query: { ...params } });
    return data!;
  },

  saveProduct: async (id: string | undefined, payload: ProductPayload) => {
    const { data } = await request<MyProduct>(id ? `/products/${id}` : "/products", { method: id ? "PUT" : "POST", body: payload, auth: true });
    return data!;
  },

  productStatus: async (id: string, status: CatalogStatus) => {
    await request(`/products/${id}/status`, { method: "PUT", body: { status }, auth: true });
  },

  removeProduct: async (id: string) => {
    await request(`/products/${id}`, { method: "DELETE", auth: true });
  },

  saveVariant: async (productId: string, id: string | undefined, payload: VariantPayload) => {
    const { data } = await request<MyVariant>(id ? `/product-items/${id}` : `/products/${productId}/items`, {
      method: id ? "PUT" : "POST",
      body: payload,
      auth: true,
    });
    return data!;
  },

  removeVariant: async (id: string) => {
    await request(`/product-items/${id}`, { method: "DELETE", auth: true });
  },

  boxes: async (params: CatalogListParams) => {
    const { data } = await request<Paged<MyBox>>("/box-items/me", { auth: true, query: { ...params } });
    return data!;
  },

  saveBox: async (id: string | undefined, payload: BoxPayload) => {
    const { data } = await request<MyBox>(id ? `/box-items/${id}` : "/box-items", { method: id ? "PUT" : "POST", body: payload, auth: true });
    return data!;
  },

  boxStatus: async (id: string, status: CatalogStatus) => {
    await request(`/box-items/${id}/status`, { method: "PUT", body: { status }, auth: true });
  },

  removeBox: async (id: string) => {
    await request(`/box-items/${id}`, { method: "DELETE", auth: true });
  },

  addImage: async (kind: CatalogKind, id: string, url: string) => {
    await request(`/${kind}/${id}/images`, { method: "POST", body: { url }, auth: true });
  },

  removeImage: async (kind: CatalogKind, id: string, imageId: string) => {
    await request(`/${kind}/${id}/images/${imageId}`, { method: "DELETE", auth: true });
  },

  setTiers: async (kind: CatalogKind, id: string, tiers: PriceTier[]) => {
    await request(`/${kind}/${id}/price-tiers`, { method: "PUT", body: tiers, auth: true });
  },

  setStocks: async (kind: CatalogKind, id: string, stocks: StockPayload[]) => {
    await request(`/${kind}/${id}/stocks`, { method: "PUT", body: stocks, auth: true });
  },
};
