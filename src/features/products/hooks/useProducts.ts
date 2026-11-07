import { useMemo } from "react";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import type { AutocompleteOption } from "@/components/ui/Autocomplete";
import { productApi } from "../api/productApi";
import type { ListParams } from "@/types/api";
import type { ProductListParams } from "../types";

export const productKeys = {
  list: (params: ProductListParams) => ["products", "list", params] as const,
  detail: (id: string) => ["products", "detail", id] as const,
};

export const useProducts = (params: ProductListParams, enabled = true) =>
  useQuery({ queryKey: productKeys.list(params), queryFn: () => productApi.list(params), placeholderData: keepPreviousData, enabled });

const SUGGESTION_QUERY = { pageSize: 50 };

export function useProductSuggestions(): AutocompleteOption[] {
  const { data } = useProducts(SUGGESTION_QUERY);
  return useMemo(() => {
    const byName = new Map<string, AutocompleteOption>();
    data?.items.forEach((product) => byName.set(product.name, { id: product.id, name: product.name, hint: product.organizerBrandName }));
    return [...byName.values()];
  }, [data]);
}

export const useProduct = (id: string) => useQuery({ queryKey: productKeys.detail(id), queryFn: () => productApi.detail(id) });

export const useBoxes = (params: ListParams) =>
  useQuery({ queryKey: ["box-items", params], queryFn: () => productApi.boxes(params), placeholderData: keepPreviousData });

export const useFillings = () => useQuery({ queryKey: ["fillings"], queryFn: productApi.fillings, staleTime: 300000 });

export const useShippingFee = () => useMutation({ mutationFn: productApi.shippingFee });
