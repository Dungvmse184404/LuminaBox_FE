import type { Credentials, CurrentUser } from "@/features/auth/types";
import { mock, newId } from "@/mocks/server";

let current: CurrentUser | null = null;

function roleOf(email: string): CurrentUser["role"] {
  if (email.includes("manager")) return "Manager";
  if (email.includes("organizer")) return "Organization";
  return "User";
}

mock("POST", "/auth/login", ({ body }) => {
  const { email } = body as Credentials;
  current = { id: newId(), fullName: "Demo User", email, role: roleOf(email) };
  return { accessToken: "mock-access", refreshToken: "mock-refresh" };
});

mock("GET", "/users/me", () => current);

mock("POST", "/auth/logout", () => {
  current = null;
});
