import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addressApi } from "../api/addressApi";
import type { AddressPayload, AddressType } from "../types";

export const addressKeys = {
  all: ["addresses"] as const,
  mine: (type: AddressType) => ["addresses", type] as const,
};

export const useAddresses = (type: AddressType, enabled = true) =>
  useQuery({ queryKey: addressKeys.mine(type), queryFn: () => addressApi.mine(type), enabled });

export const locationQueries = {
  provinces: () => ({ queryKey: ["locations", "provinces"], queryFn: addressApi.provinces, staleTime: Infinity }),
  districts: (provinceId: string) => ({
    queryKey: ["locations", "districts", provinceId],
    queryFn: () => addressApi.districts(provinceId),
    staleTime: Infinity,
  }),
  wards: (districtId: string) => ({
    queryKey: ["locations", "wards", districtId],
    queryFn: () => addressApi.wards(districtId),
    staleTime: Infinity,
  }),
};

export const useProvinces = () => useQuery(locationQueries.provinces());

export const useDistricts = (provinceId: string) => useQuery({ ...locationQueries.districts(provinceId), enabled: Boolean(provinceId) });

export const useWards = (districtId: string) => useQuery({ ...locationQueries.wards(districtId), enabled: Boolean(districtId) });

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
