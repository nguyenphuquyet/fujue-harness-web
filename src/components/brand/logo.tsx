import { cn } from "@/lib/cn";

/**
 * Dấu hiệu FuJue: chữ F dựng bằng nét, đặt trên ô bo góc màu nhấn.
 * Dùng ở header site, màn đăng nhập và sidebar của app.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="fj-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5b7bff" />
          <stop offset="1" stopColor="#3d54d8" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#fj-mark)" />
      <path
        d="M11 23V14.2A3.2 3.2 0 0 1 14.2 11H22"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16.4 18.4H22"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.72"
        fill="none"
      />
    </svg>
  );
}

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <a href={href} className="group inline-flex items-center gap-2.5">
      <LogoMark size={compact ? 26 : 30} />
      <span className="flex items-baseline gap-1.5">
        <span className="text-[15px] font-semibold tracking-tight text-foreground">FuJue</span>
        <span className="text-[15px] font-medium tracking-tight text-muted">Harness</span>
      </span>
    </a>
  );
}
