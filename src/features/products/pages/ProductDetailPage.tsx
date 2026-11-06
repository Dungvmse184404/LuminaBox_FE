import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { StorageImage } from "@/components/ui/StorageImage";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/features/auth/AuthContext";
import { useAddProductToCart } from "@/features/cart/hooks/useCart";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { CommitmentBar, DescriptionCard, RelatedProducts, SellerCard, shopLink, WhereToBuyCard } from "../components/ProductInfoSections";
import { useProduct } from "../hooks/useProducts";
import { formatPrice, unitPrice } from "../types";

const ONLINE = "online";

const option = (active: boolean) =>
  cn(
    "rounded-lg border px-3 py-1.5 text-sm transition",
    active ? "border-primary bg-primary text-white" : "border-line bg-card text-ink-soft hover:border-primary hover:text-primary",
  );

export function ProductDetailPage() {
  const { id = "" } = useParams();
  const { data: product, isLoading, isError, refetch } = useProduct(id);
  const [itemId, setItemId] = useState("");
  const [source, setSource] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const addToCart = useAddProductToCart();

  const item = product?.items.find((i) => i.id === itemId) ?? product?.items[0];
  const sellable = useMemo(() => item?.stocks.filter((stock) => stock.isActive && stock.stockQuantity > 0) ?? [], [item]);
  const stock = sellable.find((s) => (s.stallId ?? ONLINE) === source) ?? sellable[0];

  if (isLoading) return <SkeletonRows />;
  if (isError) return <ErrorState message="Không tải được sản phẩm." onRetry={() => refetch()} />;
  if (!product || !item) return <EmptyState title="Không tìm thấy sản phẩm" description="Sản phẩm có thể đã ngừng bán." />;

  const image = item.images[imageIndex] ?? item.images[0];
  const price = unitPrice(item, quantity);
  const maxQuantity = stock?.stockQuantity ?? 1;

  const add = async () => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    try {
      await addToCart.mutateAsync({ productItemId: item.id, quantity, stallId: stock?.stallId ?? null });
      toast.success("Đã thêm vào giỏ hàng.");
    } catch (error) {
      toast.error(errorMessage(error, "Không thêm được vào giỏ hàng."));
    }
  };

  return (
    <>
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-primary">
        <ChevronLeft size={16} /> Sản phẩm
      </Link>

      <div className="mt-4 grid gap-8 rounded-2xl border border-line bg-card p-6 shadow-sm md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:p-8">
        <div className="min-w-0 self-start">
          <StorageImage src={image?.url} alt={item.name} className="aspect-square w-full rounded-xl object-cover" />
          {item.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {item.images.map((img, index) => (
                <button
                  key={img.id}
                  type="button"
                  aria-label={`Ảnh ${index + 1}`}
                  onClick={() => setImageIndex(index)}
                  className={cn("size-16 shrink-0 overflow-hidden rounded-lg border-2", index === imageIndex ? "border-primary" : "border-line")}
                >
                  <StorageImage src={img.url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{item.categoryName}</p>
            <h1 className="mt-1 break-words font-serif text-3xl font-black text-primary-dark">{product.name}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Gian hàng{" "}
              <Link to={shopLink(product)} className="font-semibold text-primary hover:underline">
                {product.organizerBrandName}
              </Link>
            </p>
            <p className="mt-3 text-2xl font-bold text-primary">{formatPrice(price)}</p>
            <p className="mt-1 text-sm text-ink-soft">
              <span className="text-ink-muted">Tình trạng: </span>
              {sellable.length === 0 ? "Hết hàng" : `Còn ${maxQuantity} sản phẩm`}
            </p>
            {item.priceTiers.length > 0 && (
              <p className="mt-1 text-sm text-ink-soft">
                <span className="text-ink-muted">Giá sỉ: </span>
                {item.priceTiers.map((tier) => `từ ${tier.minQuantity} cái ${formatPrice(tier.unitPrice)}`).join(", ")}
              </p>
            )}
            {product.description && (
              <p className="mt-3 line-clamp-3 break-words rounded-lg bg-cream px-3.5 py-2.5 text-sm leading-relaxed text-ink-soft">
                {product.description}{" "}
                <a href="#description" className="font-semibold text-primary hover:underline">
                  Xem mô tả
                </a>
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-muted">Biến thể</p>
            <div className="flex flex-wrap gap-2">
              {product.items.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  aria-pressed={variant.id === item.id}
                  className={option(variant.id === item.id)}
                  onClick={() => {
                    setItemId(variant.id);
                    setImageIndex(0);
                    setQuantity(1);
                  }}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          </div>

          {sellable.length === 0 ? (
            <p className="rounded-lg bg-cream px-4 py-3 text-sm font-semibold text-ink-soft">Biến thể này tạm hết hàng.</p>
          ) : (
            <>
              <div>
                <p className="mb-2 text-sm text-ink-muted">Mua tại</p>
                <div className="flex flex-wrap gap-2">
                  {sellable.map((s) => {
                    const value = s.stallId ?? ONLINE;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={stock?.id === s.id}
                        className={option(stock?.id === s.id)}
                        onClick={() => {
                          setSource(value);
                          setQuantity((current) => Math.min(current, s.stockQuantity));
                        }}
                      >
                        {s.stallName ?? "Kho online"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center overflow-hidden rounded-lg border border-line text-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    aria-label="Giảm số lượng"
                    className="grid size-10 place-items-center hover:bg-cream disabled:opacity-40"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-semibold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                    aria-label="Tăng số lượng"
                    className="grid size-10 place-items-center hover:bg-cream disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-sm text-ink-soft">
                  Thành tiền <span className="font-bold text-primary">{formatPrice(price * quantity)}</span>
                </span>
              </div>

              <Button className="w-full sm:w-auto" loading={addToCart.isPending} onClick={add}>
                <ShoppingCart size={16} />
                Thêm vào giỏ
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="relative min-w-0 lg:min-h-[30rem]">
          <DescriptionCard product={product} item={item} />
        </div>
        <div className="grid min-w-0 gap-6">
          <SellerCard product={product} />
          <WhereToBuyCard stocks={sellable} />
        </div>
      </div>
      <CommitmentBar />
      <RelatedProducts title="Sản phẩm khác của gian hàng" product={product} sameShop />
      <RelatedProducts title="Có thể bạn cũng thích" product={product} sameShop={false} />
    </>
  );
}
