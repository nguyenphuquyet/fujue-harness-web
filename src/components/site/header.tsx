"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Download, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/#tinh-nang", label: "Tính năng", section: "tinh-nang" },
  { href: "/#tai-ve", label: "Cách hoạt động", section: "tai-ve" },
  { href: "/models", label: "Model", section: null },
  { href: "/#api", label: "API", section: "api" },
  { href: "/docs", label: "Hướng dẫn", section: null },
];

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const onHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      if (!onHome) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      let current: string | null = null;
      for (const item of NAV) {
        if (!item.section) continue;
        const el = document.getElementById(item.section);
        if (el && el.getBoundingClientRect().top <= 120) current = item.section;
      }
      setSection(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onHome]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300",
        scrolled ? "border-border bg-background/90" : "border-transparent bg-background/60",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />

        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Điều hướng chính">
          {NAV.map((item) => {
            const active = item.section
              ? onHome && section === item.section
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-surface font-medium text-foreground shadow-[0_1px_2px_rgb(12_15_23/0.04)]"
                    : "text-muted hover:bg-item-hover hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {signedIn ? (
            <ButtonLink href="/dashboard" variant="primary" size="sm" className="h-9 px-4">
              Bảng điều khiển
              <ArrowRight className="size-3.5" />
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm" className="h-9 px-3">
                Đăng nhập
              </ButtonLink>
              <ButtonLink href="/downloads" variant="primary" size="sm" className="h-9 px-4">
                <Download className="size-3.5" />
                Tải app
              </ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="ml-auto inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border-strong bg-surface text-muted transition-colors hover:text-foreground lg:hidden"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {onHome ? (
        <div
          aria-hidden
          className="ink-gradient absolute bottom-0 left-0 h-0.5 transition-[width] duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      ) : null}

      {open ? (
        <div className="border-t border-border bg-background px-4 pb-5 pt-2 lg:hidden">
          <nav className="flex flex-col" aria-label="Điều hướng trên điện thoại">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-sm text-muted hover:bg-item-hover hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            {signedIn ? (
              <ButtonLink href="/dashboard" variant="primary">
                Bảng điều khiển
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/downloads" variant="primary">
                  <Download className="size-4" />
                  Tải app
                </ButtonLink>
                <ButtonLink href="/login" variant="outline">
                  Đăng nhập
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}