import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div className="hero-glow pointer-events-none absolute inset-0 opacity-80" aria-hidden />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <Link href="/" className="text-xs text-muted transition-colors hover:text-foreground">
          Về trang chủ
        </Link>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="relative mx-auto w-full max-w-6xl px-4 py-6 text-center text-xs text-muted sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>Điều khoản</span>
          <span>Quyền riêng tư</span>
          <span>Trợ giúp</span>
        </div>
      </footer>
    </div>
  );
}
