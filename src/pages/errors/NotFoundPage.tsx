import { SearchX } from "lucide-react";
import { ErrorPage } from "@/components/feedback/ErrorPage";

export function NotFoundPage() {
  return <ErrorPage code="404" icon={SearchX} title="Không tìm thấy trang" description="Đường dẫn không tồn tại hoặc nội dung đã bị xóa." />;
}
