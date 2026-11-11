import type { ComponentType } from "react";
import { NavLink, Outlet } from "react-router-dom";
import type { LucideProps } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/cn";

export interface SideNavItem {
  to: string;
  label: string;
  icon: ComponentType<LucideProps>;
  end?: boolean;
  guide?: string;
}

interface Props {
  title: string;
  subtitle?: string | null;
  items: SideNavItem[];
}

export function SideNavLayout({ title, subtitle, items }: Props) {
  return (
    <Container className="grid gap-6 py-8 md:grid-cols-[14rem_1fr]">
      <aside className="md:sticky md:top-24 md:self-start">
        <div className="mb-3 px-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</p>
          {subtitle && <p className="mt-0.5 break-words text-sm font-semibold text-ink">{subtitle}</p>}
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {items.map(({ to, label, icon: Icon, end, guide }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-guide={guide}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive ? "bg-primary text-white shadow-primary" : "text-ink-soft hover:bg-cream-dark",
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="min-w-0">
        <Outlet />
      </section>
    </Container>
  );
}
