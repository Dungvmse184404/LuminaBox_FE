import type { PriceTier, ProductImage, Stock } from "@/features/products/types";
import type { ListParams } from "@/types/api";

export type CatalogStatus = "Draft" | "Active" | "Inactive";

export const CATALOG_STATUS_LABEL: Record<CatalogStatus, string> = { Draft: "Nháp", Active: "Đang bán", Inactive: "Ngừng bán" };

export const CATALOG_STATUS_TONE: Record<CatalogStatus, "neutral" | "success" | "danger"> = {
  Draft: "neutral",
  Active: "success",
  Inactive: "danger",
};

export interface MyVariant {
  id: string;
  productId: string;
  categoryId: string;
  categoryName: string;
  fillingId: string;
  fillingName: string;
  name: string;
  eggCount: number;
  weight: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  price: number;
  images: ProductImage[];
  priceTiers: PriceTier[];
  stocks: Stock[];
}

export interface MyProduct {
  id: string;
  name: string;
  description: string | null;
  status: CatalogStatus;
  createdAt: string;
  items: MyVariant[];
}

export interface MyBox {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  weight: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  price: number;
  status: CatalogStatus;
  images: ProductImage[];
  priceTiers: PriceTier[];
  stocks: Stock[];
}

export interface CatalogListParams extends ListParams {
  status?: CatalogStatus;
}

export interface ProductPayload {
  name: string;
  description?: string;
}

export interface Dimensions {
  weight: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  price: number;
}

export interface VariantPayload extends Dimensions {
  categoryId: string;
  fillingId: string;
  name?: string;
  eggCount: number;
  imageUrls?: string[];
}

export interface BoxPayload extends Dimensions {
  name: string;
  description?: string;
  capacity: number;
  imageUrls?: string[];
}

export interface StockPayload {
  stallId: string | null;
  stockQuantity: number;
  isActive: boolean;
}

export const totalStock = (stocks: Stock[]) => stocks.filter((s) => s.isActive).reduce((sum, s) => sum + s.stockQuantity, 0);
