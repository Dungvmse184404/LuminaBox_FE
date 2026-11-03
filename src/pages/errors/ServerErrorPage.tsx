import { RefreshCw, ServerCrash } from "lucide-react";
import { ErrorPage } from "@/components/feedback/ErrorPage";
import { Button } from "@/components/ui/Button";

interface Props {
  detail?: string;
}

export function ServerErrorPage({ detail }: Props) {
  return (
    <ErrorPage
      code="500"
      icon={ServerCrash}
      title="Máy chủ gặp sự cố"
      description="Có lỗi ngoài ý muốn. Vui lòng thử lại sau ít phút."
      detail={detail}
      actions={
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw size={16} />
          Tải lại
        </Button>
      }
    />
  );
}
