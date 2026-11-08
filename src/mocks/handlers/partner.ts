import type {
  ApproveOrganizerRegistrationRequest,
  CancelOrganizerRegistrationRequest,
  CreateAdditionalStallsRequest,
  CreateOrganizerRegistrationRequest,
  OrganizerRegistrationResponse,
  RegistrationStatus,
  RegistrationType,
  RejectOrganizerRegistrationRequest,
} from "@/features/partner/types";
import { mock, mockError, newId, paginate } from "@/mocks/server";

const DEMO_USER_ID = "00000000-0000-7000-8000-000000000001";

const demoStallA1 = {
  id: "55555555-5555-4555-8555-555555555501",
  code: "STALL-A1",
  name: "Gian hàng Nguyệt Các A1",
};

const demoStallB1 = {
  id: "55555555-5555-4555-8555-555555555502",
  code: "STALL-B1",
  name: "Gian hàng Phố Cổ B1",
};

const registrations: OrganizerRegistrationResponse[] = [
  {
    id: "reg-001",
    userId: DEMO_USER_ID,
    userFullName: "Nguyễn Minh Anh",
    userEmail: "buyer@luminabox.vn",
    type: "Online",
    stallId: null,
    stallCode: null,
    stallName: null,
    organizerId: "11111111-1111-4111-8111-111111111101",
    brandName: "Bánh Trung Thu Nguyệt Cát",
    contactPhone: "0909123456",
    businessInfo: "Thương hiệu bánh gia truyền 3 đời tại Hà Nội, chuyên bánh nướng thập cẩm và bánh dẻo hạt sen.",
    startDate: null,
    endDate: null,
    commissionRate: 10,
    status: "AwaitingConfirmation",
    reviewedBy: "manager-demo-id",
    reviewedAt: "2026-11-05T10:00:00Z",
    rejectReason: null,
    confirmedAt: null,
    cancelledAt: null,
    cancelReason: null,
    createdAt: "2026-11-04T08:30:00Z",
  },
  {
    id: "reg-002",
    userId: DEMO_USER_ID,
    userFullName: "Nguyễn Minh Anh",
    userEmail: "buyer@luminabox.vn",
    type: "Stall",
    stallId: demoStallA1.id,
    stallCode: demoStallA1.code,
    stallName: demoStallA1.name,
    organizerId: "11111111-1111-4111-8111-111111111101",
    brandName: "Kinh Đô Gia Truyền",
    contactPhone: "0988765432",
    businessInfo: "Gian hàng phục vụ khách tham quan hội chợ trực tiếp.",
    startDate: "2026-08-01",
    endDate: "2026-11-01",
    commissionRate: null,
    status: "Approved",
    reviewedBy: "manager-demo-id",
    reviewedAt: "2026-07-20T14:00:00Z",
    rejectReason: null,
    confirmedAt: null,
    cancelledAt: null,
    cancelReason: null,
    createdAt: "2026-07-15T09:00:00Z",
  },
];

mock("GET", "/organizer-registrations/me", ({ query }) => {
  const search = query.get("search")?.trim().toLowerCase();
  const type = query.get("type") as RegistrationType | null;
  const status = query.get("status") as RegistrationStatus | null;

  const filtered = registrations.filter((r) => {
    if (r.userId !== DEMO_USER_ID) return false;
    if (type && r.type !== type) return false;
    if (status && r.status !== status) return false;
    if (search && !r.brandName.toLowerCase().includes(search)) return false;
    return true;
  });

  return paginate(filtered, query);
});

mock("POST", "/organizer-registrations", ({ body }): OrganizerRegistrationResponse => {
  const payload = body as CreateOrganizerRegistrationRequest;
  const stall = payload.stallId ? demoStallA1 : null;

  const created: OrganizerRegistrationResponse = {
    id: newId(),
    userId: DEMO_USER_ID,
    userFullName: "Nguyễn Minh Anh",
    userEmail: "buyer@luminabox.vn",
    type: payload.type,
    stallId: stall ? stall.id : null,
    stallCode: stall ? stall.code : null,
    stallName: stall ? stall.name : null,
    organizerId: null,
    brandName: payload.brandName,
    contactPhone: payload.contactPhone,
    businessInfo: payload.businessInfo || null,
    startDate: payload.startDate || null,
    endDate: payload.endDate || null,
    commissionRate: null,
    status: "Pending",
    reviewedBy: null,
    reviewedAt: null,
    rejectReason: null,
    confirmedAt: null,
    cancelledAt: null,
    cancelReason: null,
    createdAt: new Date().toISOString(),
  };

  registrations.unshift(created);
  return created;
});

mock("PUT", "/organizer-registrations/:id/confirm", ({ params }): OrganizerRegistrationResponse => {
  const item = registrations.find((r) => r.id === params.id);
  if (!item) throw mockError(404, "Không tìm thấy đơn đăng ký.");
  if (item.status !== "AwaitingConfirmation") {
    throw mockError(409, "Chỉ có thể xác nhận đơn đang chờ xác nhận hoa hồng.");
  }

  item.status = "Approved";
  item.confirmedAt = new Date().toISOString();
  return item;
});

mock("PUT", "/organizer-registrations/:id/cancel", ({ params, body }): OrganizerRegistrationResponse => {
  const item = registrations.find((r) => r.id === params.id);
  if (!item) throw mockError(404, "Không tìm thấy đơn đăng ký.");
  if (item.status === "Approved" || item.status === "Rejected" || item.status === "Cancelled") {
    throw mockError(409, "Không thể hủy đơn đã hoàn tất hoặc bị từ chối.");
  }

  const payload = body as CancelOrganizerRegistrationRequest | undefined;
  item.status = "Cancelled";
  item.cancelledAt = new Date().toISOString();
  item.cancelReason = payload?.cancelReason || "Người nộp đơn tự hủy";
  return item;
});

mock("POST", "/organizer-registrations/additional-stalls", ({ body }): OrganizerRegistrationResponse[] => {
  const payload = body as CreateAdditionalStallsRequest;
  const createdList: OrganizerRegistrationResponse[] = [];
  const now = new Date().toISOString();

  for (const sid of payload.stallIds) {
    const stall = demoStallB1.id === sid ? demoStallB1 : demoStallA1;
    const item: OrganizerRegistrationResponse = {
      id: newId(),
      userId: DEMO_USER_ID,
      userFullName: "Nguyễn Minh Anh",
      userEmail: "buyer@luminabox.vn",
      type: "Stall",
      stallId: stall.id,
      stallCode: stall.code,
      stallName: stall.name,
      organizerId: "11111111-1111-4111-8111-111111111101",
      brandName: "Kinh Đô Gia Truyền",
      contactPhone: "0909123456",
      businessInfo: "Thuê thêm gian hàng phục vụ lễ hội",
      startDate: payload.startDate || null,
      endDate: payload.endDate || null,
      commissionRate: null,
      status: "Pending",
      reviewedBy: null,
      reviewedAt: null,
      rejectReason: null,
      confirmedAt: null,
      cancelledAt: null,
      cancelReason: null,
      createdAt: now,
    };
    registrations.unshift(item);
    createdList.push(item);
  }

  return createdList;
});

mock("POST", "/organizer-registrations/additional-online", (): OrganizerRegistrationResponse => {
  const created: OrganizerRegistrationResponse = {
    id: newId(),
    userId: DEMO_USER_ID,
    userFullName: "Nguyễn Minh Anh",
    userEmail: "buyer@luminabox.vn",
    type: "Online",
    stallId: null,
    stallCode: null,
    stallName: null,
    organizerId: "11111111-1111-4111-8111-111111111101",
    brandName: "Kinh Đô Gia Truyền",
    contactPhone: "0909123456",
    businessInfo: "Đăng ký mở bán trực tuyến toàn sàn",
    startDate: null,
    endDate: null,
    commissionRate: null,
    status: "Pending",
    reviewedBy: null,
    reviewedAt: null,
    rejectReason: null,
    confirmedAt: null,
    cancelledAt: null,
    cancelReason: null,
    createdAt: new Date().toISOString(),
  };

  registrations.unshift(created);
  return created;
});

mock("GET", "/organizer-registrations", ({ query }) => {
  const search = query.get("search")?.trim().toLowerCase();
  const type = query.get("type") as RegistrationType | null;
  const status = query.get("status") as RegistrationStatus | null;
  const stallId = query.get("stallId");

  const filtered = registrations.filter((r) => {
    if (type && r.type !== type) return false;
    if (status && r.status !== status) return false;
    if (stallId && r.stallId !== stallId) return false;
    if (
      search &&
      !r.brandName.toLowerCase().includes(search) &&
      !r.userFullName.toLowerCase().includes(search)
    ) {
      return false;
    }
    return true;
  });

  return paginate(filtered, query);
});

mock("GET", "/organizer-registrations/:id", ({ params }): OrganizerRegistrationResponse => {
  const item = registrations.find((r) => r.id === params.id);
  if (!item) throw mockError(404, "Không tìm thấy đơn đăng ký.");
  return item;
});

mock("PUT", "/organizer-registrations/:id/approve", ({ params, body }): OrganizerRegistrationResponse => {
  const item = registrations.find((r) => r.id === params.id);
  if (!item) throw mockError(404, "Không tìm thấy đơn đăng ký.");

  const payload = body as ApproveOrganizerRegistrationRequest | undefined;
  const now = new Date().toISOString();

  if (item.type === "Online") {
    if (!payload?.commissionRate) {
      throw mockError(400, "Đơn đăng ký Online bắt buộc phải thiết lập tỷ lệ hoa hồng.");
    }
    item.commissionRate = payload.commissionRate;
    item.status = "AwaitingConfirmation";
    item.reviewedAt = now;
  } else {
    item.status = "Approved";
    item.reviewedAt = now;
  }

  return item;
});

mock("PUT", "/organizer-registrations/:id/reject", ({ params, body }): OrganizerRegistrationResponse => {
  const item = registrations.find((r) => r.id === params.id);
  if (!item) throw mockError(404, "Không tìm thấy đơn đăng ký.");

  const payload = body as RejectOrganizerRegistrationRequest;
  if (!payload?.rejectReason) {
    throw mockError(400, "Bắt buộc phải nhập lý do từ chối.");
  }

  item.status = "Rejected";
  item.rejectReason = payload.rejectReason;
  item.reviewedAt = new Date().toISOString();
  return item;
});
