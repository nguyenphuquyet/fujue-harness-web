"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/#tinh-nang", label: "Tính năng" },
  { href: "/models", label: "Model" },
  { href: "/downloads", label: "Tải về" },
  { href: "/docs", label: "Tài liệu" },
  { href: "/pricing", label: "Bảng giá" },
];

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />

        <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Điều hướng chính">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "text-foreground" : "text-muted hover:bg-item-hover hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {signedIn ? (
            <ButtonLink href="/dashboard" variant="primary" size="sm" className="h-9 px-4">
              Bảng điều khiển
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm" className="h-9 px-3">
                Đăng nhập
              </ButtonLink>
              <ButtonLink href="/register" variant="primary" size="sm" className="h-9 px-4">
                Bắt đầu miễn phí
              </ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="ml-auto inline-flex size-9 items-center justify-center rounded-lg border border-border-strong text-muted md:hidden"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
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
                <ButtonLink href="/login" variant="outline">
                  Đăng nhập
                </ButtonLink>
                <ButtonLink href="/register" variant="primary">
                  Bắt đầu miễn phí
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
