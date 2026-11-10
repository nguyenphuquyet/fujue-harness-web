import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus focus-visible:ring-offset-0 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover",
  outline:
    "border border-border-strong bg-surface text-foreground hover:bg-button-hover",
  secondary:
    "bg-secondary text-foreground hover:bg-secondary-hover",
  ghost:
    "text-muted hover:bg-item-hover hover:text-foreground",
  danger:
    "bg-transparent text-danger hover:bg-danger-bg",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
};

export function buttonClass(variant: Variant = "outline", size: Size = "md", extra?: string): string {
  return cn(base, variants[variant], sizes[size], extra);
}

export function Button({
  variant = "outline",
  size = "md",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
}) {
  return (
    <button className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "outline",
  size = "md",
  className,
  children,
  target,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  target?: string;
}) {
  return (
    <Link href={href} target={target} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
