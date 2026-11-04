import { fetchAllPages, request } from "@/lib/api";
import type { Address, AddressPayload, AddressType, Location } from "../types";

export const addressApi = {
  mine: async (type: AddressType) => {
    const { data } = await request<Address[]>("/addresses/me", { auth: true, query: { type } });
    return data ?? [];
  },

  create: async (payload: AddressPayload) => {
    const { data } = await request<Address>("/addresses", { method: "POST", body: payload, auth: true });
    return data!;
  },

  update: async (id: string, { type: _type, isDefault: _isDefault, ...payload }: AddressPayload) => {
    const { data } = await request<Address>(`/addresses/${id}`, { method: "PUT", body: payload, auth: true });
    return data!;
  },

  setDefault: async (id: string) => {
    await request(`/addresses/${id}/default`, { method: "PUT", auth: true });
  },

  remove: async (id: string) => {
    await request(`/addresses/${id}`, { method: "DELETE", auth: true });
  },

  provinces: () => fetchAllPages<Location>("/provinces"),
  districts: (provinceId: string) => fetchAllPages<Location>(`/provinces/${provinceId}/districts`),
  wards: (districtId: string) => fetchAllPages<Location>(`/districts/${districtId}/wards`),
};
