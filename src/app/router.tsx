import { createBrowserRouter } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { ContentLayout } from "@/components/layout/ContentLayout";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { RequireRole } from "@/features/auth/RequireRole";
import { AdminCatalogPage } from "@/features/catalog/pages/AdminCatalogPage";
import { HomePage } from "@/features/home/pages/HomePage";
import { ForbiddenPage } from "@/pages/errors/ForbiddenPage";
import { NotFoundPage } from "@/pages/errors/NotFoundPage";
import { RouteErrorPage } from "@/pages/errors/RouteErrorPage";
import { ServerErrorPage } from "@/pages/errors/ServerErrorPage";
import { UnauthorizedPage } from "@/pages/errors/UnauthorizedPage";
import { LoginPage } from "@/pages/LoginPage";
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

          {
            element: <ContentLayout />,
            children: [
              { path: "products", element: <PlaceholderPage title="Sản phẩm" /> },
              { path: "cake-sets", element: <PlaceholderPage title="Bánh & hộp Trung thu" /> },
              { path: "stalls", element: <PlaceholderPage title="Gian hàng" /> },
              { path: "become-partner", element: <PlaceholderPage title="Trở thành đối tác" /> },
              { path: "cart", element: <PlaceholderPage title="Giỏ hàng" /> },
              { path: "vouchers", element: <PlaceholderPage title="Voucher và khuyến mãi" /> },
              { path: "help/ordering", element: <PlaceholderPage title="Hướng dẫn đặt hàng" /> },
              { path: "policies/returns", element: <PlaceholderPage title="Chính sách đổi trả" /> },
              { path: "policies/commission", element: <PlaceholderPage title="Chính sách hoa hồng" /> },
              {
                element: <RequireRole />,
                children: [{ path: "account/addresses", element: <PlaceholderPage title="Sổ địa chỉ" /> }],
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
                  { path: "products", element: <PlaceholderPage title="Sản phẩm của tôi" /> },
                  { path: "boxes", element: <PlaceholderPage title="Hộp combo" /> },
                  { path: "pickup-addresses", element: <PlaceholderPage title="Địa chỉ lấy hàng" /> },
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
