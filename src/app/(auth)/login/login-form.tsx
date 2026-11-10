"use client";

import { useState } from "react";
import {
  AuthFormShell,
  FormError,
  GoogleButton,
  PasswordInput,
  SubmitButton,
} from "../auth-form-parts";
import { Field, Input } from "@/components/ui/input";

/**
 * Đăng nhập bằng email + mật khẩu. Phiên nằm trong cookie httpOnly do
 * /api/v1/auth/login cấp; thành công thì chuyển tới `next` hoặc /dashboard.
 */
export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [field, setField] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setField(null);
    setPending(true);
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string; field?: string };
      if (!response.ok) {
        setError(data.error ?? "Không đăng nhập được.");
        setField(data.field ?? null);
        setPending(false);
        return;
      }
      const target = next && next.startsWith("/") ? next : "/dashboard";
      window.location.assign(target);
    } catch {
      setError("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
      setPending(false);
    }
  }

  return (
    <AuthFormShell
      title="Đăng nhập"
      subtitle="Tiếp tục phiên làm việc và quản lý khoá API của bạn."
      footer={
        <>
          Chưa có tài khoản?{" "}
          <a href="/register" className="font-medium text-primary hover:underline">
            Tạo tài khoản
          </a>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={field === "email" ? error ?? undefined : undefined}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Nhập email"
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={field === "email"}
          />
        </Field>

        <Field
          label="Mật khẩu"
          htmlFor="password"
          error={field === "password" ? error ?? undefined : undefined}
          action={
            <button
              type="button"
              onClick={() => setForgotOpen((value) => !value)}
              className="text-xs text-muted transition-colors hover:text-foreground"
            >
              Quên mật khẩu?
            </button>
          }
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={setPassword}
            invalid={field === "password"}
          />
        </Field>

        {forgotOpen ? (
          <div className="rounded-xl border border-border bg-surface p-3 text-xs leading-5 text-muted">
            Môi trường xem trước chưa gửi email đặt lại mật khẩu. Gửi yêu cầu tới{" "}
            <span className="font-mono text-foreground">team@fujue.dev</span> để được cấp lại.
          </div>
        ) : null}

        {error && field === null ? <FormError>{error}</FormError> : null}

        <SubmitButton pending={pending}>Đăng nhập</SubmitButton>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted">hoặc</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton label="Đăng nhập bằng Google" />
    </AuthFormShell>
  );
}
