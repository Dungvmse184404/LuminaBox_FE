import { useState } from "react";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, SkeletonRows } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/features/auth/AuthContext";
import { authApi } from "@/features/auth/api/authApi";
import { refreshTokens } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { useCancelRegistration, useConfirmRegistration, useMyRegistrations } from "../hooks/usePartner";
import type { OrganizerRegistrationResponse } from "../types";

const STATUS_LABELS: Record<string, string> = {
  Pending: "Đang chờ duyệt",
  AwaitingConfirmation: "Chờ bạn xác nhận hoa hồng",
  Approved: "Đã duyệt",
  Rejected: "Đã từ chối",
  Cancelled: "Đã hủy",
};

export function MyRegistrations({ onCreate }: { onCreate: () => void }) {
  const { setUser } = useAuth();
  const toast = useToast();
  const { data, isLoading } = useMyRegistrations();
  const confirmRegistration = useConfirmRegistration();
  const cancelRegistration = useCancelRegistration();
  const [cancelItem, setCancelItem] = useState<OrganizerRegistrationResponse | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const confirm = async (item: OrganizerRegistrationResponse) => {
    try {
      await confirmRegistration.mutateAsync(item.id);
      toast.success(`Đã xác nhận mức hoa hồng ${item.commissionRate}%.`);
      await refreshTokens()
        .then(() => authApi.me())
        .then(setUser)
        .catch(() => undefined);
    } catch (error) {
      toast.error(errorMessage(error, "Không thể xác nhận hoa hồng."));
    }
  };

  const cancel = async () => {
    if (!cancelItem) return;
    try {
      await cancelRegistration.mutateAsync({ id: cancelItem.id, payload: { cancelReason: cancelReason.trim() || null } });
      toast.success("Đã hủy đơn đăng ký.");
      setCancelItem(null);
      setCancelReason("");
    } catch (error) {
      toast.error(errorMessage(error, "Không thể hủy đơn đăng ký."));
    }
  };

  if (isLoading) return <SkeletonRows rows={3} />;

  if (!data || data.items.length === 0) {
    return <EmptyState title="Bạn chưa có đơn đăng ký nào" action={<Button onClick={onCreate}>Tạo đơn đăng ký</Button>} />;
  }

  return (
    <>
      <div className="grid gap-4">
        {data.items.map((item) => (
          <Card key={item.id} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-serif text-base font-bold text-ink">{item.brandName}</span>
                <span className="rounded bg-cream-dark px-2 py-0.5 text-xs font-medium text-ink-soft">{item.type === "Stall" ? "Thuê quầy" : "Bán online"}</span>
                {item.stallName && <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{item.stallName}</span>}
              </div>
              <StatusBadge status={item.status} label={STATUS_LABELS[item.status] ?? item.status} />
            </div>

            <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-ink-muted">Số điện thoại</p>
                <p className="font-semibold text-ink">{item.contactPhone || "—"}</p>
              </div>
              <div>
                <p className="text-ink-muted">Gửi lúc</p>
                <p className="font-semibold text-ink">{formatDateTime(item.createdAt)}</p>
              </div>
              <div>
                <p className="text-ink-muted">Hoa hồng</p>
                <p className="font-semibold text-ink">
                  {item.type === "Stall" ? "Không áp dụng" : item.commissionRate !== null ? `${item.commissionRate}%` : "Chờ quản trị viên đề xuất"}
                </p>
              </div>
              <div>
                <p className="text-ink-muted">Thời gian thuê</p>
                <p className="font-semibold text-ink">{item.startDate && item.endDate ? `${item.startDate} → ${item.endDate}` : "—"}</p>
              </div>
            </div>

            {item.businessInfo && <p className="rounded-lg bg-cream/40 p-3 text-xs text-ink-soft">{item.businessInfo}</p>}

            {item.status === "AwaitingConfirmation" && item.commissionRate !== null && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3.5 text-xs">
                <p className="flex items-center gap-1.5 font-bold text-ink">
                  <AlertCircle size={15} className="text-warning" /> Quản trị viên đã duyệt với mức hoa hồng {item.commissionRate}%
                </p>
                <div className="flex gap-2">
                  <Button size="sm" loading={confirmRegistration.isPending} onClick={() => confirm(item)}>
                    <CheckCircle2 size={14} /> Đồng ý hoa hồng
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCancelItem(item)}>
                    Hủy đơn
                  </Button>
                </div>
              </div>
            )}

            {item.status === "Rejected" && item.rejectReason && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                <strong>Lý do từ chối: </strong>
                {item.rejectReason}
              </p>
            )}

            {item.status === "Cancelled" && item.cancelReason && (
              <p className="rounded-lg border border-line bg-cream-dark p-3 text-xs text-ink-muted">
                <strong>Lý do hủy: </strong>
                {item.cancelReason}
              </p>
            )}

            {item.status === "Pending" && (
              <div className="flex justify-end">
                <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => setCancelItem(item)}>
                  <XCircle size={14} /> Hủy đơn
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal
        open={Boolean(cancelItem)}
        title="Hủy đơn đăng ký"
        onClose={() => setCancelItem(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelItem(null)}>
              Quay lại
            </Button>
            <Button variant="danger" loading={cancelRegistration.isPending} onClick={cancel}>
              Hủy đơn
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">
            Hủy đơn đăng ký của <strong>{cancelItem?.brandName}</strong>?
          </p>
          <Textarea label="Lý do (không bắt buộc)" rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}
