import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Pager } from "@/components/ui/Pager";
import { SearchInput } from "@/components/ui/SearchInput";
import { ErrorState, SkeletonRows } from "@/components/ui/States";
import { useCategories } from "@/features/catalog/hooks/useCategories";
import { ProductCard } from "../components/ProductCard";
import { ProductFilter } from "../components/ProductFilter";
import { SuggestedProducts } from "../components/SuggestedProducts";
import { useFillings, useProducts } from "../hooks/useProducts";
import type { FilterShop } from "../types";

const CATEGORY_QUERY = { pageSize: 50, sortBy: "name", isDescending: false };
const SHOP_QUERY = { pageSize: 50 };

export function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const categoryId = params.get("categoryId") ?? "";
  const fillingId = params.get("fillingId") ?? "";
  const search = params.get("q") ?? "";
  const page = Number(params.get("page") ?? 1) || 1;
  const organizerId = params.get("organizerId") ?? "";
  const brand = params.get("brand") ?? "";

  const categories = useCategories(CATEGORY_QUERY);
  const fillings = useFillings();
  const catalog = useProducts(SHOP_QUERY);
  const { data, isLoading, isError, refetch } = useProducts({
    search,
    page,
    pageSize: 12,
    categoryId: categoryId || undefined,
    fillingId: fillingId || undefined,
    organizerId: organizerId || undefined,
  });

  const shops = useMemo(() => {
    const found = new Map<string, FilterShop>();
    catalog.data?.items.forEach((product) => found.set(product.organizerId, { id: product.organizerId, name: product.organizerBrandName }));
    if (organizerId && brand && !found.has(organizerId)) found.set(organizerId, { id: organizerId, name: brand });
    return [...found.values()].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [catalog.data, organizerId, brand]);

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries({ page: "", ...changes })) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next);
  };

  const filtering = Boolean(organizerId || categoryId || fillingId || search);
  const shopName = shops.find((shop) => shop.id === organizerId)?.name ?? brand;

  return (
    <>
      <h1 className="font-serif text-2xl font-black text-primary-dark">{organizerId && shopName ? `Sản phẩm của ${shopName}` : "Sản phẩm"}</h1>

      <SearchInput value={search} onChange={(q) => update({ q })} placeholder="Tìm theo tên bánh" className="mt-4 max-w-xl" />

      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <ProductFilter
          shops={shops}
          categories={categories.data?.items ?? []}
          fillings={fillings.data ?? []}
          organizerId={organizerId}
          categoryId={categoryId}
          fillingId={fillingId}
          onChange={update}
        />

        <div className="min-w-0">
          {isLoading ? (
            <SkeletonRows />
          ) : isError ? (
            <ErrorState message="Không tải được sản phẩm." onRetry={() => refetch()} />
          ) : data?.items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-6 py-12 text-center text-sm text-ink-muted">Không tìm thấy sản phẩm phù hợp.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {data?.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          {data && <Pager page={data} onChange={(next) => update({ page: String(next) })} />}

          {filtering && !isLoading && (
            <SuggestedProducts
              categoryId={categoryId}
              fillingId={fillingId}
              organizerId={organizerId}
              shownIds={data?.items.map((product) => product.id) ?? []}
            />
          )}
        </div>
      </div>
    </>
  );
}
