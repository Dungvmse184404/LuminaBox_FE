import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "../api/cartApi";
import type { AddBoxPayload, AddProductPayload, Cart } from "../types";

export const cartKeys = { mine: ["cart"] as const };

export const useCart = (enabled = true) => useQuery({ queryKey: cartKeys.mine, queryFn: cartApi.mine, enabled });

function useCartMutation<T>(mutationFn: (variables: T) => Promise<Cart>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: (cart) => queryClient.setQueryData(cartKeys.mine, cart) });
}

export const useAddProductToCart = () => useCartMutation((payload: AddProductPayload) => cartApi.addProduct(payload));

export const useAddBoxToCart = () => useCartMutation((payload: AddBoxPayload) => cartApi.addBox(payload));

export const useUpdateCartQuantity = () =>
  useCartMutation(({ itemId, quantity }: { itemId: string; quantity: number }) => cartApi.updateQuantity(itemId, quantity));

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.mine }),
  });
}
