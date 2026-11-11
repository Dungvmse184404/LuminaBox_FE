import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, uploadApi, type UploadPurpose } from "../api/uploadApi";

const BY_CODE: Record<string, string> = {
  "E20.2": "Tài khoản này không được tải loại ảnh này lên.",
  "E20.3": "Chỉ nhận ảnh JPG, PNG hoặc WEBP.",
  "E20.4": "Ảnh vượt quá dung lượng cho phép (5 MB).",
  "E20.5": "Máy chủ chưa cấu hình kho ảnh. Hãy báo quản trị viên.",
  "E20.6": "Kho ảnh đang lỗi, thử lại sau.",
};

export function checkImageFile(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return `"${file.name}" không phải ảnh JPG, PNG hoặc WEBP.`;
  if (file.size > MAX_IMAGE_BYTES) return `"${file.name}" lớn hơn 5 MB.`;
  return null;
}

export function uploadError(error: unknown) {
  if (error instanceof ApiError && BY_CODE[error.code]) return BY_CODE[error.code];
  return errorMessage(error, "Không tải được ảnh lên.");
}

export const useUploadImage = (purpose: UploadPurpose) =>
  useMutation({
    mutationFn: async (file: File) => {
      const result = await uploadApi.upload(purpose, file);
      return result.url ?? result.path;
    },
  });
