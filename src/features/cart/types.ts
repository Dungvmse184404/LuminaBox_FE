export type OrderItemType = "Product" | "Box";

export interface CartItem {
  id: string;
  itemType: OrderItemType;
  organizerId: string;
  organizerBrandName: string;
  stallId: string | null;
  stallName: string | null;
  productItemId: string | null;
  productId: string | null;
  productName: string | null;
  productItemName: string | null;
  boxItemId: string | null;
  boxItemName: string | null;
  boxCapacity: number | null;
  imageUrl: string | null;
  categoryName: string | null;
  fillingName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CartGroup {
  organizerId: string;
  organizerBrandName: string;
  stallId: string | null;
  stallName: string | null;
  groupSubtotal: number;
  items: CartItem[];
}

export interface Cart {
  id: string;
  totalItems: number;
  groups: CartGroup[];
}

export interface AddProductPayload {
  productItemId: string;
  quantity: number;
  stallId: string | null;
}

export interface AddBoxPayload {
  boxItemId: string;
  quantity: number;
  stallId: string | null;
}

export const cartItemName = (item: CartItem) => item.boxItemName ?? item.productName ?? "";

export const cartItemDetail = (item: CartItem) =>
  item.itemType === "Box" ? `Đựng ${item.boxCapacity} bánh` : item.productItemName ?? "";

export const groupLabel = (group: Pick<CartGroup, "organizerBrandName" | "stallName">) =>
  group.stallName ? `${group.organizerBrandName} · ${group.stallName}` : `${group.organizerBrandName} · Kho online`;
