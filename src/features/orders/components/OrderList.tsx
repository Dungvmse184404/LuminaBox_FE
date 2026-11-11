import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Pager } from "@/components/ui/Pager";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPrice } from "@/features/products/types";
import { cn } from "@/lib/cn";
import type { Paged } from "@/types/api";
import { formatDateTime, ORDER_FILTERS, ORDER_STATUS_LABEL, paymentLabel, type OrderStatus, type OrderSummary } from "../types";

interface Props {
  data: Paged<OrderSummary> | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  status: OrderStatus | "";
  onStatusChange: (status: OrderStatus | "") => void;
  onPageChange: (page: number) => void;
  linkPrefix: string;
  showBuyer?: boolean;
}

export function OrderList({ data, isLoading, isError, onRetry, status, onStatusChange, onPageChange, linkPrefix, showBuyer }: Props) {
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {ORDER_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            aria-pressed={status === filter.value}
            onClick={() => onStatusChange(filter.value)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition",
              status === filter.value ? "border-primary bg-primary text-white" : "border-line bg-card text-ink-soft hover:border-primary hover:text-primary",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <ErrorState message="Không tải được đơn hàng." onRetry={onRetry} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="Chưa có đơn hàng" />
      ) : (
        <Card flush className="divide-y divide-line">
          {data.items.map((order) => (
            <Link key={order.id} to={`${linkPrefix}/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-cream/50">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{order.orderCode}</p>
                <p className="break-words text-sm text-ink-muted">
                  {showBuyer ? order.buyerName : order.organizerBrandName} · {order.itemCount} sản phẩm · {formatDateTime(order.createdAt)}
                </p>
                <p className="text-xs text-ink-muted">{paymentLabel(order.paymentMethod, order.paymentStatus, order.status)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-primary">{formatPrice(order.totalAmount)}</span>
                <StatusBadge status={order.status} label={ORDER_STATUS_LABEL[order.status]} />
              </div>
            </Link>
          ))}
        </Card>
      )}

      {data && <Pager page={data} onChange={onPageChange} />}
    </>
  );
}
