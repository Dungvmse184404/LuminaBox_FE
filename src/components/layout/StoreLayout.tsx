import { Boxes, Building2, Cake, ClipboardList, LayoutDashboard, MapPin } from "lucide-react";
import { SideNavLayout, type SideNavItem } from "@/components/layout/SideNavLayout";

const ITEMS: SideNavItem[] = [
  { to: "/store", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/store/orders", label: "Đơn hàng", icon: ClipboardList },
  { to: "/store/products", label: "Sản phẩm", icon: Cake },
  { to: "/store/boxes", label: "Hộp", icon: Boxes },
  { to: "/store/pickup-addresses", label: "Địa chỉ lấy hàng", icon: MapPin },
  { to: "/become-partner", label: "Mở rộng kinh doanh", icon: Building2 },
];

export const StoreLayout = () => <SideNavLayout title="Cửa hàng" items={ITEMS} />;
