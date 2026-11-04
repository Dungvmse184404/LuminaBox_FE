import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { productApi } from "../api/productApi";
import type { ProductListParams } from "../types";

export const productKeys = {
  list: (params: ProductListParams) => ["products", "list", params] as const,
  detail: (id: string) => ["products", "detail", id] as const,
};

export const useProducts = (params: ProductListParams) =>
  useQuery({ queryKey: productKeys.list(params), queryFn: () => productApi.list(params), placeholderData: keepPreviousData });

export const useProduct = (id: string) => useQuery({ queryKey: productKeys.detail(id), queryFn: () => productApi.detail(id) });

export const useFillings = () => useQuery({ queryKey: ["fillings"], queryFn: productApi.fillings, staleTime: 300000 });

export const useShippingFee = () => useMutation({ mutationFn: productApi.shippingFee });
