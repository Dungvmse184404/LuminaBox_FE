import { request, type Tokens } from "@/lib/api";
import type { CurrentUser, Credentials } from "../types";

export const authApi = {
  login: async (credentials: Credentials) => {
    const { data } = await request<Tokens>("/auth/login", { method: "POST", body: credentials });
    return data!;
  },

  me: async () => {
    const { data } = await request<CurrentUser>("/users/me", { auth: true });
    return data!;
  },

  logout: async () => {
    await request("/auth/logout", { method: "POST", auth: true });
  },

  verifyOtp: async (email: string, otpCode: string) => {
    await request("/auth/verify-otp", { method: "POST", body: { email, otpCode } });
  },

  resendOtp: async (email: string) => {
    await request("/auth/resend-otp", { method: "POST", body: { email } });
  },
};
