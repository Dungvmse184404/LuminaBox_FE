import { Link } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { ApiError } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useLogin } from "../hooks/useLogin";
import type { Credentials } from "../types";

const schema = z.object({
  email: z.string().trim().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

interface Props {
  onUnverified: (credentials: Credentials) => void;
}

function loginError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) return "Email hoặc mật khẩu không đúng.";
  if (error instanceof ApiError && error.status === 403) return "Tài khoản đã bị khóa.";
  return errorMessage(error, "Không thể đăng nhập.");
}

export function LoginForm({ onUnverified }: Props) {
  const login = useLogin();
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Credentials>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");
    try {
      await login.mutateAsync(values);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403 && /not verified/i.test(error.message)) {
        onUnverified(values);
        return;
      }
      setFormError(loginError(error));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register("email")} />
      <Input
        label="Mật khẩu"
        type="password"
        autoComplete="current-password"
        required
        error={errors.password?.message}
        {...register("password")}
      />
      <div className="-mt-2 text-right">
        <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
          Quên mật khẩu?
        </Link>
      </div>
      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}
      <Button type="submit" loading={login.isPending} className="w-full">
        Đăng nhập
      </Button>
    </form>
  );
}
