import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { StorageImage } from "@/components/ui/StorageImage";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/features/products/types";
import { errorMessage } from "@/lib/errors";
import { useCart, useRemoveCartItem, useUpdateCartQuantity } from "../hooks/useCart";
import { cartItemDetail, cartItemName, groupLabel, type CartItem } from "../types";

export function CartPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: cart, isLoading, isError, refetch } = useCart();
  const updateQuantity = useUpdateCartQuantity();
  const remove = useRemoveCartItem();
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const items = useMemo(() => cart?.groups.flatMap((group) => group.items) ?? [], [cart]);
  const selected = items.filter((item) => !excludedIds.has(item.id));
  const total = selected.reduce((sum, item) => sum + item.subtotal, 0);

  const toggle = (id: string) =>
    setExcludedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const changeQuantity = async (item: CartItem, quantity: number) => {
    try {
      await updateQuantity.mutateAsync({ itemId: item.id, quantity });
    } catch (error) {
      toast.error(errorMessage(error, "Không cập nhật được số lượng."));
    }
  };

  const removeItem = async (item: CartItem) => {
    try {
      await remove.mutateAsync(item.id);
    } catch (error) {
      toast.error(errorMessage(error, "Không xóa được sản phẩm."));
    }
  };

  if (isLoading) return <SkeletonRows />;
  if (isError) return <ErrorState message="Không tải được giỏ hàng." onRetry={() => refetch()} />;

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Giỏ hàng" />
        <EmptyState
          title="Giỏ hàng đang trống"
          action={
            <Link to="/products" className="text-sm font-semibold text-primary hover:underline">
              Xem sản phẩm
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Giỏ hàng" />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 gap-4">
          {cart?.groups.map((group) => (
            <Card key={`${group.organizerId}-${group.stallId}`} flush className="min-w-0">
              <p className="border-b border-line px-5 py-3 font-semibold text-ink">{groupLabel(group)}</p>
              <div className="divide-y divide-line">
                {group.items.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Chọn ${cartItemName(item)}`}
                      checked={!excludedIds.has(item.id)}
                      onChange={() => toggle(item.id)}
                      className="size-4 accent-primary"
                    />
                    <StorageImage src={item.imageUrl} alt={cartItemName(item)} className="size-16 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="line-clamp-2 break-words text-sm font-medium text-ink">{cartItemName(item)}</p>
                      <p className="line-clamp-2 break-words text-xs text-ink-muted">{cartItemDetail(item)}</p>
                      <p className="mt-1 text-sm text-ink-soft">{formatPrice(item.unitPrice)}</p>
                    </div>
                    <div className="inline-flex items-center overflow-hidden rounded-lg border border-line text-sm">
                      <button
                        type="button"
                        aria-label="Giảm số lượng"
                        disabled={item.quantity <= 1 || updateQuantity.isPending}
                        onClick={() => changeQuantity(item, item.quantity - 1)}
                        className="grid size-8 place-items-center hover:bg-cream disabled:opacity-40"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-9 text-center font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Tăng số lượng"
                        disabled={updateQuantity.isPending}
                        onClick={() => changeQuantity(item, item.quantity + 1)}
                        className="grid size-8 place-items-center hover:bg-cream disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="w-28 text-right font-bold text-primary">{formatPrice(item.subtotal)}</p>
                    <button
                      type="button"
                      aria-label={`Xóa ${cartItemName(item)}`}
                      disabled={remove.isPending}
                      onClick={() => removeItem(item)}
                      className="text-ink-muted hover:text-primary disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Card className="grid gap-3 lg:sticky lg:top-40">
          <div className="flex justify-between text-sm text-ink-soft">
            <span>Đã chọn</span>
            <span>{selected.length} sản phẩm</span>
          </div>
          <div className="flex justify-between font-semibold text-ink">
            <span>Tạm tính</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
          <Button disabled={selected.length === 0} onClick={() => navigate(`/checkout?items=${selected.map((item) => item.id).join(",")}`)}>
            Thanh toán
          </Button>
        </Card>
      </div>
    </>
  );
}
