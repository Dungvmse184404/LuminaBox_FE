import { Link } from "react-router-dom";
import { StorageImage } from "@/components/ui/StorageImage";
import { formatPrice, type ProductSummary } from "../types";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link to={`/products/${product.id}`} className="min-w-0 overflow-hidden rounded-xl border border-line bg-card transition hover:shadow-md">
      <StorageImage src={product.thumbnailUrl} alt={product.name} className="aspect-[4/3] w-full object-cover" />
      <div className="p-3">
        <h3 className="line-clamp-2 break-words text-sm font-semibold text-ink">{product.name}</h3>
        <p className="mt-0.5 truncate text-xs text-ink-muted">{product.organizerBrandName}</p>
        <p className="mt-2 font-bold text-primary">{product.minPrice === null ? "Liên hệ" : formatPrice(product.minPrice)}</p>
      </div>
    </Link>
  );
}
