import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { formatDiscount, formatPrice } from "@/features/products/types";
import { errorMessage } from "@/lib/errors";
import { useAdvanceOrder, useCancelOrder, useOrder, usePayOrder, useRejectOrder } from "../hooks/useOrders";
import { canBuyerCancel, canPayOrder, formatDateTime, ORDER_STATUS_LABEL, paymentLabel, type Order } from "../types";

type ReasonAction = "cancel" | "reject";

const REASON_TITLE: Record<ReasonAction, string> = { cancel: "Hủy đơn hàng", reject: "Từ chối đơn hàng" };

export function OrderDetailPage({ store = false }: { store?: boolean }) {
  const { id = "" } = useParams();
  const toast = useToast();
  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const cancel = useCancelOrder();
  const reject = useRejectOrder();
  const advance = useAdvanceOrder();
  const pay = usePayOrder();
  const [reasonAction, setReasonAction] = useState<ReasonAction | null>(null);
  const [reason, setReason] = useState("");

  const runStep = async (step: "confirm" | "ship" | "mark-delivered", message: string) => {
    try {
      await advance.mutateAsync({ id, step });
      toast.success(message);
    } catch (error) {
      toast.error(errorMessage(error, "Không cập nhật được đơn hàng."));
    }
  };

  const submitReason = async () => {
    try {
      if (reasonAction === "reject") await reject.mutateAsync({ id, reason: reason.trim() });
      else await cancel.mutateAsync({ id, reason: reason.trim() });
      toast.success(reasonAction === "reject" ? "Đã từ chối đơn hàng." : "Đã hủy đơn hàng.");
      setReasonAction(null);
      setReason("");
    } catch (error) {
      toast.error(errorMessage(error, "Không cập nhật được đơn hàng."));
    }
  };

  const payNow = async () => {
    try {
      window.location.assign(await pay.mutateAsync(id));
    } catch (error) {
      toast.error(errorMessage(error, "Không mở được trang thanh toán."));
    }
  };

  if (isLoading) return <SkeletonRows />;
  if (isError) return <ErrorState message="Không tải được đơn hàng." onRetry={() => refetch()} />;
  if (!order) return <EmptyState title="Không tìm thấy đơn hàng" />;

  const stripeUnpaid = order.payment?.method === "Stripe" && order.payment.status !== "Success";

  return (
    <>
      <Link to={store ? "/store/orders" : "/orders"} className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-primary">
        <ChevronLeft size={16} /> Đơn hàng
      </Link>

      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">{order.orderCode}</h1>
          <p className="text-sm text-ink-muted">
            {order.organizerBrandName}
            {order.stallName ? ` · ${order.stallName}` : ""} · {formatDateTime(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} label={ORDER_STATUS_LABEL[order.status]} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 gap-4">
          <Card className="divide-y divide-line p-0">
            {order.items.map((line) => (
              <div key={line.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0 break-words font-medium text-ink">
                    {line.boxItemName ?? line.productName} × {line.quantity}
                  </span>
                  <span className="shrink-0 font-semibold text-ink">{formatPrice(line.subtotal)}</span>
                </div>
                {line.itemType === "Product" ? (
                  <p className="text-xs text-ink-muted">
                    {line.categoryName} · {line.fillingName}
                  </p>
                ) : (
                  line.boxSelections.map((selection) => (
                    <p key={selection.id} className="text-xs text-ink-muted">
                      {selection.productName} · {selection.categoryName} · {selection.fillingName} × {selection.quantity}
                    </p>
                  ))
                )}
              </div>
            ))}
          </Card>

          <Card className="grid gap-1 text-sm text-ink-soft">
            <h2 className="mb-1 font-semibold text-ink">Giao đến</h2>
            <p>
              {order.receiverName} · {order.receiverPhone}
            </p>
            <p className="break-words">{order.shippingAddress}</p>
            {order.note && <p className="break-words text-ink-muted">Ghi chú: {order.note}</p>}
            {order.cancelReason && <p className="break-words text-danger">Lý do hủy: {order.cancelReason}</p>}
          </Card>

          <Card>
            <h2 className="mb-2 font-semibold text-ink">Lịch sử</h2>
            <ol className="grid gap-1 text-sm text-ink-soft">
              {order.statusHistories.map((history) => (
                <li key={history.id} className="flex justify-between gap-3">
                  <span>{ORDER_STATUS_LABEL[history.toStatus]}</span>
                  <span className="text-ink-muted">{formatDateTime(history.changedAt)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <Card className="grid gap-3">
          <div className="grid gap-1 text-sm text-ink-soft">
            <Row label="Tiền hàng" value={formatPrice(order.subtotalAmount)} />
            <Row label="Giảm giá" value={formatDiscount(order.platformDiscount + order.organizerDiscount)} />
            <Row label="Phí giao hàng" value={formatPrice(order.shippingFee)} />
          </div>
          <div className="flex justify-between border-t border-line pt-2 font-semibold text-ink">
            <span>Tổng cộng</span>
            <span className="text-primary">{formatPrice(order.totalAmount)}</span>
          </div>
          <p className="text-sm text-ink-soft">{paymentLabel(order.payment?.method, order.payment?.status, order.status)}</p>

          {store ? (
            <StoreActions
              order={order}
              stripeUnpaid={stripeUnpaid}
              busy={advance.isPending}
              onStep={runStep}
              onReason={setReasonAction}
            />
          ) : (
            <>
              {canPayOrder(order) && (
                <Button loading={pay.isPending} onClick={payNow}>
                  Thanh toán ngay
                </Button>
              )}
              {canBuyerCancel(order) && (
                <Button variant="outline" onClick={() => setReasonAction("cancel")}>
                  Hủy đơn
                </Button>
              )}
            </>
          )}
        </Card>
      </div>

      <Modal
        open={reasonAction !== null}
        title={reasonAction ? REASON_TITLE[reasonAction] : ""}
        onClose={() => setReasonAction(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setReasonAction(null)}>
              Đóng
            </Button>
            <Button
              variant="danger"
              loading={cancel.isPending || reject.isPending}
              disabled={reasonAction === "reject" && !reason.trim()}
              onClick={submitReason}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        <Textarea label="Lý do" rows={3} maxLength={500} required={reasonAction === "reject"} value={reason} onChange={(event) => setReason(event.target.value)} />
      </Modal>
    </>
  );
}

interface StoreActionsProps {
  order: Order;
  stripeUnpaid: boolean;
  busy: boolean;
  onStep: (step: "confirm" | "ship" | "mark-delivered", message: string) => void;
  onReason: (action: ReasonAction) => void;
}

function StoreActions({ order, stripeUnpaid, busy, onStep, onReason }: StoreActionsProps) {
  if (order.status === "Pending") {
    return (
      <>
        <Button loading={busy} disabled={stripeUnpaid} onClick={() => onStep("confirm", "Đã xác nhận đơn hàng.")}>
          Xác nhận đơn
        </Button>
        {stripeUnpaid && <p className="text-xs text-ink-muted">Khách chưa thanh toán.</p>}
        <Button variant="outline" onClick={() => onReason("reject")}>
          Từ chối
        </Button>
      </>
    );
  }

  if (order.status === "Confirmed") {
    return (
      <>
        <Button loading={busy} onClick={() => onStep("ship", "Đã chuyển sang đang giao.")}>
          Bắt đầu giao
        </Button>
        <Button variant="outline" onClick={() => onReason("cancel")}>
          Hủy đơn
        </Button>
      </>
    );
  }

  if (order.status === "Delivering") {
    return (
      <Button loading={busy} onClick={() => onStep("mark-delivered", "Đã giao thành công.")}>
        Đã giao xong
      </Button>
    );
  }

  return null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
