import { request } from "@/lib/api";
import type { Paged } from "@/types/api";
import type {
  ApproveOrganizerRegistrationRequest,
  CancelOrganizerRegistrationRequest,
  CreateAdditionalStallsRequest,
  CreateOrganizerRegistrationRequest,
  OrganizerRegistrationResponse,
  RegistrationListParams,
  RejectOrganizerRegistrationRequest,
} from "../types";

export const partnerApi = {
  createRegistration: async (payload: CreateOrganizerRegistrationRequest) => {
    const { data } = await request<OrganizerRegistrationResponse>("/organizer-registrations", {
      method: "POST",
      body: payload,
      auth: true,
    });
    return data!;
  },

  getMyRegistrations: async (params?: RegistrationListParams) => {
    const { data } = await request<Paged<OrganizerRegistrationResponse>>("/organizer-registrations/me", {
      query: params as Record<string, string | number | boolean | undefined>,
      auth: true,
    });
    return data!;
  },

  confirmRegistration: async (id: string) => {
    const { data } = await request<OrganizerRegistrationResponse>(`/organizer-registrations/${id}/confirm`, {
      method: "PUT",
      auth: true,
    });
    return data!;
  },

  cancelRegistration: async (id: string, payload?: CancelOrganizerRegistrationRequest) => {
    const { data } = await request<OrganizerRegistrationResponse>(`/organizer-registrations/${id}/cancel`, {
      method: "PUT",
      body: payload,
      auth: true,
    });
    return data!;
  },

  createAdditionalStalls: async (payload: CreateAdditionalStallsRequest) => {
    const { data } = await request<OrganizerRegistrationResponse[]>("/organizer-registrations/additional-stalls", {
      method: "POST",
      body: payload,
      auth: true,
    });
    return data!;
  },

  createAdditionalOnline: async () => {
    const { data } = await request<OrganizerRegistrationResponse>("/organizer-registrations/additional-online", {
      method: "POST",
      auth: true,
    });
    return data!;
  },

  getAll: async (params?: RegistrationListParams) => {
    const { data } = await request<Paged<OrganizerRegistrationResponse>>("/organizer-registrations", {
      query: params as Record<string, string | number | boolean | undefined>,
      auth: true,
    });
    return data!;
  },

  getDetail: async (id: string) => {
    const { data } = await request<OrganizerRegistrationResponse>(`/organizer-registrations/${id}`, {
      auth: true,
    });
    return data!;
  },

  approve: async (id: string, payload?: ApproveOrganizerRegistrationRequest) => {
    const { data } = await request<OrganizerRegistrationResponse>(`/organizer-registrations/${id}/approve`, {
      method: "PUT",
      body: payload,
      auth: true,
    });
    return data!;
  },

  reject: async (id: string, payload: RejectOrganizerRegistrationRequest) => {
    const { data } = await request<OrganizerRegistrationResponse>(`/organizer-registrations/${id}/reject`, {
      method: "PUT",
      body: payload,
      auth: true,
    });
    return data!;
  },
};

