import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/features/auth/AuthContext";
import { env } from "@/lib/env";
import { router } from "./router";

const DevTools = env.useMock ? lazy(() => import("@/mocks/DevTools")) : null;

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: false, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
          {DevTools && (
            <Suspense fallback={null}>
              <DevTools />
            </Suspense>
          )}
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
