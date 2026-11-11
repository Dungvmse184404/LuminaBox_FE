import { request } from "@/lib/api";

export type UploadPurpose = "ProductImage" | "BoxImage" | "FeedbackImage" | "EventImage" | "BannerImage" | "RegistrationDocument";

export interface UploadResult {
  path: string;
  url: string | null;
  isPrivate: boolean;
  contentType: string;
  size: number;
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const uploadApi = {
  upload: async (purpose: UploadPurpose, file: File) => {
    const form = new FormData();
    form.append("purpose", purpose);
    form.append("file", file);
    const { data } = await request<UploadResult>("/uploads", { method: "POST", body: form, auth: true });
    return data!;
  },
};
