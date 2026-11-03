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
}

interface Props {
  title: string;
  items: SideNavItem[];
}

export function SideNavLayout({ title, items }: Props) {
  return (
    <Container className="grid gap-6 py-8 md:grid-cols-[14rem_1fr]">
      <aside className="md:sticky md:top-24 md:self-start">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</p>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
