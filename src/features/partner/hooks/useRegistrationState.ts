import { useCallback, useEffect, useRef } from "react";
import { authApi } from "@/features/auth/api/authApi";
import { useAuth } from "@/features/auth/AuthContext";
import { refreshTokens } from "@/lib/api";
import type { OrganizerRegistrationResponse, RegistrationStatus } from "../types";
import { useMyRegistrations } from "./usePartner";

const OPEN_ONLINE_STATUSES: RegistrationStatus[] = ["Pending", "AwaitingConfirmation", "Approved"];

export function useHasOpenOnline(enabled = true) {
  const { data } = useMyRegistrations({ type: "Online", pageSize: 50 }, enabled);
  return Boolean(data?.items.some((item) => OPEN_ONLINE_STATUSES.includes(item.status)));
}

export function useReloadCurrentUser() {
  const { setUser } = useAuth();
  return useCallback(
    () =>
      refreshTokens()
        .then((tokens) => (tokens ? authApi.me().then(setUser) : undefined))
        .catch(() => undefined),
    [setUser],
  );
}

export function useSyncRoleOnApproval(registrations?: OrganizerRegistrationResponse[]) {
  const { user } = useAuth();
  const reloadCurrentUser = useReloadCurrentUser();
  const syncing = useRef(false);
  const promoted = user?.role === "User" && Boolean(registrations?.some((item) => item.status === "Approved"));

  useEffect(() => {
    if (!promoted || syncing.current) return;
    syncing.current = true;
    void reloadCurrentUser().finally(() => {
      syncing.current = false;
    });
  }, [promoted, reloadCurrentUser]);
}
