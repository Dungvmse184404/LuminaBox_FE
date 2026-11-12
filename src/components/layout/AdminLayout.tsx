import { ClipboardCheck, LayoutDashboard, Layers, Store } from "lucide-react";
import { SideNavLayout, type SideNavItem } from "@/components/layout/SideNavLayout";

const ITEMS: SideNavItem[] = [
  { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/admin/registrations", label: "Đơn đối tác", icon: ClipboardCheck },
  { to: "/admin/catalog", label: "Loại bánh & nhân", icon: Layers },
  { to: "/admin/stalls", label: "Gian hàng", icon: Store },
];

export const AdminLayout = () => <SideNavLayout title="Quản trị" items={ITEMS} guideScope="/admin/*" />;
