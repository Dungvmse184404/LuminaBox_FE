import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Boxes, Cake, ChevronRight, ClipboardList, Store, Truck, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/features/auth/AuthContext";
import { formatDateTime, ORDER_STATUS_LABEL, type OrderStatus } from "@/features/orders/types";
import { formatPrice } from "@/features/products/types";
import { errorStatus } from "@/lib/errors";
import { useStoreOverview } from "../hooks/useStoreOverview";

const STATUS_ORDER: OrderStatus[] = ["Pending", "Confirmed", "Delivering", "Delivered", "Cancelled"];

interface TileProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  note?: ReactNode;
  to?: string;
}

function Tile({ icon, label, value, note, to }: TileProps) {
  const body = (
    <Card className="grid h-full gap-1 transition hover:border-primary/40">
      <p className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
        {icon}
        {label}
      </p>
      <div className="font-serif text-2xl font-bold text-ink">{value}</div>
      {note && <p className="text-xs text-ink-muted">{note}</p>}
    </Card>
  );
  return to ? (
    <Link to={to} className="block rounded-card focus-visible:outline-2 focus-visible:outline-primary">
      {body}
    </Link>
  ) : (
    body
  );
}

const count = (value: number | undefined) => (value === undefined ? <Skeleton className="h-7 w-12" /> : value.toLocaleString("vi-VN"));

export function StoreOverviewPage() {
  const { user } = useAuth();
  const { orders, summary, products, boxes, rentals, stalls, recentDays } = useStoreOverview();
  const noRentals = (rentals.isError && errorStatus(rentals.error) === 404) || rentals.data?.items.length === 0;
  const brandName = user?.organizerBrandName ?? orders.data?.[0]?.organizerBrandName ?? rentals.data?.items[0]?.organizerBrandName;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Tổng quan cửa hàng</p>
          <h1 className="break-words font-serif text-2xl font-bold text-ink">{brandName ?? user?.fullName}</h1>
          <p className="mt-1 text-sm text-ink-muted">{user?.email}</p>
        </div>
        {user?.organizerStatus === "Suspended" && <StatusBadge status="Suspended" label="Cửa hàng đang bị tạm khóa" />}
      </div>

      {orders.isError ? (
        <ErrorState message="Không tải được số liệu đơn hàng." onRetry={() => orders.refetch()} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Tile
              icon={<Wallet size={15} />}
              label="Doanh thu đơn đã giao"
              value={summary ? formatPrice(summary.revenue) : <Skeleton className="h-7 w-28" />}
              note={summary && `${formatPrice(summary.recentRevenue)} trong ${recentDays} ngày qua`}
            />
            <Tile
              icon={<ClipboardList size={15} />}
              label="Đơn chờ xác nhận"
              value={count(summary?.byStatus.Pending)}
              note={summary && (summary.byStatus.Pending > 0 ? "Cần xử lý" : "Không có đơn mới")}
              to="/store/orders"
            />
            <Tile
              icon={<Truck size={15} />}
              label="Đơn cần giao"
              value={count(summary ? summary.byStatus.Confirmed + summary.byStatus.Delivering : undefined)}
              note={summary && `${summary.byStatus.Confirmed} chờ giao · ${summary.byStatus.Delivering} đang giao`}
              to="/store/orders"
            />
            <Tile
              icon={<ClipboardList size={15} />}
              label="Tổng số đơn"
              value={count(summary?.total)}
              note={summary && `${summary.recentOrders} đơn trong ${recentDays} ngày qua`}
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Tile
              icon={<Store size={15} />}
              label="Gian đang thuê"
              value={noRentals ? 0 : rentals.isError ? "—" : count(rentals.data ? stalls.active : undefined)}
              note={
                noRentals
                  ? "Chưa thuê gian nào"
                  : rentals.isError
                    ? "Không tải được hợp đồng thuê"
                    : rentals.data && (stalls.upcoming > 0 ? `${stalls.upcoming} gian sắp bắt đầu` : "Xem hợp đồng thuê")
              }
              to="/store/stalls"
            />
            <Tile
              icon={<Cake size={15} />}
              label="Sản phẩm"
              value={products.isError ? "—" : count(products.data)}
              note={products.isError ? "Không tải được" : undefined}
              to="/store/products"
            />
            <Tile
              icon={<Boxes size={15} />}
              label="Hộp quà"
              value={boxes.isError ? "—" : count(boxes.data)}
              note={boxes.isError ? "Không tải được" : undefined}
              to="/store/boxes"
            />
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <Card>
              <h2 className="mb-3 font-semibold text-ink">Đơn theo trạng thái</h2>
              {summary ? (
                <ul className="grid gap-2 text-sm">
                  {STATUS_ORDER.map((status) => (
                    <li key={status} className="flex items-center justify-between gap-3">
                      <StatusBadge status={status} label={ORDER_STATUS_LABEL[status]} />
                      <span className="font-semibold tabular-nums text-ink">{summary.byStatus[status]}</span>
                    </li>
                  ))}
                  {summary.cancelRate !== null && (
                    <li className="mt-1 border-t border-line pt-2 text-xs text-ink-muted">
                      Tỷ lệ hủy {Math.round(summary.cancelRate * 100)}% trên các đơn đã kết thúc
                    </li>
                  )}
                </ul>
              ) : (
                <Skeleton className="h-32 w-full" />
              )}
            </Card>

            <Card>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-semibold text-ink">Đơn gần đây</h2>
                <Link to="/store/orders" className="flex items-center text-sm font-semibold text-primary hover:underline">
                  Xem tất cả <ChevronRight size={15} />
                </Link>
              </div>
              {!summary ? (
                <Skeleton className="h-32 w-full" />
              ) : summary.recent.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-muted">Chưa có đơn hàng nào.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {summary.recent.map((order) => (
                    <li key={order.id}>
                      <Link to={`/store/orders/${order.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 hover:text-primary">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-ink">{order.orderCode}</p>
                          <p className="truncate text-xs text-ink-muted">
                            {order.buyerName} · {formatDateTime(order.createdAt)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-ink">{formatPrice(order.totalAmount)}</span>
                        <StatusBadge status={order.status} label={ORDER_STATUS_LABEL[order.status]} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <p className="mt-4 text-xs text-ink-muted">Doanh thu tính trên đơn đã giao: tiền hàng trừ giảm giá của cửa hàng, chưa trừ hoa hồng sàn.</p>
        </>
      )}
    </>
  );
}
