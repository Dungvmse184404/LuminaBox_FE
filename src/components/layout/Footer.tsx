import { Link } from "react-router-dom";
import { Moon } from "lucide-react";
import { CornerFrame } from "@/components/ornament/CornerOrnament";
import { Container } from "./Container";

const CUSTOMER_LINKS = [
  { to: "/help/ordering", label: "Hướng dẫn đặt hàng" },
  { to: "/policies/returns", label: "Chính sách đổi trả" },
  { to: "/vouchers", label: "Voucher và khuyến mãi" },
];

const PARTNER_LINKS = [
  { to: "/become-partner?type=stall", label: "Thuê gian hàng" },
  { to: "/become-partner?type=online", label: "Bán online cùng LuminaBox" },
  { to: "/policies/commission", label: "Chính sách hoa hồng" },
];

function LinkColumn({ title, links }: { title: string; links: Array<{ to: string; label: string }> }) {
  return (
    <div className="text-sm">
      <h3 className="mb-3 font-semibold text-white">{title}</h3>
      <ul className="space-y-2 text-primary-soft/80">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="transition hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <footer data-guide-scope="global" className="relative z-10 bg-chrome py-2 text-center text-xs text-primary-soft/70">
        © {new Date().getFullYear()} LuminaBox
      </footer>
    );
  }

  return (
    <footer data-guide-scope="global" className="relative z-10 mt-12 bg-chrome text-primary-soft shadow-[0_-10px_24px_rgba(0,0,0,0.08)]">
      <div className="lb-hairline" />
      <CornerFrame size="edge" corners={["bl", "br"]} />
      <Container className="relative grid gap-8 py-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-serif text-xl font-black text-white">
            <Moon size={20} /> LuminaBox
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-primary-soft/80">
            Sàn thương mại bánh Trung thu nhiều gian hàng. LuminaBox kết nối các gian hàng đối tác để khách mua bánh và hộp trong một lần thanh toán.
          </p>
        </div>
        <LinkColumn title="Dành cho khách hàng" links={CUSTOMER_LINKS} />
        <LinkColumn title="Dành cho đối tác" links={PARTNER_LINKS} />
      </Container>
      <div className="relative border-t border-white/10 py-3 text-center text-xs text-primary-soft/60">© {new Date().getFullYear()} LuminaBox. Dự án PRN232.</div>
    </footer>
  );
}
