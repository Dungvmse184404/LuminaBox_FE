import { isRouteErrorResponse } from "react-router-dom";
import { ApiError } from "@/lib/api";

export function errorStatus(error: unknown): number {
  if (isRouteErrorResponse(error)) return error.status;
  if (error instanceof ApiError) return error.status;
  return 500;
}

export function errorMessage(error: unknown, fallback = "Đã có lỗi xảy ra."): string {
  if (error instanceof ApiError) return error.message;
  if (isRouteErrorResponse(error)) return error.statusText || fallback;
  if (error instanceof Error) return error.message;
  return fallback;
}
