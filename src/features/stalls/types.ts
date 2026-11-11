import type { ListParams } from "@/types/api";

export type StallStatus = "Available" | "Rented";

export interface StallBooking {
  startDate: string;
  endDate: string | null;
}

export interface Stall {
  id: string;
  code: string;
  name: string;
  provinceName: string;
  districtName: string;
  wardName: string;
  addressLine: string;
  rentalPrice: number;
  description: string | null;
  status: StallStatus;
  latitude: number | null;
  longitude: number | null;
  bookings: StallBooking[];
}

export type RentalStatus = "Confirmed" | "Active" | "Expired" | "Terminated";

export const STALL_STATUS_LABEL: Record<StallStatus, string> = { Available: "Đang trống", Rented: "Đang cho thuê" };

export const RENTAL_STATUS_LABEL: Record<RentalStatus, string> = {
  Confirmed: "Sắp bắt đầu",
  Active: "Đang thuê",
  Expired: "Đã hết hạn",
  Terminated: "Đã chấm dứt",
};

export interface StallDetail {
  id: string;
  code: string;
  name: string;
  provinceId: string;
  provinceName: string;
  districtId: string;
  districtName: string;
  wardId: string;
  wardName: string;
  addressLine: string;
  rentalPrice: number;
  description: string | null;
  status: StallStatus;
  latitude: number | null;
  longitude: number | null;
}

export interface StallPayload {
  code: string;
  name: string;
  wardId: string;
  addressLine: string;
  rentalPrice: number;
  description?: string;
  latitude?: number;
  longitude?: number;
}

export interface StallRental {
  id: string;
  stallId: string;
  stallCode: string;
  stallName: string;
  organizerBrandName: string;
  organizerEmail: string;
  startDate: string;
  endDate: string | null;
  status: RentalStatus;
  createdAt: string;
}

export interface StallListParams extends ListParams {
  status?: StallStatus;
}

export interface RentalListParams extends ListParams {
  status?: RentalStatus;
}

export const stallAddress = (stall: Pick<StallDetail, "addressLine" | "wardName" | "districtName" | "provinceName">) =>
  [stall.addressLine, stall.wardName, stall.districtName, stall.provinceName].filter(Boolean).join(", ");

export function formatDay(iso: string | null) {
  if (!iso) return "Không thời hạn";
  const [year, month, date] = iso.slice(0, 10).split("-");
  return `${date}/${month}/${year}`;
}
