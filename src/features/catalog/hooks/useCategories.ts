import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListParams } from "@/types/api";
import { lookupApi } from "../api/lookupApi";
import type { LookupKind, LookupPayload } from "../types";

const ROOT: Record<LookupKind, string> = { category: "categories", filling: "fillings" };

export const lookupKeys = {
  all: (kind: LookupKind) => [ROOT[kind]] as const,
  list: (kind: LookupKind, params: ListParams) => [ROOT[kind], "list", params] as const,
};

export const categoryKeys = {
  all: lookupKeys.all("category"),
  list: (params: ListParams) => lookupKeys.list("category", params),
};

export const useLookups = (kind: LookupKind, params: ListParams) =>
  useQuery({ queryKey: lookupKeys.list(kind, params), queryFn: () => lookupApi.list(kind, params), placeholderData: keepPreviousData });

export const useCategories = (params: ListParams) => useLookups("category", params);

export function useSaveLookup(kind: LookupKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: LookupPayload }) =>
      id ? lookupApi.update(kind, id, payload) : lookupApi.create(kind, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: lookupKeys.all(kind) }),
  });
}

export function useDeleteLookup(kind: LookupKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lookupApi.remove(kind, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: lookupKeys.all(kind) }),
  });
}
