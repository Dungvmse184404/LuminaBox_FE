export type AddressType = "Shipping" | "Pickup";

export interface Address {
  id: string;
  type: AddressType;
  contactName: string;
  phone: string;
  provinceId: string;
  provinceName: string;
  districtId: string;
  districtName: string;
  wardId: string;
  wardName: string;
  addressLine: string;
  isDefault: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface AddressPayload {
  type: AddressType;
  contactName: string;
  phone: string;
  wardId: string;
  addressLine: string;
  isDefault: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface Location {
  id: string;
  name: string;
}

export const fullAddress = (address: Address) =>
  [address.addressLine, address.wardName, address.districtName, address.provinceName].join(", ");
