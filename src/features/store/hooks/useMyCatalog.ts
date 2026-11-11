import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PriceTier } from "@/features/products/types";
import { catalogApi, type CatalogKind } from "../api/catalogApi";
import type { CatalogListParams, CatalogStatus, StockPayload } from "../types";

export const catalogKeys = {
  products: (params: CatalogListParams) => ["store", "products", params] as const,
  boxes: (params: CatalogListParams) => ["store", "boxes", params] as const,
};

export const useMyProducts = (params: CatalogListParams) =>
  useQuery({ queryKey: catalogKeys.products(params), queryFn: () => catalogApi.products(params), placeholderData: keepPreviousData });

export const useMyBoxes = (params: CatalogListParams) =>
  useQuery({ queryKey: catalogKeys.boxes(params), queryFn: () => catalogApi.boxes(params), placeholderData: keepPreviousData });

function useCatalogMutation<T, R>(mutationFn: (input: T) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["store"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["box-items"] });
    },
  });
}

export const useSaveProduct = () =>
  useCatalogMutation(({ id, payload }: { id?: string; payload: Parameters<typeof catalogApi.saveProduct>[1] }) => catalogApi.saveProduct(id, payload));

export const useProductStatus = () => useCatalogMutation(({ id, status }: { id: string; status: CatalogStatus }) => catalogApi.productStatus(id, status));

export const useRemoveProduct = () => useCatalogMutation((id: string) => catalogApi.removeProduct(id));

export const useSaveVariant = () =>
  useCatalogMutation(({ productId, id, payload }: { productId: string; id?: string; payload: Parameters<typeof catalogApi.saveVariant>[2] }) =>
    catalogApi.saveVariant(productId, id, payload),
  );

export const useRemoveVariant = () => useCatalogMutation((id: string) => catalogApi.removeVariant(id));

export const useSaveBox = () =>
  useCatalogMutation(({ id, payload }: { id?: string; payload: Parameters<typeof catalogApi.saveBox>[1] }) => catalogApi.saveBox(id, payload));

export const useBoxStatus = () => useCatalogMutation(({ id, status }: { id: string; status: CatalogStatus }) => catalogApi.boxStatus(id, status));

export const useRemoveBox = () => useCatalogMutation((id: string) => catalogApi.removeBox(id));

export const useAddImage = (kind: CatalogKind) => useCatalogMutation(({ id, url }: { id: string; url: string }) => catalogApi.addImage(kind, id, url));

export const useRemoveImage = (kind: CatalogKind) =>
  useCatalogMutation(({ id, imageId }: { id: string; imageId: string }) => catalogApi.removeImage(kind, id, imageId));

export const useSetTiers = (kind: CatalogKind) =>
  useCatalogMutation(({ id, tiers }: { id: string; tiers: PriceTier[] }) => catalogApi.setTiers(kind, id, tiers));

export const useSetStocks = (kind: CatalogKind) =>
  useCatalogMutation(({ id, stocks }: { id: string; stocks: StockPayload[] }) => catalogApi.setStocks(kind, id, stocks));
