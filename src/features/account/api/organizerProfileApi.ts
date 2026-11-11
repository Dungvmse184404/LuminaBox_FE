import { request } from "@/lib/api";

export interface OrganizerProfile {
  id: string;
  brandName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  businessInfo: string | null;
  status: "Active" | "Suspended";
  approvedAt: string | null;
  suspendReason: string | null;
  suspendedAt: string | null;
  createdAt: string;
}

export interface OrganizerProfilePayload {
  brandName: string;
  contactPhone: string;
  contactEmail: string;
  businessInfo: string;
}

export const organizerProfileApi = {
  mine: async () => {
    const { data } = await request<OrganizerProfile>("/organizers/me", { auth: true });
    return data!;
  },

  update: async (payload: OrganizerProfilePayload) => {
    const { data } = await request<OrganizerProfile>("/organizers/me", { method: "PUT", body: payload, auth: true });
    return data!;
  },
};
