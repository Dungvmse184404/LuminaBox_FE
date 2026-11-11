import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CONTROL } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { formatPrice, type PriceTier } from "@/features/products/types";
import { cn } from "@/lib/cn";
import type { CatalogKind } from "../api/catalogApi";
import { catalogError } from "../catalogErrors";
import { useSetTiers } from "../hooks/useMyCatalog";

interface Row {
  minQuantity: string;
  unitPrice: string;
}

interface Props {
  kind: CatalogKind;
  target: { id: string; name: string; price: number; priceTiers: PriceTier[] } | null;
  onClose: () => void;
}

function validate(rows: Row[], basePrice: number): string | null {
  const tiers = rows.map((row) => ({ minQuantity: Number(row.minQuantity), unitPrice: Number(row.unitPrice) }));
  if (tiers.some((t) => !Number.isInteger(t.minQuantity) || t.minQuantity < 2)) return "Số lượng tối thiểu phải là số nguyên từ 2.";
  if (tiers.some((t) => !(t.unitPrice > 0))) return "Đơn giá phải lớn hơn 0.";
  if (new Set(tiers.map((t) => t.minQuantity)).size !== tiers.length) return "Số lượng tối thiểu không được trùng.";
  let previous = basePrice;
  for (const tier of [...tiers].sort((a, b) => a.minQuantity - b.minQuantity)) {
    if (tier.unitPrice >= previous) return "Giá phải thấp hơn giá gốc và giảm dần khi số lượng tăng.";
    previous = tier.unitPrice;
  }
  return null;
}

export function TierModal({ kind, target, onClose }: Props) {
  const toast = useToast();
  const save = useSetTiers(kind);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (target) setRows(target.priceTiers.map((t) => ({ minQuantity: String(t.minQuantity), unitPrice: String(t.unitPrice) })));
  }, [target]);

  const problem = target ? validate(rows, target.price) : null;
  const update = (index: number, patch: Partial<Row>) => setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const submit = async () => {
    if (!target || problem) return;
    try {
      await save.mutateAsync({
        id: target.id,
        tiers: rows.map((row) => ({ minQuantity: Number(row.minQuantity), unitPrice: Number(row.unitPrice) })).sort((a, b) => a.minQuantity - b.minQuantity),
      });
      toast.success("Đã lưu giá sỉ.");
      onClose();
    } catch (error) {
      toast.error(catalogError(error, "Không lưu được giá sỉ."));
    }
  };

  return (
    <Modal
      open={target !== null}
      title={`Giá sỉ · ${target?.name ?? ""}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button loading={save.isPending} disabled={problem !== null} onClick={submit}>
            Lưu
          </Button>
        </>
      }
    >
      <div className="grid gap-2 text-sm">
        <p className="text-ink-soft">Giá gốc: {target && formatPrice(target.price)}</p>
        {rows.length === 0 && <p className="text-ink-muted">Chưa có bậc giá sỉ.</p>}
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
            <label className="grid gap-1 text-xs text-ink-muted">
              Từ số lượng
              <input type="number" min={2} value={row.minQuantity} onChange={(e) => update(index, { minQuantity: e.target.value })} className={cn(CONTROL, "border-line")} />
            </label>
            <label className="grid gap-1 text-xs text-ink-muted">
              Đơn giá (₫)
              <input type="number" min={1} value={row.unitPrice} onChange={(e) => update(index, { unitPrice: e.target.value })} className={cn(CONTROL, "border-line")} />
            </label>
            <Button variant="ghost" aria-label="Xóa bậc giá" onClick={() => setRows((current) => current.filter((_, i) => i !== index))}>
              <Trash2 size={15} />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="justify-self-start" onClick={() => setRows((current) => [...current, { minQuantity: "", unitPrice: "" }])}>
          <Plus size={14} />
          Thêm bậc
        </Button>
        {problem && rows.length > 0 && <p className="text-xs text-danger">{problem}</p>}
      </div>
    </Modal>
  );
}
