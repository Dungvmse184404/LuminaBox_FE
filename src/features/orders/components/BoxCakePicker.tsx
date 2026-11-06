import { Minus, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/States";
import type { CartItem } from "@/features/cart/types";
import { useBoxCakes } from "../hooks/useOrders";

interface Props {
  line: CartItem;
  value: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
}

export function BoxCakePicker({ line, value, onChange }: Props) {
  const { data: cakes, isLoading } = useBoxCakes(line.boxItemId ?? "", line.stallId);
  const capacity = line.boxCapacity ?? 0;
  const picked = Object.values(value).reduce((sum, quantity) => sum + quantity, 0);

  const change = (productItemId: string, quantity: number) => onChange({ ...value, [productItemId]: quantity });

  if (isLoading) return <Skeleton className="h-16" />;

  return (
    <div className="rounded-lg bg-cream/60 p-3">
      <p className="mb-2 text-sm font-medium text-ink">
        Chọn bánh cho {line.boxItemName} ({picked}/{capacity})
      </p>
      <div className="grid gap-1.5">
        {cakes?.map((cake) => {
          const quantity = value[cake.productItemId] ?? 0;
          const limit = Math.floor(cake.stockQuantity / line.quantity);
          return (
            <div key={cake.productItemId} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 break-words text-ink-soft">
                {cake.productName} · {cake.name}
              </span>
              <span className="inline-flex shrink-0 items-center overflow-hidden rounded-lg border border-line bg-card">
                <button
                  type="button"
                  aria-label={`Bớt ${cake.name}`}
                  disabled={quantity === 0}
                  onClick={() => change(cake.productItemId, quantity - 1)}
                  className="grid size-7 place-items-center disabled:opacity-40"
                >
                  <Minus size={12} />
                </button>
                <span className="w-7 text-center font-semibold">{quantity}</span>
                <button
                  type="button"
                  aria-label={`Thêm ${cake.name}`}
                  disabled={picked >= capacity || quantity >= limit}
                  onClick={() => change(cake.productItemId, quantity + 1)}
                  className="grid size-7 place-items-center disabled:opacity-40"
                >
                  <Plus size={12} />
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
