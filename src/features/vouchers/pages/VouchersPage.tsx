import type { ReactNode } from "react";
import { Ticket } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/features/products/types";
import { errorMessage } from "@/lib/errors";
import { useAvailableVouchers, useClaimedVouchers, useClaimVoucher, useUnclaimVoucher } from "../hooks/useVouchers";
import type { ClaimedVoucher, Voucher } from "../types";

const discountText = (voucher: Voucher | ClaimedVoucher) =>
  voucher.discountType === "Percent" ? `Giảm ${voucher.discountValue}%` : `Giảm ${formatPrice(voucher.discountValue)}`;

function VoucherCard({ voucher, action }: { voucher: Voucher | ClaimedVoucher; action: ReactNode }) {
  return (
    <Card className="flex min-w-0 items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
        <Ticket size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="break-words font-semibold text-ink">{voucher.name}</p>
        <p className="text-sm font-medium text-primary">{discountText(voucher)}</p>
        <p className="break-words text-xs text-ink-muted">
          {voucher.code} · {voucher.organizerBrandName ?? "Toàn sàn"} · Đơn từ {formatPrice(voucher.minOrderAmount)}
        </p>
        <p className="text-xs text-ink-muted">Hết hạn {new Date(voucher.endAt).toLocaleDateString("vi-VN")}</p>
      </div>
      {action}
    </Card>
  );
}

export function VouchersPage() {
  const toast = useToast();
  const available = useAvailableVouchers();
  const claimed = useClaimedVouchers();
  const claim = useClaimVoucher();
  const unclaim = useUnclaimVoucher();

  const claimVoucher = async (voucher: Voucher) => {
    try {
      await claim.mutateAsync(voucher.id);
      toast.success("Đã lưu voucher.");
    } catch (error) {
      toast.error(errorMessage(error, "Không lưu được voucher."));
    }
  };

  const removeVoucher = async (voucher: ClaimedVoucher) => {
    try {
      await unclaim.mutateAsync(voucher.id);
      toast.success("Đã bỏ voucher.");
    } catch (error) {
      toast.error(errorMessage(error, "Không bỏ được voucher."));
    }
  };

  return (
    <>
      <PageHeader title="Voucher và khuyến mãi" />

      <h2 className="mb-3 font-serif text-lg font-bold text-ink" data-guide="vouchers-mine" data-guide-label="Voucher của tôi">
        Voucher của tôi
      </h2>
      {claimed.isLoading ? (
        <SkeletonRows rows={2} />
      ) : claimed.isError ? (
        <ErrorState message="Không tải được voucher." onRetry={() => claimed.refetch()} />
      ) : !claimed.data?.length ? (
        <EmptyState title="Chưa lưu voucher nào" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {claimed.data.map((voucher) => (
            <VoucherCard
              key={voucher.id}
              voucher={voucher}
              action={
                <Button variant="ghost" size="sm" disabled={unclaim.isPending} onClick={() => removeVoucher(voucher)}>
                  Bỏ
                </Button>
              }
            />
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-8 font-serif text-lg font-bold text-ink">Voucher đang có</h2>
      {available.isLoading ? (
        <SkeletonRows rows={3} />
      ) : available.isError ? (
        <ErrorState message="Không tải được voucher." onRetry={() => available.refetch()} />
      ) : !available.data?.length ? (
        <EmptyState title="Hiện chưa có voucher mới" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {available.data.map((voucher) => (
            <VoucherCard
              key={voucher.id}
              voucher={voucher}
              action={
                <Button size="sm" disabled={claim.isPending} onClick={() => claimVoucher(voucher)}>
                  Lưu
                </Button>
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
