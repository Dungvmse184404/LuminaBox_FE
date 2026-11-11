import { useState } from "react";
import {
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { Pager } from "@/components/ui/Pager";
import { EmptyState, SkeletonRows } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { useStalls } from "@/features/stalls/hooks/useStalls";
import { ApiError } from "@/lib/api";
import { formatShortDateTime } from "@/lib/format";
import {
  useAllRegistrations,
  useApproveRegistration,
  useRejectRegistration,
} from "../hooks/usePartner";
import type {
  OrganizerRegistrationResponse,
  RegistrationStatus,
  RegistrationType,
} from "../types";

const STATUS_LABELS: Record<string, string> = {
  Pending: "Chờ duyệt",
  AwaitingConfirmation: "Chờ xác nhận hoa hồng",
  Approved: "Đã duyệt",
  Rejected: "Đã từ chối",
  Cancelled: "Đã hủy",
};

export function AdminRegistrationsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<RegistrationType | "">("");
  const [status, setStatus] = useState<RegistrationStatus | "">("");
  const [stallId, setStallId] = useState("");

  const { data: stalls = [] } = useStalls();
  const { data, isLoading, refetch } = useAllRegistrations({
    page,
    pageSize: 10,
    search: search.trim() || undefined,
    type: type || undefined,
    status: status || undefined,
    stallId: stallId || undefined,
  });

  const approveMutation = useApproveRegistration();
  const rejectMutation = useRejectRegistration();

  const [selectedItem, setSelectedItem] = useState<OrganizerRegistrationResponse | null>(null);
  const [approveModalItem, setApproveModalItem] = useState<OrganizerRegistrationResponse | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [rejectModalItem, setRejectModalItem] = useState<OrganizerRegistrationResponse | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async () => {
    if (!approveModalItem) return;
    if (approveModalItem.type === "Online" && (commissionRate <= 0 || commissionRate > 100)) {
      toast.error("Vui lòng nhập tỷ lệ hoa hồng hợp lệ (1 - 100%).");
      return;
    }

    try {
      await approveMutation.mutateAsync({
        id: approveModalItem.id,
        payload: approveModalItem.type === "Online" ? { commissionRate } : undefined,
      });
      toast.success("Đã phê duyệt đơn đăng ký thành công!");
      setApproveModalItem(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không thể duyệt đơn.");
    }
  };

  const handleReject = async () => {
    if (!rejectModalItem) return;
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối.");
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: rejectModalItem.id,
        payload: { rejectReason: rejectReason.trim() },
      });
      toast.success("Đã từ chối đơn đăng ký thành công.");
      setRejectModalItem(null);
      setRejectReason("");
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không thể từ chối đơn.");
    }
  };

  return (
    <div className="lb-page-enter space-y-6">
      <PageHeader
        title="Quản Lý Đơn Đăng Ký Đối Tác"
        description="Xét duyệt đơn đăng ký mở gian hàng thực tế hoặc bán hàng trực tuyến toàn sàn LuminaBox."
      />

      <Card className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Tìm kiếm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tên thương hiệu, người nộp..."
          />

          <Select
            label="Hình thức kinh doanh"
            value={type}
            onChange={(e) => {
              setType(e.target.value as RegistrationType | "");
              setPage(1);
            }}
          >
            <option value="">-- Tất cả hình thức --</option>
            <option value="Stall">Thuê gian hàng (Stall)</option>
            <option value="Online">Bán trực tuyến (Online)</option>
          </Select>

          <Select
            label="Trạng thái đơn"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as RegistrationStatus | "");
              setPage(1);
            }}
          >
            <option value="">-- Tất cả trạng thái --</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="AwaitingConfirmation">Chờ xác nhận hoa hồng</option>
            <option value="Approved">Đã duyệt</option>
            <option value="Rejected">Đã từ chối</option>
            <option value="Cancelled">Đã hủy</option>
          </Select>

          <Select
            label="Lọc theo Gian hàng"
            value={stallId}
            onChange={(e) => {
              setStallId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">-- Tất cả gian hàng --</option>
            {stalls.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <SkeletonRows rows={5} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Không có đơn đăng ký nào"
          description="Hiện tại không tìm thấy đơn đăng ký nào phù hợp với bộ lọc."
        />
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-line bg-card">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-cream/60 font-semibold text-ink-muted">
                <tr>
                  <th className="p-3">Thương hiệu</th>
                  <th className="p-3">Người nộp</th>
                  <th className="p-3">Hình thức</th>
                  <th className="p-3">Ngày gửi</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="sticky right-0 border-l border-line bg-[color-mix(in_oklab,var(--color-cream)_60%,var(--color-card))] py-3 pl-3 pr-4 text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.items.map((item) => (
                  <tr key={item.id} className="group hover:bg-cream/30">
                    <td className="p-3 font-semibold text-ink">
                      <div>{item.brandName}</div>
                      <div className="text-[11px] text-ink-muted">{item.contactPhone}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-ink">{item.userFullName}</div>
                      {item.userEmail !== item.userFullName && (
                        <div className="text-[11px] text-ink-muted">
                          {item.userEmail}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="inline-block whitespace-nowrap rounded bg-cream-dark px-2 py-0.5 font-medium text-ink-soft">
                        {item.type === "Stall" ? "Thuê gian" : "Online"}
                      </span>
                      {item.stallCode && (
                        <div className="mt-1 whitespace-nowrap text-[11px] font-semibold text-primary">
                          {item.stallCode}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap p-3 text-ink-muted">
                      {formatShortDateTime(item.createdAt)}
                    </td>
                    <td className="p-3">
                      <StatusBadge
                        status={item.status}
                        label={STATUS_LABELS[item.status] ?? item.status}
                      />
                      {item.commissionRate !== null && (
                        <div className="mt-1 whitespace-nowrap text-[11px] text-ink-muted">
                          Hoa hồng {item.commissionRate}%
                        </div>
                      )}
                    </td>
                    <td className="sticky right-0 border-l border-line bg-card py-3 pl-3 pr-4 group-hover:bg-[color-mix(in_oklab,var(--color-cream)_30%,var(--color-card))]">
                      <div className="flex min-w-max items-center justify-end gap-1.5 whitespace-nowrap">
                        {item.status === "Pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setApproveModalItem(item);
                                setCommissionRate(10);
                              }}
                            >
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setRejectModalItem(item);
                                setRejectReason("");
                              }}
                            >
                              Từ chối
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Xem chi tiết"
                          aria-label={`Xem đơn của ${item.brandName}`}
                          onClick={() => setSelectedItem(item)}
                        >
                          <Eye size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pager page={data} onChange={setPage} />
        </div>
      )}

      {/* Modal xem chi tiết */}
      <Modal
        open={Boolean(selectedItem)}
        title="Chi Tiết Đơn Đăng Ký Đối Tác"
        onClose={() => setSelectedItem(null)}
        footer={
          <Button variant="outline" onClick={() => setSelectedItem(null)}>
            Đóng
          </Button>
        }
      >
        {selectedItem && (
          <div className="space-y-4 text-xs">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-ink-muted">Tên thương hiệu</p>
                <p className="font-bold text-sm text-ink">{selectedItem.brandName}</p>
              </div>
              <div>
                <p className="text-ink-muted">Hình thức</p>
                <p className="font-bold text-sm text-primary">
                  {selectedItem.type === "Stall" ? "Thuê gian hàng thực tế" : "Bán trực tuyến (Online)"}
                </p>
              </div>
              <div>
                <p className="text-ink-muted">Người nộp</p>
                <p className="font-medium text-ink">{selectedItem.userFullName} ({selectedItem.userEmail})</p>
              </div>
              <div>
                <p className="text-ink-muted">Số điện thoại liên hệ</p>
                <p className="font-medium text-ink">{selectedItem.contactPhone || "—"}</p>
              </div>
              {selectedItem.stallCode && (
                <div>
                  <p className="text-ink-muted">Gian hàng đăng ký</p>
                  <p className="font-medium text-ink">{selectedItem.stallCode} - {selectedItem.stallName}</p>
                </div>
              )}
              {selectedItem.startDate && (
                <div>
                  <p className="text-ink-muted">Thời gian thuê</p>
                  <p className="font-medium text-ink">{selectedItem.startDate} → {selectedItem.endDate}</p>
                </div>
              )}
              <div>
                <p className="text-ink-muted">Tỷ lệ hoa hồng</p>
                <p className="font-bold text-ink">
                  {selectedItem.commissionRate !== null ? `${selectedItem.commissionRate}%` : "Chưa áp dụng"}
                </p>
              </div>
              <div>
                <p className="text-ink-muted">Trạng thái hiện tại</p>
                <StatusBadge
                  status={selectedItem.status}
                  label={STATUS_LABELS[selectedItem.status] ?? selectedItem.status}
                />
              </div>
            </div>

            {selectedItem.businessInfo && (
              <div className="rounded-lg bg-cream/40 p-3">
                <p className="font-semibold text-ink mb-1">Giới thiệu kinh doanh:</p>
                <p className="text-ink-soft whitespace-pre-wrap">{selectedItem.businessInfo}</p>
              </div>
            )}

            {selectedItem.rejectReason && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-danger">
                <p className="font-semibold">Lý do từ chối:</p>
                <p>{selectedItem.rejectReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Duyệt đơn */}
      <Modal
        open={Boolean(approveModalItem)}
        title="Duyệt Đơn Đăng Ký Đối Tác"
        onClose={() => setApproveModalItem(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setApproveModalItem(null)}>
              Hủy
            </Button>
            <Button
              loading={approveMutation.isPending}
              onClick={handleApprove}
            >
              Xác Nhận Phê Duyệt
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">
            Bạn có chắc chắn muốn phê duyệt đơn cho thương hiệu{" "}
            <strong>{approveModalItem?.brandName}</strong>?
          </p>

          {approveModalItem?.type === "Online" && (
            <div>
              <Input
                label="Thiết lập tỷ lệ hoa hồng bán Online (%) *"
                required
                type="number"
                min={1}
                max={100}
                step={0.5}
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                placeholder="Ví dụ: 10"
              />
              <p className="mt-1 text-xs text-ink-muted">
                Đơn hàng Online yêu cầu Manager đề xuất tỷ lệ hoa hồng. Đơn sẽ chuyển sang trạng thái <strong>AwaitingConfirmation</strong> để người nộp đơn đồng ý.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Từ chối đơn */}
      <Modal
        open={Boolean(rejectModalItem)}
        title="Từ Chối Đơn Đăng Ký Đối Tác"
        onClose={() => setRejectModalItem(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectModalItem(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              loading={rejectMutation.isPending}
              onClick={handleReject}
            >
              Xác Nhận Từ Chối
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">
            Vui lòng nhập lý do từ chối đơn của thương hiệu{" "}
            <strong>{rejectModalItem?.brandName}</strong>:
          </p>
          <Textarea
            label="Lý do từ chối *"
            required
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ví dụ: Gian hàng đã có người khác thuê, thiếu thông tin giấy phép ATTP..."
          />
        </div>
      </Modal>
    </div>
  );
}
