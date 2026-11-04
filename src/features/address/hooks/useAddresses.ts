import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addressApi } from "../api/addressApi";
import type { AddressPayload, AddressType } from "../types";

export const addressKeys = {
  all: ["addresses"] as const,
  mine: (type: AddressType) => ["addresses", type] as const,
};

export const useAddresses = (type: AddressType, enabled = true) =>
  useQuery({ queryKey: addressKeys.mine(type), queryFn: () => addressApi.mine(type), enabled });

export const useProvinces = () =>
  useQuery({ queryKey: ["locations", "provinces"], queryFn: addressApi.provinces, staleTime: Infinity });

export const useDistricts = (provinceId: string) =>
  useQuery({
    queryKey: ["locations", "districts", provinceId],
    queryFn: () => addressApi.districts(provinceId),
    enabled: Boolean(provinceId),
    staleTime: Infinity,
  });

export const useWards = (districtId: string) =>
  useQuery({
    queryKey: ["locations", "wards", districtId],
    queryFn: () => addressApi.wards(districtId),
    enabled: Boolean(districtId),
    staleTime: Infinity,
  });

export function useSaveAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: AddressPayload }) =>
      id ? addressApi.update(id, payload) : addressApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addressApi.setDefault,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addressApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  });
}
