import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/FormField";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { StorageImage } from "@/components/ui/StorageImage";
import { cn } from "@/lib/cn";
import { ShippingEstimate } from "../components/ShippingEstimate";
import { useProduct } from "../hooks/useProducts";
import { formatPrice, unitPrice } from "../types";

const ONLINE = "online";

export function ProductDetailPage() {
  const { id = "" } = useParams();
  const { data: product, isLoading, isError, refetch } = useProduct(id);
  const [itemId, setItemId] = useState("");
  const [source, setSource] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  const item = product?.items.find((i) => i.id === itemId) ?? product?.items[0];
  const sellable = useMemo(() => item?.stocks.filter((stock) => stock.isActive && stock.stockQuantity > 0) ?? [], [item]);
  const stock = sellable.find((s) => (s.stallId ?? ONLINE) === source) ?? sellable[0];

  if (isLoading) return <SkeletonRows />;
  if (isError) return <ErrorState message="Không tải được sản phẩm." onRetry={() => refetch()} />;
  if (!product || !item) return <EmptyState title="Không tìm thấy sản phẩm" description="Sản phẩm có thể đã ngừng bán." />;

  const image = item.images[imageIndex] ?? item.images[0];
  const price = unitPrice(item, quantity);

  return (
    <>
      <Link to="/products" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-dark hover:underline">
        <ChevronLeft size={16} />
        Tất cả sản phẩm
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <StorageImage src={image?.url} alt={item.name} className="aspect-square w-full rounded-card object-cover" />
          {item.images.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.images.map((img, index) => (
                <button
                  key={img.id}
                  type="button"
                  aria-label={`Ảnh ${index + 1}`}
                  onClick={() => setImageIndex(index)}
                  className={cn("size-16 overflow-hidden rounded-lg border-2", index === imageIndex ? "border-primary" : "border-line")}
                >
                  <StorageImage src={img.url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <div>
            <p className="text-sm text-ink-muted">{product.organizerBrandName}</p>
            <h1 className="break-words font-serif text-2xl font-bold text-ink">{product.name}</h1>
            {product.description && <p className="mt-2 break-words text-sm leading-relaxed text-ink-soft">{product.description}</p>}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink">Biến thể</p>
            <div className="flex flex-wrap gap-2">
              {product.items.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  aria-pressed={variant.id === item.id}
                  onClick={() => {
                    setItemId(variant.id);
                    setImageIndex(0);
                    setQuantity(1);
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition",
                    variant.id === item.id ? "border-primary bg-primary text-white" : "border-line bg-card text-ink-soft hover:border-primary",
                  )}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-2xl font-bold text-primary-dark">{formatPrice(price)}</p>
            <p className="text-sm text-ink-muted">
              {item.categoryName} · {item.fillingName} · {item.eggCount} trứng · {item.weight} g
            </p>
            {item.priceTiers.length > 0 && (
              <p className="mt-1 text-sm text-ink-soft">
                Giá sỉ: {item.priceTiers.map((tier) => `từ ${tier.minQuantity} cái ${formatPrice(tier.unitPrice)}`).join(", ")}
              </p>
            )}
          </div>

          <Card className="space-y-3">
            {sellable.length === 0 ? (
              <p className="text-sm font-medium text-danger">Biến thể này đã hết hàng.</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select label="Mua tại" value={stock?.stallId ?? ONLINE} onChange={(event) => setSource(event.target.value)}>
                    {sellable.map((s) => (
                      <option key={s.id} value={s.stallId ?? ONLINE}>
                        {s.stallName ?? "Kho online"} (còn {s.stockQuantity})
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Số lượng"
                    type="number"
                    min={1}
                    max={stock?.stockQuantity}
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, Math.min(stock?.stockQuantity ?? 1, Number(event.target.value) || 1)))}
                  />
                </div>
                <ShippingEstimate organizerId={product.organizerId} stallId={stock?.stallId ?? null} productItemId={item.id} quantity={quantity} />
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
