import type { ListParams } from "@/types/api";

export type OrderStatus = "Pending" | "Confirmed" | "Delivering" | "Delivered" | "Cancelled";
export type PaymentMethod = "Stripe" | "CashOnDelivery";
export type PaymentStatus = "Pending" | "Success" | "Failed" | "Cancelled" | "Refunded";

export interface OrderSummary {
  id: string;
  orderCode: string;
  buyerName: string;
  organizerBrandName: string;
  stallName: string | null;
  receiverName: string;
  totalAmount: number;
  itemCount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus | null;
  createdAt: string;
}

export interface OrderBoxSelection {
  id: string;
  productName: string;
  categoryName: string;
  fillingName: string;
  quantity: number;
}

export interface OrderLine {
  id: string;
  itemType: "Product" | "Box";
  productName: string | null;
  boxItemName: string | null;
  categoryName: string | null;
  fillingName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  boxSelections: OrderBoxSelection[];
}

export interface OrderHistory {
  id: string;
  toStatus: OrderStatus;
  changedAt: string;
}

export interface Order {
  id: string;
  orderCode: string;
  buyerName: string;
  organizerBrandName: string;
  stallName: string | null;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string | null;
  note: string | null;
  subtotalAmount: number;
  platformDiscount: number;
  organizerDiscount: number;
  shippingFee: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  cancelReason: string | null;
  payment: { method: PaymentMethod; status: PaymentStatus } | null;
  items: OrderLine[];
  statusHistories: OrderHistory[];
}

export interface OrderListParams extends ListParams {
  status?: OrderStatus;
}

export interface CheckoutPayload {
  paymentMethod: PaymentMethod;
  note?: string;
  cartItemIds: string[];
  voucherIds: string[];
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Delivering: "Đang giao",
  Delivered: "Đã giao",
  Cancelled: "Đã hủy",
};

export const ORDER_FILTERS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  ...(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((value) => ({ value, label: ORDER_STATUS_LABEL[value] })),
];

export function paymentLabel(method: PaymentMethod | null | undefined, status: PaymentStatus | null | undefined, orderStatus: OrderStatus) {
  if (method === "CashOnDelivery") return status === "Success" ? "Đã thu tiền mặt" : "Thanh toán khi nhận hàng";
  if (status === "Success") return orderStatus === "Cancelled" ? "Đang hoàn tiền" : "Đã thanh toán";
  if (status === "Refunded") return "Đã hoàn tiền";
  if (status === "Pending") return "Chờ thanh toán";
  return "Thanh toán đã hủy";
}

export const canPayOrder = (order: Pick<Order, "status" | "payment">) =>
  order.status === "Pending" && order.payment?.method === "Stripe" && order.payment.status === "Pending";

export const canBuyerCancel = (order: Pick<Order, "status" | "payment">) =>
  order.status === "Pending" && !(order.payment?.method === "Stripe" && order.payment.status === "Success");

export const formatDateTime = (value: string) => new Date(value).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
