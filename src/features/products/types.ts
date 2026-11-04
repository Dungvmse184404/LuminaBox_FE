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
  id: string;
  organizerId: string;
  organizerBrandName: string;
  name: string;
  description: string | null;
  items: ProductItem[];
}

export interface ProductListParams extends ListParams {
  categoryId?: string;
  fillingId?: string;
}

export interface ShippingFeePayload {
  organizerId: string;
  stallId: string | null;
  addressId: string;
  items: { productItemId: string; quantity: number }[];
  boxes: [];
}

export interface ShippingFee {
  fee: number;
  weightGrams: number;
}

export const formatPrice = (value: number) => `${value.toLocaleString("vi-VN")} ₫`;

export function unitPrice(item: ProductItem, quantity: number) {
  const tier = [...item.priceTiers].reverse().find((t) => quantity >= t.minQuantity);
  return tier?.unitPrice ?? item.price;
}
