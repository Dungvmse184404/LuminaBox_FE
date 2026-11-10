import { useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useDistricts, useProvinces, useSaveAddress, useWards } from "@/features/address/hooks/useAddresses";
import { useAuth } from "@/features/auth/AuthContext";
import { useStalls } from "@/features/stalls/hooks/useStalls";
import { fullDate, priceText, rentalDays, toDate } from "@/features/stalls/timeline";
import { errorMessage } from "@/lib/errors";
import { clearDraft, hasPickup, usePartnerDraft } from "../draft";
import { useCreateAdditionalOnline, useCreateAdditionalStalls, useCreateOrganizerRegistration } from "../hooks/usePartner";

type Status = "idle" | "running" | "done" | "failed";

interface Task {
  key: string;
  title: string;
  detail: string;
  after?: string;
  run: () => Promise<unknown>;
}

const isoDate = (num: number) => toDate(num).toISOString().slice(0, 10);

export function PartnerConfirmPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, hasRole } = useAuth();
  const draft = usePartnerDraft();
  const { data: stalls = [] } = useStalls();
  const createRegistration = useCreateOrganizerRegistration();
  const createAdditionalStalls = useCreateAdditionalStalls();
  const createAdditionalOnline = useCreateAdditionalOnline();
  const saveAddress = useSaveAddress();
  const provinces = useProvinces();
  const { pickup } = draft;
  const districts = useDistricts(pickup.address.provinceId);
  const wards = useWards(pickup.address.districtId);
  const pickupArea = [
    wards.data?.find((w) => w.id === pickup.address.wardId)?.name,
    districts.data?.find((d) => d.id === pickup.address.districtId)?.name,
    provinces.data?.find((p) => p.id === pickup.address.provinceId)?.name,
  ]
    .filter(Boolean)
    .join(", ");

  const [status, setStatus] = useState<Record<string, Status>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const leaving = useRef(false);

  const isOrganizer = hasRole("Organization");
  const online = draft.kinds.includes("online");
  const stall = draft.kinds.includes("stall");
  const withPickup = online && hasPickup(draft);

  const rentals = useMemo(
    () =>
      (draft.rental?.items ?? []).flatMap((item) => {
        const found = stalls.find((s) => s.id === item.id);
        return found ? [{ ...item, stall: found, days: rentalDays(item), cost: found.rentalPrice * rentalDays(item) }] : [];
      }),
    [draft.rental, stalls],
  );
  const total = rentals.reduce((sum, row) => sum + row.cost, 0);

  const tasks = useMemo<Task[]>(() => {
    const profile = { brandName: draft.brandName.trim(), contactPhone: draft.contactPhone.trim(), businessInfo: draft.businessInfo.trim() || null };
    const list: Task[] = [];

    if (online) {
      list.push({
        key: "online",
        title: "Đơn bán online",
        detail: "Hoa hồng do quản trị viên đề xuất, bạn xác nhận sau",
        run: () => (isOrganizer ? createAdditionalOnline.mutateAsync() : createRegistration.mutateAsync({ type: "Online", ...profile })),
      });
    }
    if (withPickup) {
      list.push({
        key: "pickup",
        title: "Điểm lấy hàng",
        detail: pickup.address.addressLine,
        after: "online",
        run: () =>
          saveAddress.mutateAsync({
            payload: {
              type: "Pickup",
              contactName: pickup.contactName.trim(),
              phone: pickup.phone.trim(),
              wardId: pickup.address.wardId,
              addressLine: pickup.address.addressLine.trim(),
              latitude: pickup.address.latitude,
              longitude: pickup.address.longitude,
              isDefault: true,
            },
          }),
      });
    }
    if (stall && isOrganizer) {
      const groups = new Map<string, typeof rentals>();
      rentals.forEach((row) => groups.set(`${row.start}-${row.end}`, [...(groups.get(`${row.start}-${row.end}`) ?? []), row]));
      groups.forEach((group, key) =>
        list.push({
          key: `stalls-${key}`,
          title: `Thuê thêm ${group.length} quầy`,
          detail: `${group.map((row) => row.stall.name).join(", ")} · ${fullDate(group[0].start)} → ${fullDate(group[0].end)}`,
          run: () => createAdditionalStalls.mutateAsync({ stallIds: group.map((row) => row.id), startDate: isoDate(group[0].start), endDate: isoDate(group[0].end) }),
        }),
      );
    } else if (stall) {
      rentals.forEach((row) =>
        list.push({
          key: `stall-${row.id}`,
          title: `Thuê ${row.stall.name}`,
          detail: `${fullDate(row.start)} → ${fullDate(row.end)}`,
          run: () => createRegistration.mutateAsync({ type: "Stall", ...profile, stallId: row.id, startDate: isoDate(row.start), endDate: isoDate(row.end) }),
        }),
      );
    }
    return list;
  }, [draft, pickup, online, stall, withPickup, isOrganizer, rentals, createRegistration, createAdditionalStalls, createAdditionalOnline, saveAddress]);

  if (!user) return <Navigate to="/login" replace state={{ from: "/become-partner" }} />;
  if (draft.kinds.length === 0 && !leaving.current) return <Navigate to="/become-partner" replace />;

  const sending = Object.values(status).includes("running");
  const finished = tasks.length > 0 && tasks.every((task) => status[task.key] === "done");
  const missingStalls = stall && rentals.length === 0;

  const send = async () => {
    const progress: Record<string, Status> = { ...status };
    const mark = (key: string, value: Status, message?: string) => {
      progress[key] = value;
      setStatus((current) => ({ ...current, [key]: value }));
      if (message) setErrors((current) => ({ ...current, [key]: message }));
    };
    for (const task of tasks) {
      if (progress[task.key] === "done") continue;
      if (task.after && progress[task.after] !== "done") {
        mark(task.key, "failed", "Cần gửi được đơn bán online trước");
        continue;
      }
      mark(task.key, "running");
      try {
        await task.run();
        mark(task.key, "done");
      } catch (error) {
        mark(task.key, "failed", errorMessage(error, "Không gửi được."));
      }
    }
    if (tasks.every((task) => progress[task.key] === "done")) toast.success("Đã gửi đăng ký.");
  };

  const openRequests = () => {
    leaving.current = true;
    navigate("/become-partner?tab=requests");
    clearDraft();
  };

  return (
    <>
      <PageHeader title="Kiểm tra lại trước khi gửi" description="Quản trị viên sẽ duyệt từng đơn." />
      <div className="mx-auto grid max-w-3xl gap-4">
        <Card className="grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Thông tin cửa hàng</h2>
            {!finished && (
              <Link to="/become-partner" className="text-xs font-semibold text-primary hover:underline">
                Sửa
              </Link>
            )}
          </div>
          {isOrganizer ? (
            <p className="text-ink-soft">Dùng thông tin cửa hàng hiện có.</p>
          ) : (
            <dl className="grid gap-1 sm:grid-cols-[10rem_1fr]">
              <dt className="text-ink-muted">Tên thương hiệu</dt>
              <dd className="text-ink">{draft.brandName}</dd>
              <dt className="text-ink-muted">Số điện thoại</dt>
              <dd className="text-ink">{draft.contactPhone}</dd>
              <dt className="text-ink-muted">Giới thiệu</dt>
              <dd className="text-ink">{draft.businessInfo || "Không có"}</dd>
            </dl>
          )}
          {online && (
            <dl className="grid gap-1 sm:grid-cols-[10rem_1fr]">
              <dt className="text-ink-muted">Điểm lấy hàng</dt>
              <dd className="text-ink">
                {withPickup
                  ? `${pickup.contactName} · ${pickup.phone} · ${[pickup.address.addressLine, pickupArea].filter(Boolean).join(", ")}`
                  : "Chưa nhập, bổ sung trong trang cửa hàng"}
              </dd>
            </dl>
          )}
        </Card>

        {stall && (
          <Card className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">Quầy thuê</h2>
              {!finished && (
                <Link to="/become-partner/stalls" className="text-xs font-semibold text-primary hover:underline">
                  Sửa
                </Link>
              )}
            </div>
            {missingStalls ? (
              <p className="text-danger">Chưa chọn quầy nào.</p>
            ) : (
              <>
                {rentals.map((row) => (
                  <div key={row.id} className="flex flex-wrap justify-between gap-2 border-b border-line/60 py-1.5 last:border-0">
                    <span className="font-medium text-ink">{row.stall.name}</span>
                    <span className="text-ink-soft">
                      {fullDate(row.start)} → {fullDate(row.end)} · {row.days} ngày · {priceText(row.cost)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-1 font-semibold text-ink">
                  <span>Tổng tiền thuê</span>
                  <span className="text-primary">{priceText(total)}</span>
                </div>
              </>
            )}
          </Card>
        )}

        <Card className="grid gap-2 text-sm">
          <h2 className="font-semibold text-ink">Đơn sẽ được gửi</h2>
          {tasks.map((task) => (
            <div key={task.key} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-cream/30 px-3 py-2">
              <span className="min-w-0">
                <span className="block font-medium text-ink">{task.title}</span>
                <span className="block break-words text-xs text-ink-muted">{task.detail}</span>
              </span>
              {status[task.key] === "running" && <Loader2 size={16} className="animate-spin text-ink-muted" />}
              {status[task.key] === "done" && (
                <span className="flex items-center gap-1 text-xs font-semibold text-success">
                  <CheckCircle2 size={14} /> Đã gửi
                </span>
              )}
              {status[task.key] === "failed" && (
                <span className="flex items-center gap-1 text-xs font-semibold text-danger">
                  <CircleAlert size={14} /> {errors[task.key]}
                </span>
              )}
            </div>
          ))}
        </Card>

        <div className="flex flex-wrap justify-between gap-3">
          <Button variant="outline" disabled={sending} onClick={() => navigate(stall ? "/become-partner/stalls" : "/become-partner")}>
            Quay lại
          </Button>
          {finished ? (
            <Button onClick={openRequests}>Xem đơn của tôi</Button>
          ) : (
            <Button loading={sending} disabled={missingStalls || tasks.length === 0} onClick={send}>
              {Object.values(status).includes("failed") ? "Gửi lại đơn lỗi" : "Xác nhận gửi"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
