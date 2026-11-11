import { fetchAllPages, request } from "@/lib/api";
import type { Paged } from "@/types/api";
import type { RentalListParams, Stall, StallDetail, StallListParams, StallPayload, StallRental } from "../types";

export const stallApi = {
  listAll: () => fetchAllPages<Stall>("/stalls"),

  list: async (params: StallListParams) => {
    const { data } = await request<Paged<StallDetail>>("/stalls", { query: { ...params } });
    return data!;
  },

  create: async (payload: StallPayload) => {
    const { data } = await request<StallDetail>("/stalls", { method: "POST", body: payload, auth: true });
    return data!;
  },

  update: async (id: string, payload: StallPayload) => {
    const { data } = await request<StallDetail>(`/stalls/${id}`, { method: "PUT", body: payload, auth: true });
    return data!;
  },

  remove: async (id: string) => {
    await request(`/stalls/${id}`, { method: "DELETE", auth: true });
  },

  mine: async () => {
    const { data } = await request<StallDetail[]>("/stalls/me", { auth: true });
    return data ?? [];
  },

  rentals: async (stallId: string, params: RentalListParams) => {
    const { data } = await request<Paged<StallRental>>(`/stalls/${stallId}/rentals`, { query: { ...params }, auth: true });
    return data!;
  },

  myRentals: async (params: RentalListParams) => {
    const { data } = await request<Paged<StallRental>>("/stall-rentals/me", { query: { ...params }, auth: true });
    return data!;
  },

  terminateRental: async (rentalId: string) => {
    await request(`/stall-rentals/${rentalId}/terminate`, { method: "PUT", auth: true });
  },
};
