import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { productApi } from "../api/productApi";
import type { ListParams } from "@/types/api";
import type { ProductListParams } from "../types";

export const productKeys = {
  list: (params: ProductListParams) => ["products", "list", params] as const,
  detail: (id: string) => ["products", "detail", id] as const,
};

export const useProducts = (params: ProductListParams, enabled = true) =>
  useQuery({ queryKey: productKeys.list(params), queryFn: () => productApi.list(params), placeholderData: keepPreviousData, enabled });

export const useProduct = (id: string) => useQuery({ queryKey: productKeys.detail(id), queryFn: () => productApi.detail(id) });

export const useBoxes = (params: ListParams) =>
  useQuery({ queryKey: ["box-items", params], queryFn: () => productApi.boxes(params), placeholderData: keepPreviousData });

export const useFillings = () => useQuery({ queryKey: ["fillings"], queryFn: productApi.fillings, staleTime: 300000 });

export const useShippingFee = () => useMutation({ mutationFn: productApi.shippingFee });
