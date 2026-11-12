import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, MapPin, Package, ShieldCheck, Store, Ticket, User, UserCog } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";

const itemClass = "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft transition hover:bg-primary-soft hover:text-primary";
const triggerClass = "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-primary-soft transition hover:text-white";

export function AccountMenu() {
  const { user, hasRole, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) {
    return (
      <Link to="/login" className={triggerClass}>
        <User size={20} />
        <span className="hidden text-[11px] sm:block">Đăng nhập</span>
      </Link>
    );
  }

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        data-guide="account-menu"
        className={triggerClass}
      >
        <User size={20} />
        <span className="hidden max-w-24 truncate text-[11px] sm:block">{user.fullName}</span>
      </button>

      {open && (
        <div role="menu" className="lb-fade-in absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-line bg-card p-2 shadow-pop">
          <Link to="/account/profile" onClick={close} className={itemClass} data-guide="account-menu-profile">
            <UserCog size={16} /> Hồ sơ của tôi
          </Link>
          <Link to="/orders" onClick={close} className={itemClass} data-guide="account-menu-orders">
            <Package size={16} /> Đơn hàng của tôi
          </Link>
          <Link to="/vouchers" onClick={close} className={itemClass} data-guide="account-menu-vouchers">
            <Ticket size={16} /> Voucher của tôi
          </Link>
          <Link to="/account/addresses" onClick={close} className={itemClass} data-guide="account-menu-addresses">
            <MapPin size={16} /> Sổ địa chỉ
          </Link>
          {hasRole("Organization") && (
            <Link to="/store" onClick={close} className={itemClass} data-guide="account-menu-store">
              <Store size={16} /> Cửa hàng của tôi
            </Link>
          )}
          {hasRole("Manager") && (
            <Link to="/admin" onClick={close} className={itemClass} data-guide="account-menu-admin">
              <ShieldCheck size={16} /> Quản trị
            </Link>
          )}
          <button
            type="button"
            data-guide-kind="danger"
            onClick={() => {
              close();
              logout();
            }}
            className={`${itemClass} w-full`}
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
