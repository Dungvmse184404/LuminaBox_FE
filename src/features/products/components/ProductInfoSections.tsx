import { Link } from "react-router-dom";
import { BadgeCheck, MapPin, PackageCheck, Phone, Store, Truck, Wallet } from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import type { Product, ProductItem, Stock } from "../types";
import { ProductCard } from "./ProductCard";

const cardClass = "min-w-0 rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-6";
const titleClass = "mb-4 border-b border-line pb-4 font-serif text-xl font-black text-primary-dark";

export const shopLink = (product: Product) =>
  `/products?organizerId=${product.organizerId}&brand=${encodeURIComponent(product.organizerBrandName)}`;

export function SellerCard({ product }: { product: Product }) {
  return (
    <section className={cardClass} aria-labelledby="seller-title">
      <h2 id="seller-title" className={titleClass}>
        Về gian hàng
      </h2>
      <div className="flex min-w-0 items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <Store size={26} />
        </span>
        <div className="min-w-0">
          <p className="break-words font-semibold text-ink">{product.organizerBrandName}</p>
          {product.organizerContactPhone && (
            <a href={`tel:${product.organizerContactPhone}`} className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-primary">
              <Phone size={13} /> {product.organizerContactPhone}
            </a>
          )}
        </div>
      </div>
      <p className="mt-4 whitespace-pre-line break-words text-sm leading-7 text-ink-soft">
        {product.organizerBusinessInfo ?? "Gian hàng chưa thêm phần giới thiệu."}
      </p>
      <Link
        to={shopLink(product)}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-primary hover:text-primary"
      >
        <Store size={13} /> Xem sản phẩm của gian hàng
      </Link>
    </section>
  );
}

export function WhereToBuyCard({ stocks }: { stocks: Stock[] }) {
  const stalls = stocks.filter((stock) => stock.stallId);
  if (stalls.length === 0) return null;

  return (
    <section className={cardClass} aria-labelledby="where-title">
      <h2 id="where-title" className={titleClass}>
        Bạn có thể tìm đến:
      </h2>
      <ul className="max-h-[17.75rem] space-y-3 overflow-y-auto text-sm">
        {stalls.map((stock) => (
          <li key={stock.id} className="flex h-[6.5rem] min-w-0 items-start gap-3 rounded-xl bg-cream px-4 py-3">
            <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{stock.stallName}</p>
              <p className="line-clamp-2 break-words text-xs leading-5 text-ink-soft">{stock.stallAddress}</p>
              <p className="mt-1 text-xs text-ink-muted">Còn {stock.stockQuantity} sản phẩm</p>
            </div>
            <Link to={`/stalls?stall=${stock.stallId}`} className="shrink-0 text-xs font-semibold text-primary hover:underline">
              Xem bản đồ
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DescriptionCard({ product, item }: { product: Product; item: ProductItem }) {
  const rows: [string, string][] = [
    ["Loại bánh", item.categoryName],
    ["Nhân bánh", item.fillingName],
    ["Số trứng", String(item.eggCount)],
    ["Trọng lượng", `${item.weight} g`],
    ["Thương hiệu", product.organizerBrandName],
  ];

  return (
    <section id="description" className={`${cardClass} flex scroll-mt-32 flex-col lg:absolute lg:inset-0`} aria-labelledby="description-title">
      <h2 id="description-title" className={titleClass}>
        Mô tả sản phẩm
      </h2>
      {product.description ? (
        <p className="max-h-64 min-h-0 flex-1 overflow-y-auto whitespace-pre-line break-words pr-1 text-sm leading-7 text-ink-soft lg:max-h-none">{product.description}</p>
      ) : (
        <p className="flex-1 text-sm text-ink-muted">Gian hàng chưa thêm mô tả cho sản phẩm này.</p>
      )}

      <h3 className="mt-6 shrink-0 text-sm font-semibold text-ink">Thông tin sản phẩm</h3>
      <dl className="mt-2 shrink-0 overflow-hidden rounded-xl border border-line text-sm">
        {rows.map(([label, value], index) => (
          <div key={label} className={`grid grid-cols-[9rem_1fr] ${index % 2 === 0 ? "bg-cream/70" : "bg-card"}`}>
            <dt className="px-4 py-2.5 text-ink-muted">{label}</dt>
            <dd className="px-4 py-2.5 text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const COMMITMENTS = [
  { icon: BadgeCheck, title: "Gian hàng được duyệt", desc: "Mọi đối tác đều qua xét duyệt của LuminaBox" },
  { icon: Truck, title: "Giao tận nơi", desc: "Phí giao hàng tính theo địa chỉ của bạn" },
  { icon: Wallet, title: "Thanh toán khi nhận", desc: "Trả tiền khi bánh tới tay" },
  { icon: PackageCheck, title: "Đổi trả trong 7 ngày", desc: "Nếu bánh lỗi hoặc giao sai" },
] as const;

export function CommitmentBar() {
  return (
    <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Cam kết của LuminaBox">
      {COMMITMENTS.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="flex items-start gap-3 rounded-xl border border-line bg-card p-4">
          <Icon size={22} className="shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{desc}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export function RelatedProducts({ title, product, sameShop }: { title: string; product: Product; sameShop: boolean }) {
  const { data } = useProducts(sameShop ? { organizerId: product.organizerId, pageSize: 5 } : { pageSize: 24 });
  const items = (data?.items ?? [])
    .filter((p) => p.id !== product.id && (sameShop || p.organizerId !== product.organizerId))
    .slice(0, 4);

  if (items.length === 0) return null;

  return (
    <section className="mt-8" aria-label={title}>
      <h2 className="font-serif text-xl font-black text-primary-dark">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
