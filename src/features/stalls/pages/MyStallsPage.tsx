import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pager } from "@/components/ui/Pager";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPrice } from "@/features/products/types";
import { errorStatus } from "@/lib/errors";
import { useMyRentals, useStalls } from "../hooks/useStalls";
import { formatDay, RENTAL_STATUS_LABEL, stallAddress } from "../types";

const REGISTER_STALL = "/become-partner?type=stall";

export function MyStallsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useMyRentals({ page, pageSize: 10, sortBy: "startDate", isDescending: true });
  const stalls = useStalls();
  const stallById = useMemo(() => new Map((stalls.data ?? []).map((stall) => [stall.id, stall])), [stalls.data]);
  const nothingRented = (isError && errorStatus(error) === 404) || (!isError && data?.items.length === 0);

  return (
    <>
      <PageHeader
        title="Gian hàng của tôi"
        description="Các hợp đồng thuê gian tại điểm bán của cửa hàng."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/become-partner?tab=requests">
              <Button variant="outline">Đơn đăng ký của tôi</Button>
            </Link>
            <Link to={REGISTER_STALL}>
              <Button>
                <Plus size={16} />
                Thuê thêm gian
              </Button>
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <SkeletonRows />
      ) : nothingRented ? (
        <EmptyState
          title="Cửa hàng chưa có gian hàng nào"
          description="Thuê gian tại điểm bán để bày bánh trực tiếp và cho khách đến nhận hàng."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link to={REGISTER_STALL}>
                <Button>
                  <Plus size={16} />
                  Thuê gian hàng
                </Button>
              </Link>
              <Link to="/become-partner?tab=requests">
                <Button variant="outline">Đơn đăng ký của tôi</Button>
              </Link>
            </div>
          }
        />
      ) : isError || !data ? (
        <ErrorState message="Không tải được danh sách gian hàng." onRetry={() => refetch()} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.items.map((rental) => {
            const stall = stallById.get(rental.stallId);
            return (
              <Card key={rental.id} className="grid gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary">{rental.stallCode}</p>
                    <p className="font-semibold text-ink">{rental.stallName}</p>
                  </div>
                  <StatusBadge status={rental.status} label={RENTAL_STATUS_LABEL[rental.status]} />
                </div>
                {stall && (
                  <p className="flex gap-1.5 text-sm text-ink-soft">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-ink-muted" />
                    <span className="break-words">{stallAddress(stall)}</span>
                  </p>
                )}
                <p className="flex items-center gap-1.5 text-sm text-ink-soft">
                  <CalendarDays size={15} className="shrink-0 text-ink-muted" />
                  {formatDay(rental.startDate)} – {formatDay(rental.endDate)}
                </p>
                {stall && <p className="text-xs text-ink-muted">Giá thuê {formatPrice(stall.rentalPrice)} / ngày</p>}
              </Card>
            );
          })}
        </div>
      )}

      {data && <Pager page={data} onChange={setPage} />}
    </>
  );
}
