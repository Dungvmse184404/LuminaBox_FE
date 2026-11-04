import { useMutation } from "@tanstack/react-query";
import { saveTokens } from "@/lib/api";
import { authApi } from "../api/authApi";
import { useAuth } from "../AuthContext";
import type { Credentials } from "../types";

export function useLogin() {
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: async (credentials: Credentials) => {
      saveTokens(await authApi.login(credentials));
      try {
        return await authApi.me();
      } catch (error) {
        saveTokens(null);
        throw error;
      }
    },
    onSuccess: setUser,
  });
}

export const useRegister = () => useMutation({ mutationFn: authApi.register });

export const useVerifyOtp = () =>
  useMutation({
    mutationFn: ({ email, otpCode }: { email: string; otpCode: string }) => authApi.verifyOtp(email, otpCode),
  });

export const useResendOtp = () => useMutation({ mutationFn: authApi.resendOtp });
