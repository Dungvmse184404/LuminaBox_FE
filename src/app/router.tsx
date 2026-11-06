import { createBrowserRouter } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { AddressBookPage } from "@/features/address/pages/AddressBookPage";
import { CartPage } from "@/features/cart/pages/CartPage";
import { CheckoutPage } from "@/features/orders/pages/CheckoutPage";
import { OrderDetailPage } from "@/features/orders/pages/OrderDetailPage";
import { OrdersPage, StoreOrdersPage } from "@/features/orders/pages/OrdersPage";
import { PaymentResultPage } from "@/features/orders/pages/PaymentResultPage";
import { CakeSetsPage } from "@/features/products/pages/CakeSetsPage";
import { VouchersPage } from "@/features/vouchers/pages/VouchersPage";
import { RequireRole } from "@/features/auth/RequireRole";
import { AdminCatalogPage } from "@/features/catalog/pages/AdminCatalogPage";
import { HomePage } from "@/features/home/pages/HomePage";
import { ProductDetailPage } from "@/features/products/pages/ProductDetailPage";
import { ProductsPage } from "@/features/products/pages/ProductsPage";
import { ForbiddenPage } from "@/pages/errors/ForbiddenPage";
import { NotFoundPage } from "@/pages/errors/NotFoundPage";
import { RouteErrorPage } from "@/pages/errors/RouteErrorPage";
import { ServerErrorPage } from "@/pages/errors/ServerErrorPage";
import { UnauthorizedPage } from "@/pages/errors/UnauthorizedPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
          {
            path: "stalls",
            lazy: async () => ({ Component: (await import("@/features/stalls/pages/StallsPage")).StallsPage }),
          },

          {
            element: <ContentLayout />,
            children: [
              { path: "products", element: <ProductsPage /> },
              { path: "products/:id", element: <ProductDetailPage /> },
              { path: "cake-sets", element: <CakeSetsPage /> },
              { path: "become-partner", element: <PlaceholderPage title="Trở thành đối tác" /> },
              { path: "payment/result", element: <PaymentResultPage /> },
              { path: "help/ordering", element: <PlaceholderPage title="Hướng dẫn đặt hàng" /> },
              { path: "policies/returns", element: <PlaceholderPage title="Chính sách đổi trả" /> },
              { path: "policies/commission", element: <PlaceholderPage title="Chính sách hoa hồng" /> },
              {
                element: <RequireRole />,
                children: [
                  { path: "account/addresses", element: <AddressBookPage /> },
                  { path: "cart", element: <CartPage /> },
                  { path: "checkout", element: <CheckoutPage /> },
                  { path: "orders", element: <OrdersPage /> },
                  { path: "orders/:id", element: <OrderDetailPage /> },
                  { path: "vouchers", element: <VouchersPage /> },
                ],
              },
            ],
          },

          {
            path: "store",
            element: <RequireRole roles={["Organization"]} />,
            children: [
              {
                element: <StoreLayout />,
                children: [
                  { index: true, element: <PlaceholderPage title="Tổng quan cửa hàng" /> },
                  { path: "orders", element: <StoreOrdersPage /> },
                  { path: "orders/:id", element: <OrderDetailPage store /> },
                  { path: "products", element: <PlaceholderPage title="Sản phẩm của tôi" /> },
                  { path: "boxes", element: <PlaceholderPage title="Hộp combo" /> },
                  { path: "pickup-addresses", element: <AddressBookPage type="Pickup" /> },
                ],
              },
            ],
          },

          {
            path: "admin",
            element: <RequireRole roles={["Manager"]} />,
            children: [
              {
                element: <AdminLayout />,
                children: [
                  { index: true, element: <PlaceholderPage title="Tổng quan quản trị" /> },
                  { path: "catalog", element: <AdminCatalogPage /> },
                  { path: "stalls", element: <PlaceholderPage title="Gian hàng" /> },
                ],
              },
            ],
          },

          { path: "unauthorized", element: <UnauthorizedPage /> },
          { path: "forbidden", element: <ForbiddenPage /> },
          { path: "server-error", element: <ServerErrorPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
