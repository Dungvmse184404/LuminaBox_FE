import type { ListParams } from "@/types/api";

export interface ProductSummary {
  id: string;
  organizerId: string;
  organizerBrandName: string;
  name: string;
  description: string | null;
  itemCount: number;
  minPrice: number | null;
  thumbnailUrl: string | null;
}

export interface ProductImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface PriceTier {
  minQuantity: number;
  unitPrice: number;
}

export interface Stock {
  id: string;
  stallId: string | null;
  stallName: string | null;
  stallAddress: string | null;
  stockQuantity: number;
  isActive: boolean;
}

export interface ProductItem {
  id: string;
  categoryName: string;
  fillingName: string;
  name: string;
  eggCount: number;
  weight: number;
  price: number;
  images: ProductImage[];
  priceTiers: PriceTier[];
  stocks: Stock[];
}

export interface Product {
  organizerBusinessInfo: string | null;
  organizerContactPhone: string | null;
  id: string;
  organizerId: string;
  organizerBrandName: string;
  name: string;
  description: string | null;
  items: ProductItem[];
}

export interface FilterTag {
  id: string;
  name: string;
  organizerId?: string | null;
  organizerBrandName?: string | null;
}

export interface FilterShop {
  id: string;
  name: string;
}

export interface BoxItem {
  id: string;
  organizerBrandName: string;
  name: string;
  capacity: number;
  price: number;
  images: ProductImage[];
  stocks: Stock[];
}

export interface ProductListParams extends ListParams {
  categoryId?: string;
  fillingId?: string;
  organizerId?: string;
}

export interface ShippingFeePayload {
  organizerId: string;
  stallId: string | null;
  addressId: string;
  items: { productItemId: string; quantity: number }[];
  boxes: { boxItemId: string; selections: { productItemId: string; quantity: number }[] }[];
}

export interface ShippingFee {
  fee: number;
  weightGrams: number;
}

export const formatPrice = (value: number) => `${value.toLocaleString("vi-VN")} ₫`;

export const formatDiscount = (value: number) => (value > 0 ? `-${formatPrice(value)}` : formatPrice(0));

export function unitPrice(item: ProductItem, quantity: number) {
  const tier = [...item.priceTiers].reverse().find((t) => quantity >= t.minQuantity);
  return tier?.unitPrice ?? item.price;
}
