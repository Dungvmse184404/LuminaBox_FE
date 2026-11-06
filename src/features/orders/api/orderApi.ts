import { request } from "@/lib/api";
import type { Paged } from "@/types/api";
import type { BoxCake, CheckoutPayload, Order, OrderListParams, OrderSummary } from "../types";

export const orderApi = {
  mine: async (params: OrderListParams) => {
    const { data } = await request<Paged<OrderSummary>>("/orders/me", { auth: true, query: { ...params } });
    return data!;
  },

  store: async (params: OrderListParams) => {
    const { data } = await request<Paged<OrderSummary>>("/orders/organizer/me", { auth: true, query: { ...params } });
    return data!;
  },

  detail: async (id: string) => {
    const { data } = await request<Order>(`/orders/${id}`, { auth: true });
    return data!;
  },

  fromCart: async (payload: CheckoutPayload) => {
    const { data } = await request<Order[]>("/orders/from-cart", { method: "POST", body: payload, auth: true });
    return data!;
  },

  pay: async (orderId: string) => {
    const { data } = await request<{ checkoutUrl: string }>("/payments/checkout", { method: "POST", body: { orderId }, auth: true });
    return data!.checkoutUrl;
  },

  cancel: async (id: string, reason: string) => {
    await request(`/orders/${id}/cancel`, { method: "PUT", body: { reason }, auth: true });
  },

  reject: async (id: string, reason: string) => {
    await request(`/orders/${id}/reject`, { method: "PUT", body: { reason }, auth: true });
  },

  advance: async (id: string, step: "confirm" | "ship" | "mark-delivered") => {
    await request(`/orders/${id}/${step}`, { method: "PUT", auth: true });
  },

  boxCakes: async (boxItemId: string, stallId: string | null) => {
    const { data } = await request<BoxCake[]>(`/box-items/${boxItemId}/available-products`, { query: { stallId } });
    return data ?? [];
  },
};
