import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Globe2,
  MapPin,
  Percent,
  Plus,
  ShieldAlert,
  Sparkles,
  Store,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, SkeletonRows } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/features/auth/AuthContext";
import { authApi } from "@/features/auth/api/authApi";
import { useStalls } from "@/features/stalls/hooks/useStalls";
import { ApiError, refreshTokens } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  useCancelRegistration,
  useConfirmRegistration,
  useCreateAdditionalOnline,
  useCreateAdditionalStalls,
  useCreateOrganizerRegistration,
  useMyRegistrations,
} from "../hooks/usePartner";
import type { OrganizerRegistrationResponse, RegistrationType } from "../types";

const STATUS_LABELS: Record<string, string> = {
  Pending: "Đang chờ duyệt",
  AwaitingConfirmation: "Chờ bạn xác nhận hoa hồng",
  Approved: "Đã duyệt",
  Rejected: "Đã từ chối",
  Cancelled: "Đã hủy",
};

export function BecomePartnerPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: myRegistrations, isLoading: loadingRegistrations } = useMyRegistrations(
    undefined,
    Boolean(user),
  );
  const { data: stalls = [] } = useStalls();

  const createRegistration = useCreateOrganizerRegistration();
  const confirmRegistration = useConfirmRegistration();
  const cancelRegistration = useCancelRegistration();
  const createAdditionalStalls = useCreateAdditionalStalls();
  const createAdditionalOnline = useCreateAdditionalOnline();

  const [activeTab, setActiveTab] = useState<"register" | "my-requests">("register");

  const [regType, setRegType] = useState<RegistrationType>("Stall");
  const [brandName, setBrandName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [businessInfo, setBusinessInfo] = useState("");
  const [stallId, setStallId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedStallIds, setSelectedStallIds] = useState<string[]>([]);
  const [additionalStartDate, setAdditionalStartDate] = useState("");
  const [additionalEndDate, setAdditionalEndDate] = useState("");
  const [addStallsModalOpen, setAddStallsModalOpen] = useState(false);

  const [cancelModalItem, setCancelModalItem] = useState<OrganizerRegistrationResponse | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const isOrganization = user?.role === "Organization";
  const isManager = user?.role === "Manager";

  const availableStalls = stalls.filter((s) => s.status === "Available");

  const handleSubmitInitial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập trước khi gửi đơn đăng ký.");
      navigate("/login");
      return;
    }

    if (!brandName.trim()) {
      toast.error("Vui lòng nhập tên thương hiệu / tiệm bánh.");
      return;
    }

    const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
    if (!phoneRegex.test(contactPhone.trim())) {
      toast.error("Số điện thoại không đúng định dạng (VD: 0901234567 hoặc +84901234567).");
      return;
    }

    if (regType === "Stall") {
      if (!stallId) {
        toast.error("Vui lòng chọn gian hàng muốn thuê.");
        return;
      }
      if (!startDate || !endDate) {
        toast.error("Vui lòng chọn ngày bắt đầu và kết thúc thuê gian hàng.");
        return;
      }
      if (new Date(endDate) <= new Date(startDate)) {
        toast.error("Ngày kết thúc thuê phải sau ngày bắt đầu.");
        return;
      }
    }

    try {
      await createRegistration.mutateAsync({
        type: regType,
        brandName: brandName.trim(),
        contactPhone: contactPhone.trim(),
        businessInfo: businessInfo.trim() || null,
        stallId: regType === "Stall" ? stallId : null,
        startDate: regType === "Stall" && startDate ? startDate : null,
        endDate: regType === "Stall" && endDate ? endDate : null,
      });

      toast.success("Nộp đơn đăng ký đối tác thành công! Ban quản trị sẽ sớm xét duyệt.");
      setBrandName("");
      setContactPhone("");
      setBusinessInfo("");
      setStallId("");
      setStartDate("");
      setEndDate("");
      setActiveTab("my-requests");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không thể gửi đơn đăng ký.");
    }
  };

  const handleConfirmCommission = async (item: OrganizerRegistrationResponse) => {
    try {
      await confirmRegistration.mutateAsync(item.id);
      toast.success(`Đã xác nhận mức hoa hồng ${item.commissionRate}%! Tài khoản của bạn đã được nâng cấp lên Organization.`);
      try {
        await refreshTokens();
        const updatedUser = await authApi.me();
        setUser(updatedUser);
      } catch {
        // Fallback gracefully
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không thể xác nhận hoa hồng.");
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalItem) return;
    try {
      await cancelRegistration.mutateAsync({
        id: cancelModalItem.id,
        payload: { cancelReason: cancelReason.trim() || null },
      });
      toast.success("Đã hủy đơn đăng ký thành công.");
      setCancelModalItem(null);
      setCancelReason("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không thể hủy đơn đăng ký.");
    }
  };

  const handleRequestOnline = async () => {
    try {
      await createAdditionalOnline.mutateAsync();
      toast.success("Đã nộp đơn xin mở bán Online thành công! Vui lòng chờ xét duyệt hoa hồng.");
      setActiveTab("my-requests");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không thể gửi đơn xin mở bán Online.");
    }
  };

  const handleRequestStalls = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStallIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 gian hàng.");
      return;
    }

    if (selectedStallIds.length > 10) {
      toast.error("Tối đa được đăng ký 10 gian hàng mỗi lần.");
      return;
    }

    if (!additionalStartDate || !additionalEndDate) {
      toast.error("Vui lòng chọn ngày bắt đầu và ngày kết thúc thuê.");
      return;
    }

    if (new Date(additionalEndDate) <= new Date(additionalStartDate)) {
      toast.error("Ngày kết thúc thuê phải sau ngày bắt đầu.");
      return;
    }

    try {
      await createAdditionalStalls.mutateAsync({
        stallIds: selectedStallIds,
        startDate: additionalStartDate,
        endDate: additionalEndDate,
      });
      toast.success(`Đã gửi đơn xin thuê thêm ${selectedStallIds.length} gian hàng!`);
      setSelectedStallIds([]);
      setAdditionalStartDate("");
      setAdditionalEndDate("");
      setAddStallsModalOpen(false);
      setActiveTab("my-requests");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không thể nộp đơn xin thuê gian hàng.");
    }
  };

  const toggleStallSelect = (id: string) => {
    setSelectedStallIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="lb-page-enter space-y-6">
      <PageHeader
        title="Đồng Hành Cùng LuminaBox"
        description="Mở rộng kinh doanh bánh Trung thu truyền thống & thủ công qua gian hàng thực tế hoặc kênh bán hàng trực tuyến toàn sàn."
        actions={
          isOrganization ? (
            <Link to="/store">
              <Button variant="outline">
                <Store size={16} /> Đến trang quản lý Cửa hàng
              </Button>
            </Link>
          ) : isManager ? (
            <Link to="/admin">
              <Button variant="outline">
                <ShieldAlert size={16} /> Đến trang Quản trị viên
              </Button>
            </Link>
          ) : null
        }
      />

      {user && (
        <div className="flex border-b border-line">
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "register"
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {isOrganization ? "Nâng cấp quyền kinh doanh" : "Nộp đơn đăng ký mới"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("my-requests")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "my-requests"
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Đơn đăng ký của tôi
            {myRegistrations?.items && myRegistrations.items.length > 0 && (
              <span className="rounded-full bg-cream-dark px-2 py-0.5 text-xs text-ink-soft">
                {myRegistrations.items.length}
              </span>
            )}
          </button>
        </div>
      )}

      {activeTab === "register" ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            {isOrganization ? (
              <Card className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                    <Store size={22} />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-ink">Bạn đã là Đối tác Organizer</h2>
                    <p className="text-xs text-ink-muted">
                      Tài khoản của bạn đã được kích hoạt quyền Cửa hàng. Bạn có thể mở rộng quy mô kinh doanh dưới đây.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-line bg-cream/40 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Building2 size={18} /> Thuê thêm gian hàng
                    </div>
                    <p className="text-xs text-ink-soft">
                      Đăng ký thêm 1 hoặc nhiều gian hàng mới tại các vị trí đắc địa trên bản đồ hội chợ.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setAddStallsModalOpen(true)}
                      className="w-full"
                    >
                      <Plus size={14} /> Đăng ký thuê gian
                    </Button>
                  </div>

                  <div className="rounded-xl border border-line bg-cream/40 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Globe2 size={18} /> Mở bán Trực tuyến (Online)
                    </div>
                    <p className="text-xs text-ink-soft">
                      Bán hàng giao toàn quốc qua GHN và thanh toán thẻ Quốc tế Stripe mà không cần mở quầy.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={createAdditionalOnline.isPending}
                      onClick={handleRequestOnline}
                      className="w-full"
                    >
                      <Sparkles size={14} /> Đăng ký bán Online
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="space-y-5">
                <div>
                  <h2 className="font-serif text-lg font-bold text-ink">Đơn Đăng Ký Trở Thành Đối Tác</h2>
                  <p className="text-xs text-ink-muted">
                    Điền thông tin thương hiệu của bạn để tham gia mạng lưới nghệ nhân làm bánh LuminaBox.
                  </p>
                </div>

                <form onSubmit={handleSubmitInitial} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-ink">Hình thức đăng ký kinh doanh *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRegType("Stall")}
                        className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-left transition ${
                          regType === "Stall"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-line bg-card text-ink-soft hover:border-primary/50"
                        }`}
                      >
                        <Building2 size={18} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-sm text-ink">Thuê gian hàng (Stall)</p>
                          <p className="text-xs text-ink-muted">Mở quầy bánh thực tế tại các điểm hội chợ</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegType("Online")}
                        className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-left transition ${
                          regType === "Online"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-line bg-card text-ink-soft hover:border-primary/50"
                        }`}
                      >
                        <Globe2 size={18} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-sm text-ink">Bán trực tuyến (Online)</p>
                          <p className="text-xs text-ink-muted">Không quầy, giao toàn quốc qua bưu tá GHN</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <Input
                    label="Tên thương hiệu / Tiệm bánh *"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Ví dụ: Bánh Trung Thu Nguyệt Cát"
                  />

                  <Input
                    label="Số điện thoại liên hệ *"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="0901234567"
                  />

                  <Textarea
                    label="Thông tin giới thiệu & Giấy phép kinh doanh (Tùy chọn)"
                    rows={3}
                    value={businessInfo}
                    onChange={(e) => setBusinessInfo(e.target.value)}
                    placeholder="Mô tả các dòng bánh sở trường, chứng nhận an toàn thực phẩm, địa chỉ xưởng..."
                  />

                  {regType === "Stall" && (
                    <div className="space-y-4 rounded-xl border border-line bg-cream/30 p-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase">
                        <MapPin size={15} /> Lựa chọn gian hàng & Thời hạn thuê
                      </div>

                      <Select
                        label="Gian hàng muốn thuê *"
                        required
                        value={stallId}
                        onChange={(e) => setStallId(e.target.value)}
                      >
                        <option value="">-- Chọn gian hàng còn trống --</option>
                        {availableStalls.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.code} - {s.name} ({s.wardName}, {s.districtName}) - {formatCurrency(s.rentalPrice)}/tháng
                          </option>
                        ))}
                      </Select>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          label="Ngày bắt đầu thuê *"
                          type="date"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />

                        <Input
                          label="Ngày kết thúc thuê *"
                          type="date"
                          required
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    loading={createRegistration.isPending}
                    className="w-full"
                  >
                    Gửi Đơn Đăng Ký Xét Duyệt
                  </Button>
                </form>
              </Card>
            )}
          </div>

          <div className="space-y-4 lg:col-span-5">
            <Card className="space-y-3 bg-cream/50">
              <h3 className="font-serif text-base font-bold text-ink flex items-center gap-2">
                <Sparkles size={18} className="text-primary" /> Quyền Lợi Của Đối Tác
              </h3>
              <ul className="space-y-2 text-xs text-ink-soft">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success" />
                  <span>Tiếp cận hàng chục nghìn khách hàng yêu thích văn hóa bánh Trung thu truyền thống.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success" />
                  <span>Tự do tạo các bộ hộp quà combo linh hoạt kích thước theo đúng tiêu chuẩn sàn.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success" />
                  <span>Tự động liên kết vận chuyển bưu tá GHN lấy hàng tận xưởng/cửa hàng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success" />
                  <span>Cơ chế thanh toán quốc tế Stripe an toàn, tiền bán đối soát minh bạch về ví điện tử.</span>
                </li>
              </ul>
            </Card>

            <Card className="space-y-3">
              <h3 className="font-serif text-base font-bold text-ink flex items-center gap-2">
                <Percent size={18} className="text-primary" /> Quy Trình Xét Duyệt
              </h3>
              <div className="space-y-3 text-xs text-ink-soft">
                <div className="flex gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">1</span>
                  <p><strong>Nộp đơn:</strong> Điền form đăng ký hình thức gian hàng hoặc bán online.</p>
                </div>
                <div className="flex gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">2</span>
                  <p><strong>Thẩm định:</strong> Ban quản trị kiểm tra hồ sơ và đề xuất tỷ lệ hoa hồng (đối với Online).</p>
                </div>
                <div className="flex gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">3</span>
                  <p><strong>Xác nhận & Mở bán:</strong> Khách hàng xác nhận đồng ý hoa hồng, tài khoản tự động nâng cấp lên Organization.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {loadingRegistrations ? (
            <SkeletonRows rows={3} />
          ) : !myRegistrations || myRegistrations.items.length === 0 ? (
            <EmptyState
              title="Bạn chưa có đơn đăng ký nào"
              description="Hãy nộp đơn đăng ký để mở rộng kinh doanh cùng LuminaBox."
              action={
                <Button onClick={() => setActiveTab("register")}>
                  Tạo đơn đăng ký ngay
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4">
              {myRegistrations.items.map((item) => (
                <Card key={item.id} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-serif font-bold text-base text-ink">
                        {item.brandName}
                      </span>
                      <span className="rounded bg-cream-dark px-2 py-0.5 text-xs font-medium text-ink-soft">
                        {item.type === "Stall" ? "Thuê gian hàng" : "Bán Online"}
                      </span>
                      {item.stallCode && (
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          Gian {item.stallCode}
                        </span>
                      )}
                    </div>
                    <StatusBadge
                      status={item.status}
                      label={STATUS_LABELS[item.status] ?? item.status}
                    />
                  </div>

                  <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-ink-muted">Số điện thoại liên hệ</p>
                      <p className="font-semibold text-ink">{item.contactPhone || "—"}</p>
                    </div>

                    <div>
                      <p className="text-ink-muted">Thời gian gửi đơn</p>
                      <p className="font-semibold text-ink">{formatDateTime(item.createdAt)}</p>
                    </div>

                    <div>
                      <p className="text-ink-muted">Tỷ lệ hoa hồng sàn</p>
                      <p className="font-semibold text-ink">
                        {item.commissionRate !== null ? `${item.commissionRate}%` : "Chờ quản trị viên đề xuất"}
                      </p>
                    </div>

                    <div>
                      <p className="text-ink-muted">Thời hạn thuê (nếu có)</p>
                      <p className="font-semibold text-ink">
                        {item.startDate && item.endDate
                          ? `${item.startDate} → ${item.endDate}`
                          : "Không thời hạn"}
                      </p>
                    </div>
                  </div>

                  {item.businessInfo && (
                    <div className="rounded-lg bg-cream/40 p-3 text-xs text-ink-soft">
                      <span className="font-semibold text-ink">Thông tin giới thiệu: </span>
                      {item.businessInfo}
                    </div>
                  )}

                  {item.status === "AwaitingConfirmation" && item.commissionRate !== null && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3.5 text-xs">
                      <div className="space-y-1">
                        <p className="font-bold text-ink flex items-center gap-1.5">
                          <AlertCircle size={15} className="text-warning" /> Ban quản trị đã duyệt với mức hoa hồng {item.commissionRate}%
                        </p>
                        <p className="text-ink-soft">
                          Vui lòng kiểm tra và xác nhận đồng ý với tỷ lệ hoa hồng bán Online để hoàn tất kích hoạt.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          loading={confirmRegistration.isPending}
                          onClick={() => handleConfirmCommission(item)}
                        >
                          <CheckCircle2 size={14} /> Đồng ý hoa hồng
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCancelModalItem(item)}
                        >
                          Hủy đơn
                        </Button>
                      </div>
                    </div>
                  )}

                  {item.status === "Rejected" && item.rejectReason && (
                    <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                      <strong>Lý do từ chối: </strong>{item.rejectReason}
                    </div>
                  )}

                  {item.status === "Cancelled" && item.cancelReason && (
                    <div className="rounded-lg border border-line bg-cream-dark p-3 text-xs text-ink-muted">
                      <strong>Lý do hủy đơn: </strong>{item.cancelReason}
                    </div>
                  )}

                  {item.status === "Pending" && (
                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setCancelModalItem(item)}
                        className="text-danger hover:bg-danger/10"
                      >
                        <XCircle size={14} /> Hủy đơn này
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        open={addStallsModalOpen}
        title="Đăng Ký Thuê Thêm Gian Hàng"
        onClose={() => setAddStallsModalOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setAddStallsModalOpen(false)}>
              Đóng
            </Button>
            <Button
              loading={createAdditionalStalls.isPending}
              onClick={handleRequestStalls}
            >
              Gửi Đơn Thuê Gian
            </Button>
          </>
        }
      >
        <form onSubmit={handleRequestStalls} className="space-y-4">
          <p className="text-xs text-ink-soft">
            Chọn các gian hàng còn trống mà cửa hàng muốn thuê thêm.
          </p>

          <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {availableStalls.length === 0 ? (
              <p className="text-xs text-ink-muted">Hiện tại không còn gian hàng nào trống.</p>
            ) : (
              availableStalls.map((stall) => {
                const selected = selectedStallIds.includes(stall.id);
                return (
                  <label
                    key={stall.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-xs transition ${
                      selected ? "border-primary bg-primary/5" : "border-line bg-card"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleStallSelect(stall.id)}
                      className="mt-0.5 accent-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between font-semibold text-ink">
                        <span>{stall.code} - {stall.name}</span>
                        <span className="text-primary font-bold">{formatCurrency(stall.rentalPrice)}/tháng</span>
                      </div>
                      <p className="text-ink-muted mt-0.5">{stall.addressLine}, {stall.wardName}, {stall.districtName}</p>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Ngày bắt đầu *"
              type="date"
              required
              value={additionalStartDate}
              onChange={(e) => setAdditionalStartDate(e.target.value)}
            />
            <Input
              label="Ngày kết thúc *"
              type="date"
              required
              value={additionalEndDate}
              onChange={(e) => setAdditionalEndDate(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(cancelModalItem)}
        title="Xác Nhận Hủy Đơn Đăng Ký"
        onClose={() => setCancelModalItem(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelModalItem(null)}>
              Quay lại
            </Button>
            <Button
              variant="danger"
              loading={cancelRegistration.isPending}
              onClick={handleConfirmCancel}
            >
              Xác Nhận Hủy
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">
            Bạn có chắc chắn muốn hủy đơn đăng ký cho thương hiệu <strong>{cancelModalItem?.brandName}</strong>?
          </p>
          <Textarea
            label="Lý do hủy đơn (Tùy chọn)"
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Nhập lý do muốn hủy đơn..."
          />
        </div>
      </Modal>
    </div>
  );
}
