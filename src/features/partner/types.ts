import type { ListParams } from "@/types/api";

export type RegistrationType = "Stall" | "Online";
export type RegistrationStatus =
  | "Pending"
  | "AwaitingConfirmation"
  | "Approved"
  | "Rejected"
  | "Cancelled";

export interface OrganizerRegistrationResponse {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  type: RegistrationType;
  stallId: string | null;
  stallCode: string | null;
  stallName: string | null;
  organizerId: string | null;
  brandName: string;
  contactPhone: string | null;
  businessInfo: string | null;
  startDate: string | null;
  endDate: string | null;
  commissionRate: number | null;
  status: RegistrationStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
}

export interface CreateOrganizerRegistrationRequest {
  type: RegistrationType;
  brandName: string;
  contactPhone: string;
  businessInfo?: string | null;
  stallId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface CreateAdditionalStallsRequest {
  stallIds: string[];
  startDate?: string | null;
  endDate?: string | null;
}

export interface ApproveOrganizerRegistrationRequest {
  commissionRate?: number | null;
}

export interface RejectOrganizerRegistrationRequest {
  rejectReason: string;
}

export interface CancelOrganizerRegistrationRequest {
  cancelReason?: string | null;
}

export interface RegistrationListParams extends ListParams {
  type?: RegistrationType;
  status?: RegistrationStatus;
  stallId?: string;
}

