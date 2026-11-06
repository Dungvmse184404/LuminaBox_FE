import { Boxes, Cake, ClipboardList, LayoutDashboard, MapPin } from "lucide-react";
import { SideNavLayout, type SideNavItem } from "@/components/layout/SideNavLayout";

const ITEMS: SideNavItem[] = [
  { to: "/store", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/store/orders", label: "Đơn hàng", icon: ClipboardList },
  { to: "/store/products", label: "Sản phẩm", icon: Cake },
  { to: "/store/boxes", label: "Hộp combo", icon: Boxes },
  { to: "/store/pickup-addresses", label: "Địa chỉ lấy hàng", icon: MapPin },
];

export const StoreLayout = () => <SideNavLayout title="Cửa hàng" items={ITEMS} />;
