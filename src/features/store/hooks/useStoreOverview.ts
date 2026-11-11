import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { OrderStatus, OrderSummary } from "@/features/orders/types";
import { useMyRentals } from "@/features/stalls/hooks/useStalls";
import { storeApi } from "../api/storeApi";

const RECENT_DAYS = 30;
const RENTAL_QUERY = { page: 1, pageSize: 50 };

export const storeKeys = {
  orders: ["store", "overview", "orders"] as const,
  products: ["store", "overview", "products"] as const,
  boxes: ["store", "overview", "boxes"] as const,
};

const netRevenue = (order: OrderSummary) => order.subtotalAmount - order.organizerDiscount;

export function summarizeOrders(orders: OrderSummary[], now = Date.now()) {
  const byStatus: Record<OrderStatus, number> = { Pending: 0, Confirmed: 0, Delivering: 0, Delivered: 0, Cancelled: 0 };
  const recentFrom = now - RECENT_DAYS * 86400000;
  let revenue = 0;
  let recentRevenue = 0;
  let recentOrders = 0;
  for (const order of orders) {
    byStatus[order.status] += 1;
    const created = new Date(order.createdAt).getTime();
    if (created >= recentFrom) recentOrders += 1;
    if (order.status !== "Delivered") continue;
    revenue += netRevenue(order);
    if (created >= recentFrom) recentRevenue += netRevenue(order);
  }
  const closed = byStatus.Delivered + byStatus.Cancelled;
  return {
    total: orders.length,
    byStatus,
    revenue,
    recentRevenue,
    recentOrders,
    cancelRate: closed > 0 ? byStatus.Cancelled / closed : null,
    recent: orders.slice(0, 5),
  };
}

export function useStoreOverview() {
  const orders = useQuery({ queryKey: storeKeys.orders, queryFn: storeApi.allOrders });
  const products = useQuery({ queryKey: storeKeys.products, queryFn: storeApi.productCount });
  const boxes = useQuery({ queryKey: storeKeys.boxes, queryFn: storeApi.boxCount });
  const rentals = useMyRentals(RENTAL_QUERY);

  const summary = useMemo(() => (orders.data ? summarizeOrders(orders.data) : null), [orders.data]);
  const stalls = useMemo(() => {
    const items = rentals.data?.items ?? [];
    return { active: items.filter((r) => r.status === "Active").length, upcoming: items.filter((r) => r.status === "Confirmed").length };
  }, [rentals.data]);

  return { orders, summary, products, boxes, rentals, stalls, recentDays: RECENT_DAYS };
}
