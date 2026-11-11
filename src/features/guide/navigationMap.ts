import type { UserRole } from "@/features/auth/types";

export interface NavNode {
  id: string;
  label: string;
  page: string | null;
  opens?: string;
  next: string[];
  roles?: UserRole[];
  autoClick?: boolean;
}

export const NAV_NODES: NavNode[] = [
  {
    id: "account-menu",
    label: "Tài khoản",
    page: null,
    next: [
      "account-menu-profile",
      "account-menu-orders",
      "account-menu-vouchers",
      "account-menu-addresses",
      "account-menu-store",
      "account-menu-admin",
    ],
    autoClick: true,
  },
  {
    id: "account-menu-profile",
    label: "Hồ sơ của tôi",
    page: null,
    opens: "/account/profile",
    next: ["profile-personal-info", "profile-address-add", "profile-address-manage", "profile-shop-profile", "profile-change-password"],
    autoClick: true,
  },
  { id: "account-menu-orders", label: "Đơn hàng của tôi", page: null, opens: "/orders", next: [], autoClick: true },
  { id: "account-menu-vouchers", label: "Voucher của tôi", page: null, opens: "/vouchers", next: [], autoClick: true },
  {
    id: "account-menu-addresses",
    label: "Sổ địa chỉ",
    page: null,
    opens: "/account/addresses",
    next: ["address-book-add"],
    autoClick: true,
  },
  {
    id: "account-menu-store",
    label: "Cửa hàng của tôi",
    page: null,
    opens: "/store",
    next: ["store-nav-pickup-addresses"],
    roles: ["Organization"],
    autoClick: true,
  },
  { id: "account-menu-admin", label: "Quản trị", page: null, opens: "/admin", next: [], roles: ["Manager"], autoClick: true },

  { id: "profile-personal-info", label: "Thông tin cá nhân", page: "/account/profile", next: [] },
  { id: "profile-address-add", label: "Thêm địa chỉ", page: "/account/profile", next: [] },
  {
    id: "profile-address-manage",
    label: "Quản lý địa chỉ",
    page: "/account/profile",
    opens: "/account/addresses",
    next: ["address-book-add"],
    autoClick: true,
  },
  { id: "profile-shop-profile", label: "Hồ sơ cửa hàng", page: "/account/profile", next: [], roles: ["Organization"] },
  { id: "profile-change-password", label: "Đổi mật khẩu", page: "/account/profile", next: [] },

  { id: "address-book-add", label: "Thêm địa chỉ", page: "/account/addresses", next: [] },

  {
    id: "store-nav-pickup-addresses",
    label: "Địa chỉ lấy hàng",
    page: "/store/*",
    opens: "/store/pickup-addresses",
    next: ["pickup-address-add"],
    roles: ["Organization"],
    autoClick: true,
  },
  { id: "pickup-address-add", label: "Thêm địa chỉ", page: "/store/pickup-addresses", next: [], roles: ["Organization"] },
];

const BY_ID = new Map(NAV_NODES.map((node) => [node.id, node]));

export function findNavNode(id: string): NavNode | undefined {
  return BY_ID.get(id);
}
