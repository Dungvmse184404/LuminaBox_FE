import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, ClipboardCheck, ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { imageSrc } from "@/lib/storage";
import { cn } from "@/lib/cn";

const IMAGES = {
  giftbox: "home-page/banner-giftbox.jpg",
  giftboxDark: "home-page/banner-giftbox1.png",
  becomeSeller: "home-page/banner-become-a-seller.webp",
  toProducts: "home-page/banner-to-products.webp",
};

const TILE = "group relative flex h-[200px] overflow-hidden rounded-card shadow-card lg:h-auto";

function TileImage({ path, restOpacity }: { path: string; restOpacity: string }) {
  const src = imageSrc(path);
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
      className={cn("absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-[0.12]", restOpacity)}
    />
  );
}

interface TileProps {
  to: string;
  image: string;
  icon: ReactNode;
  title: string;
  description: string;
  cta: string;
  tone?: "light" | "red";
}

const TONE = {
  light: {
    surface: "from-cream-dark to-primary-soft",
    imageOpacity: "opacity-35",
    wash: "from-cream-dark/90 via-cream-dark/30 to-transparent",
    title: "text-primary-dark",
    description: "text-ink-soft",
    cta: "text-primary",
  },
  red: {
    surface: "from-primary to-primary-dark",
    imageOpacity: "opacity-30",
    wash: "from-primary-dark/90 via-primary-dark/40 to-transparent",
    title: "text-white",
    description: "text-white/85",
    cta: "text-primary-soft",
  },
} as const;

function Tile({ to, image, icon, title, description, cta, tone = "light" }: TileProps) {
  const t = TONE[tone];
  return (
    <Link to={to} className={cn(TILE, "flex-col justify-end bg-gradient-to-br p-5", t.surface)}>
      <TileImage path={image} restOpacity={t.imageOpacity} />
      <div className={cn("absolute inset-0 bg-gradient-to-t", t.wash)} />
      <span
        aria-hidden
        className="absolute right-5 top-5 grid size-12 scale-90 place-items-center rounded-full bg-card/90 text-primary opacity-0 shadow-md transition duration-300 group-hover:scale-100 group-hover:opacity-100"
      >
        {icon}
      </span>
      <div className="relative">
        <h3 className={cn("font-serif text-lg font-black", t.title)}>{title}</h3>
        <p className={cn("mt-1 text-sm", t.description)}>{description}</p>
        <span className={cn("mt-3 flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2", t.cta)}>
          {cta} <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

export function FeatureTiles() {
  const { hasRole } = useAuth();
  const isManager = hasRole("Manager");
  const isOrganizer = hasRole("Organization");
  const iconProps = { size: 24, strokeWidth: 1.75 };

  const first = isManager
    ? { to: "/admin", icon: <ShieldCheck {...iconProps} />, title: "Quản trị sàn", description: "Duyệt đơn, gian hàng và Organizer", cta: "Vào trang quản trị" }
    : isOrganizer
      ? { to: "/store", icon: <Store {...iconProps} />, title: "Quản lý cửa hàng", description: "Sản phẩm, hợp đồng thuê, hồ sơ của bạn", cta: "Vào trang quản lý" }
      : { to: "/become-partner", icon: <Store {...iconProps} />, title: "Trở thành đối tác", description: "Thuê gian hàng hoặc bán online cùng LuminaBox", cta: "Đăng ký ngay" };

  const second = isManager
    ? { to: "/admin/catalog", icon: <ClipboardCheck {...iconProps} />, title: "Loại bánh & nhân", description: "Danh mục nền để Organizer chọn.", cta: "Quản lý danh mục" }
    : isOrganizer
      ? { to: "/store/products", icon: <BarChart3 {...iconProps} />, title: "Sản phẩm của bạn", description: "Thêm, sửa và quản lý tồn kho sản phẩm.", cta: "Quản lý sản phẩm" }
      : { to: "/products", icon: <ShoppingBag {...iconProps} />, title: "Mua sắm ngay", description: "Tìm bánh theo vị, giá và gian hàng. Áp voucher khi thanh toán.", cta: "Xem danh sách" };

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-[210px_200px]">
      <Link
        to="/cake-sets"
        className={cn(TILE, "flex-col justify-end bg-gradient-to-br from-chrome-deep via-[#4a1a1d] to-chrome p-6 text-white lg:col-span-2")}
      >
        <TileImage path={IMAGES.giftbox} restOpacity="opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-chrome-deep/85 via-chrome-deep/25 to-transparent" />        <div className="relative">
          <h3 className="font-serif text-2xl font-black">Bộ sưu tập hộp quà</h3>
          <p className="mt-2 max-w-lg text-sm text-white/85">Chọn từng chiếc bánh nướng, bánh dẻo hoặc tự phối hộp quà theo khẩu vị của gia đình bạn.</p>
          <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-semibold text-primary-dark transition-all group-hover:gap-3">
            Chọn bánh và hộp bánh <ArrowRight size={16} />
          </span>
        </div>
      </Link>

      <Link to="/products" className={cn(TILE, "flex-col justify-between bg-gradient-to-b from-primary-soft to-cream-dark p-5 lg:row-span-2")}>
        <TileImage path={IMAGES.giftboxDark} restOpacity="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-soft/95 via-primary-soft/20 to-transparent" />
        <span className="relative w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">Mới ra mắt</span>
        <div className="relative">
          <h3 className="font-serif text-lg font-black text-primary-dark">Hộp quà Trung thu mới</h3>
          <p className="mt-1 text-sm text-ink-soft">Những bộ quà tặng vừa lên kệ mùa này.</p>
          <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary transition-all group-hover:gap-2">
            Xem ngay <ArrowRight size={14} />
          </span>
        </div>
      </Link>

      <Tile {...first} image={IMAGES.becomeSeller} />
      <Tile {...second} image={IMAGES.toProducts} tone="red" />
    </div>
  );
}
