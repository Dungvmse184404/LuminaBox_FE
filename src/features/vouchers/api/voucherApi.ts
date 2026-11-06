import { request } from "@/lib/api";
import type { ClaimedVoucher, Voucher } from "../types";

export const voucherApi = {
  available: async () => {
    const { data } = await request<Voucher[]>("/vouchers/available", { auth: true });
    return data ?? [];
  },

  claimed: async () => {
    const { data } = await request<ClaimedVoucher[]>("/vouchers/my", { auth: true });
    return data ?? [];
  },

  claim: async (id: string) => {
    await request(`/vouchers/${id}/claim`, { method: "POST", auth: true });
  },

  unclaim: async (userVoucherId: string) => {
    await request(`/vouchers/my/${userVoucherId}`, { method: "DELETE", auth: true });
  },
};
