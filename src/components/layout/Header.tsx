import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { ChevronDown, Menu, Moon, ShoppingCart, Truck, Undo2, X } from "lucide-react";
import { useCategories } from "@/features/catalog/hooks/useCategories";
import { cn } from "@/lib/cn";
import { AccountMenu } from "./AccountMenu";
import { Container } from "./Container";
import { EffectSettingsMenu } from "./EffectSettingsMenu";
import { HeaderSearch } from "./HeaderSearch";

const NAV_ITEMS = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/cake-sets", label: "Bánh & hộp Trung thu" },
  { to: "/products", label: "Sản phẩm" },
  { to: "/stalls", label: "Gian hàng" },
  { to: "/become-partner", label: "Trở thành đối tác" },
  { to: "/#about", label: "Giới thiệu" },
];

const CATEGORY_QUERY = { pageSize: 50, sortBy: "name", isDescending: false };

export function Header() {
  const { data: categories } = useCategories(CATEGORY_QUERY);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-b from-chrome to-chrome-light text-primary-soft shadow-md">
      <div className="relative hidden border-b border-white/10 bg-black/15 text-xs text-primary-soft/80 md:block">
        <Container className="flex h-8 items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Truck size={14} /> Miễn phí vận chuyển từ 500.000đ
            </span>
            <span className="flex items-center gap-1.5">
              <Undo2 size={14} /> Đổi trả trong 7 ngày
            </span>
          </div>
          <span>Tiếng Việt</span>
        </Container>
      </div>

      <Container className="relative flex h-14 items-center gap-4 lg:gap-8">
        <button type="button" className="rounded p-1.5 text-primary-soft lg:hidden" onClick={() => setMenuOpen((value) => !value)} aria-label="Mở menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-primary-soft text-primary-dark shadow-primary">
            <Moon size={17} />
          </span>
          <span className="font-serif text-xl font-black text-white">LuminaBox</span>
        </Link>

        <HeaderSearch className="hidden min-w-0 flex-1 sm:block" />

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <EffectSettingsMenu />
          <AccountMenu />
          <IconLink to="/cart" icon={<ShoppingCart size={20} />} label="Giỏ hàng" />
        </div>
      </Container>

      <div className="relative hidden border-t border-white/10 lg:block">
        <Container className="relative flex h-10 items-center gap-8">
          <button
            type="button"
            onClick={() => setCategoriesOpen((value) => !value)}
            className="flex items-center gap-2 text-sm font-medium text-primary-soft transition hover:text-white"
          >
            <Menu size={18} /> Danh mục <ChevronDown size={14} />
          </button>
          {categoriesOpen && (
            <div className="lb-fade-in absolute left-4 top-10 z-50 w-56 rounded-xl border border-line bg-card p-2 shadow-pop sm:left-6 lg:left-8">
              {categories?.items.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?categoryId=${category.id}`}
                  onClick={() => setCategoriesOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-primary-soft hover:text-primary"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}
          <nav className="flex items-center gap-7 text-sm font-medium">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "border-b-2 py-2 transition-colors",
                    isActive && !item.to.includes("#") ? "border-gold text-white" : "border-transparent text-primary-soft/85 hover:text-white",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </Container>
      </div>

      <div className="lb-hairline" />

      {menuOpen && (
        <nav className="border-t border-white/10 bg-chrome px-4 py-3 lg:hidden">
          <HeaderSearch className="mb-3 sm:hidden" />
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-primary-soft/90 hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function IconLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-primary-soft transition hover:text-white">
      {icon}
      <span className="hidden text-[11px] sm:block">{label}</span>
    </Link>
  );
}
