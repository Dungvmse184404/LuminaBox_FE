import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal } from "@/components/ui/Modal";
import { Pager } from "@/components/ui/Pager";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/errors";
import { useStallRentals, useTerminateRental } from "../hooks/useStalls";
import { formatDay, RENTAL_STATUS_LABEL, type StallDetail, type StallRental } from "../types";

interface Props {
  stall: StallDetail | null;
  onClose: () => void;
}

export function StallRentalsModal({ stall, onClose }: Props) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [terminating, setTerminating] = useState<StallRental | null>(null);
  const { data, isLoading, isError, refetch } = useStallRentals(stall?.id ?? null, { page, pageSize: 5, sortBy: "startDate", isDescending: true });
  const terminate = useTerminateRental();

  useEffect(() => setPage(1), [stall?.id]);

  const confirmTerminate = async () => {
    if (!terminating) return;
    try {
      await terminate.mutateAsync(terminating.id);
      toast.success(`Đã chấm dứt hợp đồng của ${terminating.organizerBrandName}.`);
      setTerminating(null);
    } catch (error) {
      toast.error(errorMessage(error, "Không chấm dứt được hợp đồng."));
    }
  };

  return (
    <>
      <Modal open={stall !== null && terminating === null} title={`Lịch sử thuê · ${stall?.code ?? ""}`} onClose={onClose}>
        {isLoading ? (
          <SkeletonRows rows={3} />
        ) : isError ? (
          <ErrorState message="Không tải được lịch sử thuê." onRetry={() => refetch()} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="Chưa có hợp đồng thuê" description="Gian này chưa từng được cho thuê." />
        ) : (
          <ul className="divide-y divide-line">
            {data.items.map((rental) => (
              <li key={rental.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{rental.organizerBrandName}</p>
                  <p className="break-all text-xs text-ink-muted">{rental.organizerEmail}</p>
                  <p className="text-sm text-ink-soft">
                    {formatDay(rental.startDate)} – {formatDay(rental.endDate)}
                  </p>
                </div>
                <StatusBadge status={rental.status} label={RENTAL_STATUS_LABEL[rental.status]} />
                {rental.status === "Active" && (
                  <Button size="sm" variant="dangerOutline" onClick={() => setTerminating(rental)}>
                    Chấm dứt
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {data && <Pager page={data} onChange={setPage} />}
      </Modal>

      <ConfirmModal
        open={terminating !== null}
        title="Chấm dứt hợp đồng thuê"
        confirmLabel="Chấm dứt"
        loading={terminate.isPending}
        onConfirm={confirmTerminate}
        onClose={() => setTerminating(null)}
      >
        Chấm dứt hợp đồng của <span className="font-semibold text-ink">{terminating?.organizerBrandName}</span> tại gian {stall?.code} từ hôm
        nay? Hàng tồn của cửa hàng tại gian này sẽ ngừng bán.
      </ConfirmModal>
    </>
  );
}
