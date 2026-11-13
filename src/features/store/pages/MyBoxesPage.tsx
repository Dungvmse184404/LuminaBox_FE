import { useMemo, useState } from "react";
import { Coins, ImageIcon, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Select } from "@/components/ui/FormField";
import { Pager } from "@/components/ui/Pager";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StorageImage } from "@/components/ui/StorageImage";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/features/products/types";
import { catalogError } from "../catalogErrors";
import { BoxFormModal } from "../components/BoxFormModal";
import { ImagesModal } from "../components/ImagesModal";
import { StockModal } from "../components/StockModal";
import { TierModal } from "../components/TierModal";
import { useBoxStatus, useMyBoxes, useRemoveBox } from "../hooks/useMyCatalog";
import { CATALOG_STATUS_LABEL, CATALOG_STATUS_TONE, totalStock, type CatalogStatus, type MyBox } from "../types";

type Panel = "stock" | "tiers" | "images";

export function MyBoxesPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CatalogStatus | "">("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<{ open: boolean; box: MyBox | null }>({ open: false, box: null });
  const [panel, setPanel] = useState<{ kind: Panel; boxId: string } | null>(null);
  const [deleting, setDeleting] = useState<MyBox | null>(null);

  const { data, isLoading, isError, refetch } = useMyBoxes({ search: search.trim() || undefined, status: status || undefined, page, pageSize: 12 });
  const setBoxStatus = useBoxStatus();
  const remove = useRemoveBox();

  const boxById = useMemo(() => new Map((data?.items ?? []).map((box) => [box.id, box])), [data]);
  const panelTarget = (kind: Panel) => (panel?.kind === kind ? (boxById.get(panel.boxId) ?? null) : null);

  const changeStatus = async (box: MyBox, next: CatalogStatus) => {
    try {
      await setBoxStatus.mutateAsync({ id: box.id, status: next });
      toast.success(next === "Active" ? `Đã mở bán "${box.name}".` : `Đã chuyển "${box.name}" sang ${CATALOG_STATUS_LABEL[next].toLowerCase()}.`);
    } catch (error) {
      toast.error(catalogError(error, "Không đổi được trạng thái."));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Đã xóa hộp.");
      setDeleting(null);
    } catch (error) {
      toast.error(catalogError(error, "Không xóa được hộp."));
    }
  };

  return (
    <>
      <PageHeader
        title="Hộp quà"
        description="Hộp bán riêng, khách chọn kèm khi mua bánh."
        actions={
          <Button onClick={() => setForm({ open: true, box: null })} data-guide="store-box-add">
            <Plus size={16} />
            Thêm hộp
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
          placeholder="Tìm theo tên hộp..."
          className="w-full max-w-sm"
        />
        <Select
          aria-label="Lọc theo trạng thái"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as CatalogStatus | "");
            setPage(1);
          }}
          className="w-44"
        >
          <option value="">Tất cả trạng thái</option>
          {(Object.keys(CATALOG_STATUS_LABEL) as CatalogStatus[]).map((key) => (
            <option key={key} value={key}>
              {CATALOG_STATUS_LABEL[key]}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <ErrorState message="Không tải được danh sách hộp." onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Chưa có hộp"
          description="Thử đổi bộ lọc hoặc thêm hộp mới."
          action={<Button onClick={() => setForm({ open: true, box: null })}>Thêm hộp</Button>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.items.map((box) => (
            <Card key={box.id} className="grid gap-3">
              <div className="flex gap-3">
                <StorageImage src={box.images[0]?.url} alt="" className="size-20 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{box.name}</p>
                    <StatusBadge status={box.status} tone={CATALOG_STATUS_TONE[box.status]} label={CATALOG_STATUS_LABEL[box.status]} />
                  </div>
                  <p className="text-xs text-ink-muted">
                    Đựng {box.capacity} bánh · {box.weight}g · {box.lengthCm}×{box.widthCm}×{box.heightCm} cm
                  </p>
                  <p className="text-sm text-ink-soft">
                    {formatPrice(box.price)} · tồn {totalStock(box.stocks).toLocaleString("vi-VN")}
                    {box.priceTiers.length > 0 && ` · ${box.priceTiers.length} bậc giá sỉ`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {box.status === "Active" ? (
                  <Button size="sm" variant="outline" onClick={() => changeStatus(box, "Inactive")}>
                    Ngừng bán
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => changeStatus(box, "Active")}>
                    Mở bán
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setPanel({ kind: "stock", boxId: box.id })}>
                  <Package size={13} /> Kho
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPanel({ kind: "tiers", boxId: box.id })}>
                  <Coins size={13} /> Giá sỉ
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPanel({ kind: "images", boxId: box.id })}>
                  <ImageIcon size={13} /> Ảnh
                </Button>
              </div>
              <div className="flex items-center justify-end gap-1 border-t border-line pt-2">
                <Button size="sm" variant="ghost" aria-label={`Sửa ${box.name}`} onClick={() => setForm({ open: true, box })}>
                  <Pencil size={13} /> Sửa
                </Button>
                <Button size="sm" variant="dangerGhost" aria-label={`Xóa ${box.name}`} onClick={() => setDeleting(box)}>
                  <Trash2 size={13} /> Xóa
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {data && <Pager page={data} onChange={setPage} />}

      <BoxFormModal open={form.open} box={form.box} onClose={() => setForm((current) => ({ ...current, open: false }))} />
      <StockModal kind="box-items" target={panelTarget("stock")} onClose={() => setPanel(null)} />
      <TierModal kind="box-items" target={panelTarget("tiers")} onClose={() => setPanel(null)} />
      <ImagesModal kind="box-items" target={panelTarget("images")} onClose={() => setPanel(null)} />
      <ConfirmModal
        open={deleting !== null}
        title="Xóa hộp"
        confirmLabel="Xóa"
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      >
        Xóa hộp <span className="font-semibold text-ink">{deleting?.name}</span>? Hộp sẽ không còn hiện với khách.
      </ConfirmModal>
    </>
  );
}
