import type { UserRole } from "./types";

const ROLE_HOME: Partial<Record<UserRole, string>> = {
  Manager: "/admin",
  Organization: "/store",
};

export function pathAfterLogin(role: UserRole, from?: string) {
  const home = ROLE_HOME[role];
  if (!home) return from ?? "/";
  return from && (from === home || from.startsWith(`${home}/`) || from.startsWith(`${home}?`)) ? from : home;
}
