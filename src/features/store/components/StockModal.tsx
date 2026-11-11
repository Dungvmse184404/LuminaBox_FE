import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CONTROL } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { SkeletonRows } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import type { Stock } from "@/features/products/types";
import { useMyStalls } from "@/features/stalls/hooks/useStalls";
import type { CatalogKind } from "../api/catalogApi";
import { catalogError } from "../catalogErrors";
import { useSetStocks } from "../hooks/useMyCatalog";

interface Row {
  stallId: string | null;
  label: string;
  detail: string;
  quantity: string;
  isActive: boolean;
}

interface Props {
  kind: CatalogKind;
  target: { id: string; name: string; stocks: Stock[] } | null;
  onClose: () => void;
}

export function StockModal({ kind, target, onClose }: Props) {
  const toast = useToast();
  const stalls = useMyStalls();
  const save = useSetStocks(kind);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!target || !stalls.data) return;
    const current = (stallId: string | null) => target.stocks.find((stock) => stock.stallId === stallId);
    const toRow = (stallId: string | null, label: string, detail: string): Row => {
      const stock = current(stallId);
      return { stallId, label, detail, quantity: String(stock?.stockQuantity ?? 0), isActive: stock?.isActive ?? true };
    };
    setRows([
      toRow(null, "Bán online", "Giao từ địa chỉ lấy hàng"),
      ...stalls.data.map((stall) => toRow(stall.id, `${stall.code} · ${stall.name}`, [stall.addressLine, stall.provinceName].join(", "))),
    ]);
  }, [target, stalls.data]);

  const others = target?.stocks.filter((stock) => stock.stallId && !rows.some((row) => row.stallId === stock.stallId)) ?? [];
  const invalid = rows.some((row) => !/^\d+$/.test(row.quantity));

  const update = (index: number, patch: Partial<Row>) => setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const submit = async () => {
    if (!target || invalid) return;
    try {
      await save.mutateAsync({
        id: target.id,
        stocks: rows.map((row) => ({ stallId: row.stallId, stockQuantity: Number(row.quantity), isActive: row.isActive })),
      });
      toast.success("Đã cập nhật tồn kho.");
      onClose();
    } catch (error) {
      toast.error(catalogError(error, "Không cập nhật được tồn kho."));
    }
  };

  return (
    <Modal
      open={target !== null}
      title={`Tồn kho · ${target?.name ?? ""}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button loading={save.isPending} disabled={invalid || !stalls.data} onClick={submit}>
            Lưu
          </Button>
        </>
      }
    >
      {stalls.isLoading ? (
        <SkeletonRows rows={3} />
      ) : (
        <div className="grid gap-2">
          {rows.map((row, index) => (
            <div key={row.stallId ?? "online"} className="grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-3 rounded-lg border border-line p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{row.label}</p>
                <p className="truncate text-xs text-ink-muted">{row.detail}</p>
                <label className="mt-1 inline-flex items-center gap-1.5 text-xs text-ink-soft">
                  <input type="checkbox" checked={row.isActive} onChange={(e) => update(index, { isActive: e.target.checked })} />
                  Đang bán tại đây
                </label>
              </div>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                aria-label={`Số lượng tại ${row.label}`}
                value={row.quantity}
                onChange={(e) => update(index, { quantity: e.target.value })}
                className={cn(CONTROL, "border-line text-right")}
              />
            </div>
          ))}
          {stalls.data?.length === 0 && <p className="text-xs text-ink-muted">Cửa hàng chưa thuê gian nào, chỉ nhập được hàng bán online.</p>}
          {others.length > 0 && (
            <p className="text-xs text-ink-muted">
              Hàng ở gian đã hết hợp đồng giữ nguyên: {others.map((stock) => `${stock.stallName} (${stock.stockQuantity})`).join(", ")}.
            </p>
          )}
          {invalid && <p className="text-xs text-danger">Số lượng phải là số nguyên không âm.</p>}
        </div>
      )}
    </Modal>
  );
}
