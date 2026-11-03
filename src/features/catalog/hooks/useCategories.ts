import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListParams } from "@/types/api";
import { categoryApi } from "../api/categoryApi";
import type { CategoryPayload } from "../types";

export const categoryKeys = {
  all: ["categories"] as const,
  list: (params: ListParams) => ["categories", "list", params] as const,
};

export const useCategories = (params: ListParams) =>
  useQuery({ queryKey: categoryKeys.list(params), queryFn: () => categoryApi.list(params), placeholderData: keepPreviousData });

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CategoryPayload) => categoryApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}
