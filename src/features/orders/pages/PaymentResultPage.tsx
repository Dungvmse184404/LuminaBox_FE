import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CircleCheck, CircleX } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { orderKeys } from "../hooks/useOrders";

const COPY: Record<string, string> = {
  success: "Thanh toán thành công",
  cancelled: "Bạn đã hủy thanh toán",
  refunded: "Đơn đã hủy, tiền đã được hoàn lại",
  failed: "Không xác nhận được thanh toán",
};

export function PaymentResultPage() {
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const status = params.get("status") ?? "failed";
  const orderId = params.get("orderId");
  const success = status === "success";

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: orderKeys.all });
  }, [queryClient]);

  return (
    <Card flush className="mx-auto mt-8 grid max-w-md justify-items-center gap-3 px-5 py-10 text-center">
      {success ? <CircleCheck size={40} className="text-success" /> : <CircleX size={40} className="text-danger" />}
      <h1 className="font-serif text-xl font-bold text-ink">{COPY[status] ?? COPY.failed}</h1>
      <Link to={orderId ? `/orders/${orderId}` : "/orders"} className="text-sm font-semibold text-primary hover:underline">
        {orderId ? "Xem đơn hàng" : "Về đơn hàng của tôi"}
      </Link>
    </Card>
  );
}
