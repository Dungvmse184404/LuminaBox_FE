import { ShieldAlert } from "lucide-react";
import { ErrorPage } from "@/components/feedback/ErrorPage";

export function ForbiddenPage() {
  return <ErrorPage code="403" icon={ShieldAlert} title="Bạn không có quyền truy cập" description="Tài khoản hiện tại không được phép xem trang này." />;
}
