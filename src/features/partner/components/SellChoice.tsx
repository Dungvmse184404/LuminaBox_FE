import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Globe2, Store } from "lucide-react";
import { CornerFrame } from "@/components/ornament/CornerOrnament";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormField";
import {
  ContactAddressFields,
  PHONE_PATTERN,
  validateContactAddress,
  type ContactAddressErrors,
} from "@/features/address/components/ContactAddressFields";
import { useAuth } from "@/features/auth/AuthContext";
import { cn } from "@/lib/cn";
import { hasPickup, updateDraft, usePartnerDraft, type SellKind } from "../draft";

const OPTIONS: { kind: SellKind; icon: typeof Store; title: string; text: string; meta: string }[] = [
  {
    kind: "stall",
    icon: Store,
    title: "Thuê quầy",
    text: "Bán trực tiếp tại quầy trong mùa lễ, quản lý số lượng và loại bánh ở từng quầy.",
    meta: "Trả tiền thuê theo ngày · Bánh không hiện ở trang Sản phẩm nếu chỉ thuê quầy",
  },
  {
    kind: "online",
    icon: Globe2,
    title: "Bán online",
    text: "Đăng bán trên sàn, giao toàn quốc qua GHN, nhận thanh toán thẻ hoặc khi nhận hàng.",
    meta: "Hoa hồng trên mỗi đơn hoàn tất · Quản trị viên đề xuất khi duyệt",
  },
];

function Reveal({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={cn("grid transition-[grid-template-rows] duration-500 ease-soft", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")} inert={!open}>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

interface Errors {
  brandName?: string;
  contactPhone?: string;
  pickup?: ContactAddressErrors | null;
}

export function SellChoice() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const draft = usePartnerDraft();
  const [errors, setErrors] = useState<Errors>({});

  const isOrganizer = hasRole("Organization");
  const picked = new Set(draft.kinds);
  const online = picked.has("online");
  const stall = picked.has("stall");

  const toggle = (kind: SellKind) => {
    const kinds = picked.has(kind) ? draft.kinds.filter((k) => k !== kind) : [...draft.kinds, kind];
    updateDraft({ kinds: OPTIONS.map((o) => o.kind).filter((k) => kinds.includes(k)) });
  };

  const validate = () => {
    const next: Errors = {};
    if (!isOrganizer) {
      if (!draft.brandName.trim()) next.brandName = "Vui lòng nhập tên thương hiệu";
      if (!PHONE_PATTERN.test(draft.contactPhone.trim())) next.contactPhone = "Số điện thoại không hợp lệ";
    }
    if (online && hasPickup(draft)) next.pickup = validateContactAddress(draft.pickup);
    setErrors(next);
    return !next.brandName && !next.contactPhone && !next.pickup;
  };

  const next = () => {
    if (!validate()) return;
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    navigate(stall ? "/become-partner/stalls" : "/become-partner/confirm");
  };

  return (
    <section aria-labelledby="sell-title" className="relative overflow-hidden rounded-2xl border border-line bg-card p-6 shadow-card sm:p-8">
      <CornerFrame corners={["tr"]} className="rounded-2xl" />
      <h2 id="sell-title" className="font-serif text-2xl font-black text-primary-dark">
        {isOrganizer ? "Mở rộng việc bán hàng" : "Trở thành đối tác của LuminaBox"}
      </h2>
      <p className="mt-1 text-sm text-ink-soft">{isOrganizer ? "Thuê thêm quầy hoặc đăng ký bán online." : "Bán tại quầy, bán online hoặc cả hai."}</p>

      <div className={cn("mt-6 overflow-hidden rounded-xl border bg-cream/30 transition-colors duration-300", picked.size ? "border-gold-deep/40" : "border-line")}>
        <div className="grid sm:grid-cols-2">
          {OPTIONS.map(({ kind, icon: Icon, title, text, meta }, index) => {
            const on = picked.has(kind);
            const fromLeft = index === 0;
            return (
              <button key={kind} type="button" aria-pressed={on} onClick={() => toggle(kind)} className="group relative overflow-hidden p-6 text-left">
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-0 from-primary-soft via-primary-soft/70 to-gold/25 transition-transform duration-700 ease-soft",
                    fromLeft ? "origin-left bg-gradient-to-r" : "origin-right bg-gradient-to-l",
                    on ? "scale-x-100" : "scale-x-0",
                  )}
                />
                <span aria-hidden className="absolute inset-0 bg-gold/5 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="relative block">
                  <span className="flex items-start justify-between gap-3">
                    <span className={cn("grid size-11 place-items-center rounded-full transition-colors duration-300", on ? "bg-primary text-white" : "bg-primary-soft text-primary")}>
                      <Icon size={21} />
                    </span>
                    <span className={cn("grid size-6 place-items-center rounded-full border-2 transition-colors duration-300", on ? "border-primary bg-primary text-white" : "border-line text-transparent")}>
                      <Check size={14} strokeWidth={3} />
                    </span>
                  </span>
                  <span className={cn("mt-3 block text-base font-bold", on ? "text-primary-dark" : "text-ink")}>{title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{text}</span>
                  <span className="mt-2 block text-xs text-ink-muted">{meta}</span>
                </span>
              </button>
            );
          })}
        </div>

        <Reveal open={picked.size > 0}>
          <div className="grid gap-4 border-t border-line bg-card/70 p-5 sm:p-6">
            {!isOrganizer && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Tên thương hiệu"
                  required
                  value={draft.brandName}
                  error={errors.brandName}
                  placeholder="Ví dụ: Bánh Trung Thu Nguyệt Cát"
                  onChange={(e) => updateDraft({ brandName: e.target.value })}
                />
                <Input
                  label="Số điện thoại"
                  required
                  inputMode="tel"
                  value={draft.contactPhone}
                  error={errors.contactPhone}
                  placeholder="0901234567"
                  onChange={(e) => updateDraft({ contactPhone: e.target.value })}
                />
                <Textarea
                  className="sm:col-span-2"
                  label="Giới thiệu"
                  hint="Không bắt buộc"
                  rows={2}
                  value={draft.businessInfo}
                  placeholder="Dòng bánh sở trường, chứng nhận an toàn thực phẩm"
                  onChange={(e) => updateDraft({ businessInfo: e.target.value })}
                />
              </div>
            )}

            <Reveal open={online}>
              <fieldset className="grid gap-3 rounded-xl border border-line bg-cream/40 p-4">
                <legend className="px-1 text-xs font-bold uppercase tracking-wide text-primary">Điểm lấy hàng</legend>
                <p className="-mt-1 text-xs text-ink-muted">Không bắt buộc. Nơi GHN đến lấy hàng cho đơn online.</p>
                {online && <ContactAddressFields required={false} value={draft.pickup} errors={errors.pickup} onChange={(pickup) => updateDraft({ pickup })} />}
              </fieldset>
            </Reveal>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-ink-soft">
                Đã chọn: {OPTIONS.filter((o) => picked.has(o.kind)).map((o) => o.title).join(" và ")}
              </span>
              <Button onClick={next}>{stall ? "Tiếp tục chọn quầy" : "Tiếp tục"}</Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
