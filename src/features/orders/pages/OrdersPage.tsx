import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrderList } from "../components/OrderList";
import { useMyOrders, useStoreOrders } from "../hooks/useOrders";
import type { OrderStatus } from "../types";

function useOrderFilters() {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [page, setPage] = useState(1);
  const params = { page, pageSize: 10, status: status || undefined };
  const changeStatus = (value: OrderStatus | "") => {
    setStatus(value);
    setPage(1);
  };
  return { status, params, changeStatus, setPage };
}

export function OrdersPage() {
  const { status, params, changeStatus, setPage } = useOrderFilters();
  const { data, isLoading, isError, refetch } = useMyOrders(params);

  return (
    <>
      <PageHeader title="Đơn hàng của tôi" />
      <OrderList
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        status={status}
        onStatusChange={changeStatus}
        onPageChange={setPage}
        linkPrefix="/orders"
        guideId="orders-status-filter"
      />
    </>
  );
}

export function StoreOrdersPage() {
  const { status, params, changeStatus, setPage } = useOrderFilters();
  const { data, isLoading, isError, refetch } = useStoreOrders(params);

  return (
    <>
      <PageHeader title="Đơn hàng của cửa hàng" />
      <OrderList
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        status={status}
        onStatusChange={changeStatus}
        onPageChange={setPage}
        linkPrefix="/store/orders"
        showBuyer
        guideId="store-orders-status-filter"
      />
    </>
  );
}
