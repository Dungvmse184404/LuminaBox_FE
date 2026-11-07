import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartKeys } from "@/features/cart/hooks/useCart";
import { voucherKeys } from "@/features/vouchers/hooks/useVouchers";
import { orderApi } from "../api/orderApi";
import type { OrderListParams } from "../types";

export const orderKeys = {
  all: ["orders"] as const,
  mine: (params: OrderListParams) => ["orders", "mine", params] as const,
  store: (params: OrderListParams) => ["orders", "store", params] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
};

export const useMyOrders = (params: OrderListParams) =>
  useQuery({ queryKey: orderKeys.mine(params), queryFn: () => orderApi.mine(params), placeholderData: keepPreviousData });

export const useStoreOrders = (params: OrderListParams) =>
  useQuery({ queryKey: orderKeys.store(params), queryFn: () => orderApi.store(params), placeholderData: keepPreviousData });

export const useOrder = (id: string) => useQuery({ queryKey: orderKeys.detail(id), queryFn: () => orderApi.detail(id) });

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: orderApi.fromCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.mine });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: voucherKeys.all });
    },
  });
}

export const usePayOrder = () => useMutation({ mutationFn: orderApi.pay });

function useOrderAction<T>(mutationFn: (variables: T) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export const useCancelOrder = () => useOrderAction(({ id, reason }: { id: string; reason: string }) => orderApi.cancel(id, reason));

export const useRejectOrder = () => useOrderAction(({ id, reason }: { id: string; reason: string }) => orderApi.reject(id, reason));

export const useAdvanceOrder = () =>
  useOrderAction(({ id, step }: { id: string; step: "confirm" | "ship" | "mark-delivered" }) => orderApi.advance(id, step));
