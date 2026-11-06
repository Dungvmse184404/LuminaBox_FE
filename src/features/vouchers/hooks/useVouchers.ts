import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { voucherApi } from "../api/voucherApi";

export const voucherKeys = {
  all: ["vouchers"] as const,
  available: ["vouchers", "available"] as const,
  claimed: ["vouchers", "claimed"] as const,
};

export const useAvailableVouchers = () => useQuery({ queryKey: voucherKeys.available, queryFn: voucherApi.available });

export const useClaimedVouchers = () => useQuery({ queryKey: voucherKeys.claimed, queryFn: voucherApi.claimed });

export function useClaimVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: voucherApi.claim,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: voucherKeys.all }),
  });
}

export function useUnclaimVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: voucherApi.unclaim,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: voucherKeys.all }),
  });
}
