export type StallStatus = "Available" | "Rented";

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
}
