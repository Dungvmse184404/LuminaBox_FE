import { request } from "@/lib/api";
import type { AddBoxPayload, AddProductPayload, Cart } from "../types";

export const cartApi = {
  mine: async () => {
    const { data } = await request<Cart>("/carts/me", { auth: true });
    return data!;
  },

  addProduct: async (payload: AddProductPayload) => {
    const { data } = await request<Cart>("/carts/items/product", { method: "POST", body: payload, auth: true });
    return data!;
  },

  addBox: async (payload: AddBoxPayload) => {
    const { data } = await request<Cart>("/carts/items/box", { method: "POST", body: payload, auth: true });
    return data!;
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    const { data } = await request<Cart>(`/carts/items/${itemId}`, { method: "PUT", body: { quantity }, auth: true });
    return data!;
  },

  remove: async (itemId: string) => {
    await request(`/carts/items/${itemId}`, { method: "DELETE", auth: true });
  },
};
