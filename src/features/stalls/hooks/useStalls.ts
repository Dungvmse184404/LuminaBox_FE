import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stallApi } from "../api/stallApi";
import type { RentalListParams, StallListParams, StallPayload } from "../types";

export const stallKeys = {
  root: ["stalls"] as const,
  all: ["stalls", "all"] as const,
  list: (params: StallListParams) => ["stalls", "list", params] as const,
  mine: ["stalls", "mine"] as const,
  rentals: (stallId: string, params: RentalListParams) => ["stalls", "rentals", stallId, params] as const,
  myRentals: (params: RentalListParams) => ["stalls", "my-rentals", params] as const,
};

export const useStalls = () => useQuery({ queryKey: stallKeys.all, queryFn: stallApi.listAll });

export const useStallList = (params: StallListParams) =>
  useQuery({ queryKey: stallKeys.list(params), queryFn: () => stallApi.list(params), placeholderData: keepPreviousData });

export const useMyStalls = () => useQuery({ queryKey: stallKeys.mine, queryFn: stallApi.mine });

export const useMyRentals = (params: RentalListParams) =>
  useQuery({ queryKey: stallKeys.myRentals(params), queryFn: () => stallApi.myRentals(params), placeholderData: keepPreviousData });

export const useStallRentals = (stallId: string | null, params: RentalListParams) =>
  useQuery({
    queryKey: stallKeys.rentals(stallId ?? "", params),
    queryFn: () => stallApi.rentals(stallId!, params),
    enabled: Boolean(stallId),
    placeholderData: keepPreviousData,
  });

function useStallMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: stallKeys.root }) });
}

export const useSaveStall = () =>
  useStallMutation(({ id, payload }: { id?: string; payload: StallPayload }) => (id ? stallApi.update(id, payload) : stallApi.create(payload)));

export const useDeleteStall = () => useStallMutation((id: string) => stallApi.remove(id));

export const useTerminateRental = () => useStallMutation((rentalId: string) => stallApi.terminateRental(rentalId));
