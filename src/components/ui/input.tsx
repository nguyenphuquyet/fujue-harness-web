import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Ô nhập của toàn site. Nhãn nằm trên, gợi ý/lỗi nằm dưới, viền là thứ duy nhất
 * báo đây là chỗ gõ trên nền card.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  action,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-error-text" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  invalid,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border bg-surface px-3 text-sm text-foreground placeholder:text-muted/70 md:h-10",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-ring-focus",
        invalid ? "border-error focus:border-error" : "border-border-strong focus:border-focus",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-ring-focus",
        invalid ? "border-error focus:border-error" : "border-border-strong focus:border-focus",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      className={cn(
        "h-11 w-full appearance-none rounded-xl border border-border-strong bg-surface px-3 text-sm text-foreground md:h-10",
        "transition-colors focus:border-focus focus:outline-none focus:ring-2 focus:ring-ring-focus",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}
