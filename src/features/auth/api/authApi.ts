import { request, type Tokens } from "@/lib/api";
import type { ChangePasswordPayload, CurrentUser, Credentials, ProfilePayload, RegisterPayload, ResetPasswordPayload } from "../types";

export const authApi = {
  login: async (credentials: Credentials) => {
    const { data } = await request<Tokens>("/auth/login", { method: "POST", body: credentials });
    return data!;
  },

  register: async (payload: RegisterPayload) => {
    await request("/auth/register", { method: "POST", body: payload });
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

  forgotPassword: async (email: string) => {
    await request("/auth/forgot-password", { method: "POST", body: { email } });
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    await request("/auth/reset-password", { method: "POST", body: payload });
  },

  updateProfile: async (payload: ProfilePayload) => {
    const { data } = await request<CurrentUser>("/users/me", { method: "PUT", body: payload, auth: true });
    return data!;
  },

  changePassword: async (payload: ChangePasswordPayload) => {
    const { data } = await request<Tokens>("/users/me/password", { method: "PUT", body: payload, auth: true });
    return data!;
  },
};
