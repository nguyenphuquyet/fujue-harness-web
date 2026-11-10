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

/** Đăng ký tài khoản mới; thành công thì vào thẳng bảng điều khiển. */
export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [field, setField] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setField(null);
    setPending(true);
    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await response.json()) as { error?: string; field?: string };
      if (!response.ok) {
        setError(data.error ?? "Không tạo được tài khoản.");
        setField(data.field ?? null);
        setPending(false);
        return;
      }
      window.location.assign("/dashboard");
    } catch {
      setError("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
      setPending(false);
    }
  }

  return (
    <AuthFormShell
      title="Tạo tài khoản"
      subtitle="Miễn phí, không cần thẻ. Dùng ngay sau khi xác nhận email."
      footer={
        <>
          Đã có tài khoản?{" "}
          <a href="/login" className="font-medium text-primary hover:underline">
            Đăng nhập
          </a>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Họ và tên" htmlFor="name" error={field === "name" ? error ?? undefined : undefined}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Nhập họ và tên"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            invalid={field === "name"}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={field === "email" ? error ?? undefined : undefined}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Nhập email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={field === "email"}
          />
        </Field>

        <Field
          label="Mật khẩu"
          htmlFor="password"
          hint="Ít nhất 8 ký tự"
          error={field === "password" ? error ?? undefined : undefined}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Tạo mật khẩu"
            value={password}
            onChange={setPassword}
            invalid={field === "password"}
          />
        </Field>

        {error && field === null ? <FormError>{error}</FormError> : null}

        <SubmitButton pending={pending}>Tạo tài khoản</SubmitButton>

        <p className="text-center text-xs leading-5 text-muted">
          Bấm “Tạo tài khoản” là bạn đồng ý với điều khoản sử dụng và chính sách quyền riêng tư.
        </p>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted">hoặc</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton label="Đăng ký bằng Google" />
    </AuthFormShell>
  );
}
