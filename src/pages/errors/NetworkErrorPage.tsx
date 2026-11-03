import { RefreshCw, WifiOff } from "lucide-react";
import { ErrorPage } from "@/components/feedback/ErrorPage";
import { Button } from "@/components/ui/Button";

export function NetworkErrorPage() {
  return (
    <ErrorPage
      code="Offline"
      icon={WifiOff}
      title="Không thể kết nối tới máy chủ"
      description="Kiểm tra kết nối mạng của bạn hoặc thử lại sau."
      actions={
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw size={16} />
          Thử lại
        </Button>
      }
    />
  );
}
