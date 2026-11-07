import { useProducts } from "../hooks/useProducts";
import type { ProductSummary } from "../types";
import { ProductCard } from "./ProductCard";

interface Props {
  categoryId: string;
  fillingId: string;
  organizerId: string;
  shownIds: string[];
}

export function SuggestedProducts({ categoryId, fillingId, organizerId, shownIds }: Props) {
  const hasTag = Boolean(categoryId || fillingId);
  const sameTags = useProducts({ categoryId: categoryId || undefined, fillingId: fillingId || undefined, pageSize: 12 }, hasTag && Boolean(organizerId));
  const everything = useProducts({ pageSize: 24 });

  const excluded = new Set(shownIds);
  const items: ProductSummary[] = [];

  for (const product of [...(sameTags.data?.items ?? []), ...(everything.data?.items ?? [])]) {
    const hiddenSameShop = !hasTag && product.organizerId === organizerId;
    if (excluded.has(product.id) || hiddenSameShop) continue;
    excluded.add(product.id);
    items.push(product);
  }

  if (items.length === 0) return null;

  return (
    <section className="mt-8 border-t border-line pt-5" aria-label="Có thể bạn cũng thích">
      <h2 className="font-serif text-lg font-bold text-ink">Có thể bạn cũng thích...</h2>
      <div className="mt-3 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {items.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
