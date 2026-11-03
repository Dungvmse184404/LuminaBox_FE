import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { ErrorPage } from "@/components/feedback/ErrorPage";
import { Button } from "@/components/ui/Button";

export function UnauthorizedPage() {
  return (
    <ErrorPage
      code="401"
      icon={Lock}
      title="Bạn chưa đăng nhập"
      description="Phiên đăng nhập đã hết hạn hoặc chưa tồn tại. Vui lòng đăng nhập để tiếp tục."
      actions={
        <Link to="/login">
          <Button variant="outline">Đăng nhập</Button>
        </Link>
      }
    />
  );
}
