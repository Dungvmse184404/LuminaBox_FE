import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ForbiddenPage } from "@/pages/errors/ForbiddenPage";
import { useAuth } from "./AuthContext";
import type { UserRole } from "./types";

interface Props {
  roles?: UserRole[];
}

// UI guard only. Authorization is enforced by the BE; never rely on this for security.
export function RequireRole({ roles = [] }: Props) {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles.length > 0 && !hasRole(...roles)) return <ForbiddenPage />;
  return <Outlet />;
}
