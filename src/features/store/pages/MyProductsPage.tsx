import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Coins, ImageIcon, Package, Pencil, Plus, Trash2 } from "lucide-react";
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
import { ImagesModal } from "../components/ImagesModal";
import { ProductFormModal } from "../components/ProductFormModal";
import { StockModal } from "../components/StockModal";
import { TierModal } from "../components/TierModal";
import { VariantFormModal } from "../components/VariantFormModal";
import { useMyProducts, useProductStatus, useRemoveProduct, useRemoveVariant } from "../hooks/useMyCatalog";
import { CATALOG_STATUS_LABEL, CATALOG_STATUS_TONE, totalStock, type CatalogStatus, type MyProduct, type MyVariant } from "../types";

type Panel = "stock" | "tiers" | "images";

export function MyProductsPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CatalogStatus | "">("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [productForm, setProductForm] = useState<{ open: boolean; product: MyProduct | null }>({ open: false, product: null });
  const [variantForm, setVariantForm] = useState<{ open: boolean; productId: string | null; variant: MyVariant | null }>({
    open: false,
    productId: null,
    variant: null,
  });
  const [panel, setPanel] = useState<{ kind: Panel; variantId: string } | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<MyProduct | null>(null);
  const [deletingVariant, setDeletingVariant] = useState<MyVariant | null>(null);

  const { data, isLoading, isError, refetch } = useMyProducts({
    search: search.trim() || undefined,
    status: status || undefined,
    page,
    pageSize: 10,
    sortBy: "createdAt",
    isDescending: true,
  });
  const setProductStatus = useProductStatus();
  const removeProduct = useRemoveProduct();
  const removeVariant = useRemoveVariant();

  const variantById = useMemo(() => new Map((data?.items ?? []).flatMap((p) => p.items).map((v) => [v.id, v])), [data]);
  const panelVariant = panel ? (variantById.get(panel.variantId) ?? null) : null;
  const panelTarget = (kind: Panel) => (panel?.kind === kind ? panelVariant : null);

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const changeStatus = async (product: MyProduct, next: CatalogStatus) => {
    try {
      await setProductStatus.mutateAsync({ id: product.id, status: next });
      toast.success(next === "Active" ? `Đã mở bán "${product.name}".` : `Đã chuyển "${product.name}" sang ${CATALOG_STATUS_LABEL[next].toLowerCase()}.`);
    } catch (error) {
      toast.error(catalogError(error, "Không đổi được trạng thái."));
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await removeProduct.mutateAsync(deletingProduct.id);
      toast.success("Đã xóa sản phẩm.");
      setDeletingProduct(null);
    } catch (error) {
      toast.error(catalogError(error, "Không xóa được sản phẩm."));
    }
  };

  const confirmDeleteVariant = async () => {
    if (!deletingVariant) return;
    try {
      await removeVariant.mutateAsync(deletingVariant.id);
      toast.success("Đã xóa biến thể.");
      setDeletingVariant(null);
    } catch (error) {
      toast.error(catalogError(error, "Không xóa được biến thể."));
    }
  };

  return (
    <>
      <PageHeader
        title="Sản phẩm của tôi"
        description="Sản phẩm, biến thể, ảnh, giá sỉ và tồn kho theo gian."
        actions={
          <Button onClick={() => setProductForm({ open: true, product: null })}>
            <Plus size={16} />
            Thêm sản phẩm
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
          placeholder="Tìm theo tên sản phẩm..."
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
        <ErrorState message="Không tải được danh sách sản phẩm." onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Chưa có sản phẩm"
          description="Thử đổi bộ lọc hoặc thêm sản phẩm mới."
          action={<Button onClick={() => setProductForm({ open: true, product: null })}>Thêm sản phẩm</Button>}
        />
      ) : (
        <div className="grid gap-3">
          {data.items.map((product) => {
            const open = expanded.has(product.id);
            const prices = product.items.map((item) => item.price);
            const stock = product.items.reduce((sum, item) => sum + totalStock(item.stocks), 0);
            return (
              <Card key={product.id} flush>
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <StorageImage src={product.items[0]?.images[0]?.url} alt="" className="size-14 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{product.name}</p>
                      <StatusBadge status={product.status} tone={CATALOG_STATUS_TONE[product.status]} label={CATALOG_STATUS_LABEL[product.status]} />
                    </div>
                    <p className="text-xs text-ink-muted">
                      {product.items.length} biến thể
                      {prices.length > 0 && ` · từ ${formatPrice(Math.min(...prices))}`} · tồn {stock.toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {product.status === "Active" ? (
                      <Button size="sm" variant="outline" onClick={() => changeStatus(product, "Inactive")}>
                        Ngừng bán
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => changeStatus(product, "Active")}>
                        Mở bán
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" title="Sửa" aria-label={`Sửa ${product.name}`} onClick={() => setProductForm({ open: true, product })}>
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" title="Xóa" aria-label={`Xóa ${product.name}`} className="hover:text-danger" onClick={() => setDeletingProduct(product)}>
                      <Trash2 size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" aria-expanded={open} onClick={() => toggle(product.id)}>
                      Biến thể {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </Button>
                  </div>
                </div>

                {open && (
                  <div className="border-t border-line bg-cream/30 p-4">
                    {product.description && <p className="mb-3 text-sm text-ink-soft">{product.description}</p>}
                    {product.items.length === 0 ? (
                      <p className="mb-3 text-sm text-ink-muted">Chưa có biến thể. Cần ít nhất một biến thể để mở bán.</p>
                    ) : (
                      <ul className="mb-3 divide-y divide-line rounded-lg border border-line bg-card">
                        {product.items.map((item) => (
                          <li key={item.id} className="flex flex-wrap items-center gap-3 p-3">
                            <StorageImage src={item.images[0]?.url} alt="" className="size-12 shrink-0 rounded-md" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-ink">{item.name}</p>
                              <p className="text-xs text-ink-muted">
                                {item.categoryName} · {item.fillingName} · {item.eggCount} trứng · {item.weight}g
                              </p>
                              <p className="text-xs text-ink-soft">
                                {formatPrice(item.price)} · tồn {totalStock(item.stocks).toLocaleString("vi-VN")}
                                {item.priceTiers.length > 0 && ` · ${item.priceTiers.length} bậc giá sỉ`}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <Button size="sm" variant="outline" onClick={() => setPanel({ kind: "stock", variantId: item.id })}>
                                <Package size={13} /> Kho
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setPanel({ kind: "tiers", variantId: item.id })}>
                                <Coins size={13} /> Giá sỉ
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setPanel({ kind: "images", variantId: item.id })}>
                                <ImageIcon size={13} /> Ảnh
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Sửa"
                                aria-label={`Sửa ${item.name}`}
                                onClick={() => setVariantForm({ open: true, productId: product.id, variant: item })}
                              >
                                <Pencil size={14} />
                              </Button>
                              <Button size="sm" variant="ghost" title="Xóa" aria-label={`Xóa ${item.name}`} className="hover:text-danger" onClick={() => setDeletingVariant(item)}>
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setVariantForm({ open: true, productId: product.id, variant: null })}>
                      <Plus size={14} /> Thêm biến thể
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {data && <Pager page={data} onChange={setPage} />}

      <ProductFormModal
        open={productForm.open}
        product={productForm.product}
        onClose={() => setProductForm((current) => ({ ...current, open: false }))}
        onCreated={(created) => setExpanded((current) => new Set(current).add(created.id))}
      />
      <VariantFormModal
        open={variantForm.open}
        productId={variantForm.productId}
        variant={variantForm.variant}
        onClose={() => setVariantForm((current) => ({ ...current, open: false }))}
      />
      <StockModal kind="product-items" target={panelTarget("stock")} onClose={() => setPanel(null)} />
      <TierModal kind="product-items" target={panelTarget("tiers")} onClose={() => setPanel(null)} />
      <ImagesModal kind="product-items" target={panelTarget("images")} onClose={() => setPanel(null)} />
      <ConfirmModal
        open={deletingProduct !== null}
        title="Xóa sản phẩm"
        confirmLabel="Xóa"
        loading={removeProduct.isPending}
        onConfirm={confirmDeleteProduct}
        onClose={() => setDeletingProduct(null)}
      >
        Xóa <span className="font-semibold text-ink">{deletingProduct?.name}</span> cùng {deletingProduct?.items.length ?? 0} biến thể? Sản phẩm sẽ không còn hiện
        với khách.
      </ConfirmModal>
      <ConfirmModal
        open={deletingVariant !== null}
        title="Xóa biến thể"
        confirmLabel="Xóa"
        loading={removeVariant.isPending}
        onConfirm={confirmDeleteVariant}
        onClose={() => setDeletingVariant(null)}
      >
        Xóa biến thể <span className="font-semibold text-ink">{deletingVariant?.name}</span>?
      </ConfirmModal>
    </>
  );
}
