import { useState } from "react";
import { History, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Select } from "@/components/ui/FormField";
import { Pager } from "@/components/ui/Pager";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/features/products/types";
import { ApiError } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { StallFormModal } from "../components/StallFormModal";
import { StallRentalsModal } from "../components/StallRentalsModal";
import { useDeleteStall, useStallList } from "../hooks/useStalls";
import { STALL_STATUS_LABEL, stallAddress, type StallDetail, type StallStatus } from "../types";

const STICKY_HEAD = "sticky right-0 border-l border-line bg-[color-mix(in_oklab,var(--color-cream)_60%,var(--color-card))]";
const STICKY_CELL = "sticky right-0 border-l border-line bg-card group-hover:bg-[color-mix(in_oklab,var(--color-cream)_30%,var(--color-card))]";

export function AdminStallsPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StallStatus | "">("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StallDetail | null>(null);
  const [deleting, setDeleting] = useState<StallDetail | null>(null);
  const [history, setHistory] = useState<StallDetail | null>(null);

  const { data, isLoading, isError, refetch } = useStallList({
    search: search.trim() || undefined,
    status: status || undefined,
    page,
    pageSize: 10,
  });
  const remove = useDeleteStall();

  const openForm = (stall: StallDetail | null) => {
    setEditing(stall);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success(`Đã xóa gian ${deleting.code}.`);
      setDeleting(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) toast.error("Chỉ xóa được gian đang trống, chưa từng cho thuê và không có đơn đăng ký chờ duyệt.");
      else toast.error(errorMessage(error, "Không xóa được gian hàng."));
    }
  };

  return (
    <>
      <PageHeader
        title="Gian hàng"
        description="Các gian tại điểm bán mà Organizer có thể thuê."
        actions={
          <Button onClick={() => openForm(null)} data-guide="admin-stall-add">
            <Plus size={16} />
            Thêm gian hàng
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Tìm theo mã, tên gian..."
          className="w-full max-w-sm"
        />
        <Select
          aria-label="Lọc theo trạng thái"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as StallStatus | "");
            setPage(1);
          }}
          className="w-44"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Available">{STALL_STATUS_LABEL.Available}</option>
          <option value="Rented">{STALL_STATUS_LABEL.Rented}</option>
        </Select>
      </div>

      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <ErrorState message="Không tải được danh sách gian hàng." onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="Chưa có gian hàng" description="Thử đổi bộ lọc hoặc thêm gian hàng mới." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-cream/60 text-xs font-semibold text-ink-muted">
              <tr>
                <th className="p-3">Gian</th>
                <th className="p-3">Địa chỉ</th>
                <th className="whitespace-nowrap p-3 text-right">Giá thuê / ngày</th>
                <th className="p-3">Trạng thái</th>
                <th className={`${STICKY_HEAD} py-3 pl-3 pr-4 text-right`}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((stall) => (
                <tr key={stall.id} className="group hover:bg-cream/30">
                  <td className="p-3">
                    <p className="whitespace-nowrap text-xs font-semibold text-primary">{stall.code}</p>
                    <p className="font-medium text-ink">{stall.name}</p>
                  </td>
                  <td className="min-w-56 p-3 text-ink-soft">{stallAddress(stall)}</td>
                  <td className="whitespace-nowrap p-3 text-right text-ink">{formatPrice(stall.rentalPrice)}</td>
                  <td className="p-3">
                    <StatusBadge status={stall.status} label={STALL_STATUS_LABEL[stall.status]} />
                  </td>
                  <td className={`${STICKY_CELL} py-3 pl-3 pr-4`}>
                    <div className="flex min-w-max items-center justify-end gap-1.5 whitespace-nowrap">
                      <Button size="sm" variant="ghost" title="Lịch sử thuê" aria-label={`Lịch sử thuê ${stall.code}`} onClick={() => setHistory(stall)}>
                        <History size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" title="Sửa" aria-label={`Sửa ${stall.code}`} onClick={() => openForm(stall)}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Xóa"
                        aria-label={`Xóa ${stall.code}`}
                        className="hover:text-danger"
                        onClick={() => setDeleting(stall)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pager page={data} onChange={setPage} />}

      <StallFormModal open={formOpen} stall={editing} onClose={() => setFormOpen(false)} />
      <StallRentalsModal stall={history} onClose={() => setHistory(null)} />
      <ConfirmModal
        open={deleting !== null}
        title="Xóa gian hàng"
        confirmLabel="Xóa"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      >
        Xóa gian <span className="font-semibold text-ink">{deleting?.code}</span> – {deleting?.name}? Chỉ xóa được gian đang trống, chưa từng cho thuê và không
        có đơn đăng ký chờ duyệt.
      </ConfirmModal>
    </>
  );
}
