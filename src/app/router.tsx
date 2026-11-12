import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { ProfilePage } from "@/features/account/pages/ProfilePage";
import { AddressBookPage } from "@/features/address/pages/AddressBookPage";
import { CartPage } from "@/features/cart/pages/CartPage";
import { CheckoutPage } from "@/features/orders/pages/CheckoutPage";
import { OrderDetailPage } from "@/features/orders/pages/OrderDetailPage";
import { OrdersPage, StoreOrdersPage } from "@/features/orders/pages/OrdersPage";
import { PaymentResultPage } from "@/features/orders/pages/PaymentResultPage";
import { AdminRegistrationsPage } from "@/features/partner/pages/AdminRegistrationsPage";
import { BecomePartnerPage } from "@/features/partner/pages/BecomePartnerPage";
import { PartnerConfirmPage } from "@/features/partner/pages/PartnerConfirmPage";
import { CakeSetsPage } from "@/features/products/pages/CakeSetsPage";
import { VouchersPage } from "@/features/vouchers/pages/VouchersPage";
import { RequireRole } from "@/features/auth/RequireRole";
import { AdminCatalogPage } from "@/features/catalog/pages/AdminCatalogPage";
import { HomePage } from "@/features/home/pages/HomePage";
import { ProductDetailPage } from "@/features/products/pages/ProductDetailPage";
import { ProductsPage } from "@/features/products/pages/ProductsPage";
import { AdminStallsPage } from "@/features/stalls/pages/AdminStallsPage";
import { MyStallsPage } from "@/features/stalls/pages/MyStallsPage";
import { MyBoxesPage } from "@/features/store/pages/MyBoxesPage";
import { MyProductsPage } from "@/features/store/pages/MyProductsPage";
import { StoreOverviewPage } from "@/features/store/pages/StoreOverviewPage";
import { ForbiddenPage } from "@/pages/errors/ForbiddenPage";
import { NotFoundPage } from "@/pages/errors/NotFoundPage";
import { RouteErrorPage } from "@/pages/errors/RouteErrorPage";
import { ServerErrorPage } from "@/pages/errors/ServerErrorPage";
import { UnauthorizedPage } from "@/pages/errors/UnauthorizedPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import type { UserRole } from "@/features/auth/types";
import { registerGuideRoutes, type GuideRouteHandle } from "@/features/guide/locate";

const NO_GUIDE: GuideRouteHandle = { guide: false };

function guarded(roles: UserRole[], route: { path?: string; children: RouteObject[] }): RouteObject {
  const handle: GuideRouteHandle = { roles };
  return { ...route, element: <RequireRole roles={roles} />, handle };
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "login", element: <LoginPage />, handle: NO_GUIDE },
          { path: "register", element: <RegisterPage />, handle: NO_GUIDE },
          { path: "forgot-password", element: <ForgotPasswordPage />, handle: NO_GUIDE },
          {
            path: "stalls",
            lazy: async () => ({ Component: (await import("@/features/stalls/pages/StallsPage")).StallsPage }),
          },
          {
            path: "become-partner/stalls",
            lazy: async () => ({ Component: (await import("@/features/partner/pages/PartnerStallsPage")).PartnerStallsPage }),
          },

          {
            element: <ContentLayout />,
            children: [
              { path: "products", element: <ProductsPage /> },
              { path: "products/:id", element: <ProductDetailPage /> },
              { path: "cake-sets", element: <CakeSetsPage /> },
              { path: "become-partner", element: <BecomePartnerPage /> },
              { path: "become-partner/confirm", element: <PartnerConfirmPage /> },
              { path: "payment/result", element: <PaymentResultPage /> },
              { path: "help/ordering", element: <PlaceholderPage title="Hướng dẫn đặt hàng" /> },
              { path: "policies/returns", element: <PlaceholderPage title="Chính sách đổi trả" /> },
              { path: "policies/commission", element: <PlaceholderPage title="Chính sách hoa hồng" /> },
              guarded([], {
                children: [
                  { path: "account/profile", element: <ProfilePage /> },
                  { path: "account/addresses", element: <AddressBookPage /> },
                  { path: "cart", element: <CartPage /> },
                  { path: "checkout", element: <CheckoutPage /> },
                  { path: "orders", element: <OrdersPage /> },
                  { path: "orders/:id", element: <OrderDetailPage /> },
                  { path: "vouchers", element: <VouchersPage /> },
                ],
              }),
            ],
          },

          guarded(["Organization"], {
            path: "store",
            children: [
              {
                element: <StoreLayout />,
                children: [
                  { index: true, element: <StoreOverviewPage /> },
                  { path: "orders", element: <StoreOrdersPage /> },
                  { path: "orders/:id", element: <OrderDetailPage store /> },
                  { path: "products", element: <MyProductsPage /> },
                  { path: "boxes", element: <MyBoxesPage /> },
                  { path: "stalls", element: <MyStallsPage /> },
                  { path: "pickup-addresses", element: <AddressBookPage type="Pickup" /> },
                ],
              },
            ],
          }),

          guarded(["Manager"], {
            path: "admin",
            children: [
              {
                element: <AdminLayout />,
                children: [
                  { index: true, element: <PlaceholderPage title="Tổng quan quản trị" /> },
                  { path: "catalog", element: <AdminCatalogPage /> },
                  { path: "registrations", element: <AdminRegistrationsPage /> },
                  { path: "stalls", element: <AdminStallsPage /> },
                ],
              },
            ],
          }),

          { path: "unauthorized", element: <UnauthorizedPage />, handle: NO_GUIDE },
          { path: "forbidden", element: <ForbiddenPage />, handle: NO_GUIDE },
          { path: "server-error", element: <ServerErrorPage />, handle: NO_GUIDE },
          { path: "*", element: <NotFoundPage />, handle: NO_GUIDE },
        ],
      },
    ],
  },
]);

registerGuideRoutes(router.routes);
