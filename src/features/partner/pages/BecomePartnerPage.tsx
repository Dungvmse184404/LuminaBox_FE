import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShieldAlert, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthContext";
import { cn } from "@/lib/cn";
import { MyRegistrations } from "../components/MyRegistrations";
import { SellChoice } from "../components/SellChoice";
import { updateDraft, usePartnerDraft, type SellKind } from "../draft";
import { useMyRegistrations } from "../hooks/usePartner";

const KINDS: SellKind[] = ["stall", "online"];

export function BecomePartnerPage() {
  const { user, hasRole } = useAuth();
  const draft = usePartnerDraft();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "requests" && user ? "requests" : "register";
  const { data: mine } = useMyRegistrations(undefined, Boolean(user));

  useEffect(() => {
    const type = params.get("type") as SellKind | null;
    if (type && KINDS.includes(type) && draft.kinds.length === 0) updateDraft({ kinds: [type] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const show = (next: "register" | "requests") => setParams(next === "requests" ? { tab: "requests" } : {}, { replace: true });

  if (hasRole("Manager")) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <ShieldAlert size={18} className="text-primary" /> Tài khoản quản lý duyệt đơn đối tác trong trang quản trị.
        </p>
        <Link to="/admin/registrations">
          <Button variant="outline">Đến trang duyệt đơn</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {user && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line">
          <div className="flex">
            {(
              [
                ["register", hasRole("Organization") ? "Mở rộng bán hàng" : "Đăng ký"],
                ["requests", "Đơn đăng ký của tôi"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => show(key)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition",
                  tab === key ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                {label}
                {key === "requests" && mine && mine.items.length > 0 && (
                  <span className="rounded-full bg-cream-dark px-2 py-0.5 text-xs text-ink-soft">{mine.items.length}</span>
                )}
              </button>
            ))}
          </div>
          {hasRole("Organization") && (
            <Link to="/store" className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              <Store size={15} /> Trang cửa hàng
            </Link>
          )}
        </div>
      )}

      {tab === "requests" ? <MyRegistrations onCreate={() => show("register")} /> : <SellChoice />}
    </div>
  );
}
