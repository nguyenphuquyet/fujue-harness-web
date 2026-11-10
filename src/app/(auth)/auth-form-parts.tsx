"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Khung chung cho màn đăng nhập và đăng ký: cột giữa màn, không viền card,
 * logo ở trên tiêu đề.
 */
export function AuthFormShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm sm:p-8">
      <LogoMark size={34} />
      <h1 className="mt-5 text-xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? <p className="mt-1.5 text-sm text-muted">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
      <p className="mt-6 text-center text-xs text-muted">{footer}</p>
    </div>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-error-border bg-error-bg px-3 py-2 text-xs text-error-strong"
    >
      {children}
    </p>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button type="submit" disabled={pending} className={buttonClass("primary", "lg", "w-full")}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function GoogleButton({ label }: { label: string }) {
  const [notice, setNotice] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setNotice(true)}
        className={buttonClass("outline", "lg", "w-full")}
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.29 9.14 5.38 12 5.38Z"
          />
        </svg>
        {label}
      </button>
      {notice ? (
        <p className="mt-2 text-center text-xs text-muted">
          Đăng nhập Google chưa được cấu hình trên môi trường này.
        </p>
      ) : null}
    </div>
  );
}

export function PasswordInput({
  id,
  placeholder,
  value,
  onChange,
  autoComplete,
  invalid,
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  invalid?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-12 w-full rounded-xl border bg-surface px-3 pr-11 text-sm text-foreground placeholder:text-muted/70",
          "transition-colors focus:outline-none focus:ring-2 focus:ring-ring-focus",
          invalid ? "border-error focus:border-error" : "border-border-strong focus:border-focus",
        )}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition-colors hover:text-foreground"
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
