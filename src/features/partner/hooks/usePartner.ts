import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partnerApi } from "../api/partnerApi";
import type {
  ApproveOrganizerRegistrationRequest,
  CancelOrganizerRegistrationRequest,
  CreateAdditionalStallsRequest,
  CreateOrganizerRegistrationRequest,
  RegistrationListParams,
  RejectOrganizerRegistrationRequest,
} from "../types";

export const partnerKeys = {
  all: ["partner"] as const,
  my: (params?: RegistrationListParams) => ["partner", "me", params] as const,
  adminAll: (params?: RegistrationListParams) => ["partner", "adminAll", params] as const,
  detail: (id: string) => ["partner", "detail", id] as const,
};

export const useMyRegistrations = (params?: RegistrationListParams, enabled = true) =>
  useQuery({
    queryKey: partnerKeys.my(params),
    queryFn: () => partnerApi.getMyRegistrations(params),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useRegistrationDetail = (id: string, enabled = true) =>
  useQuery({
    queryKey: partnerKeys.detail(id),
    queryFn: () => partnerApi.getDetail(id),
    enabled: Boolean(id) && enabled,
  });

export const useAllRegistrations = (params?: RegistrationListParams, enabled = true) =>
  useQuery({
    queryKey: partnerKeys.adminAll(params),
    queryFn: () => partnerApi.getAll(params),
    placeholderData: keepPreviousData,
    enabled,
  });

export function useCreateOrganizerRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrganizerRegistrationRequest) => partnerApi.createRegistration(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}

export function useConfirmRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partnerApi.confirmRegistration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}

export function useCancelRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: CancelOrganizerRegistrationRequest }) =>
      partnerApi.cancelRegistration(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}

export function useCreateAdditionalStalls() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdditionalStallsRequest) => partnerApi.createAdditionalStalls(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}

export function useCreateAdditionalOnline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => partnerApi.createAdditionalOnline(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}

export function useApproveRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: ApproveOrganizerRegistrationRequest }) =>
      partnerApi.approve(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}

export function useRejectRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectOrganizerRegistrationRequest }) =>
      partnerApi.reject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all });
    },
  });
}

