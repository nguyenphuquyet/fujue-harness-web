"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Download, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/#tinh-nang", label: "Tính năng" },
  { href: "/models", label: "Model" },
  { href: "/downloads", label: "Tải về" },
  { href: "/docs", label: "Hướng dẫn" },
  { href: "/pricing", label: "Bảng giá" },
];

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo />

        <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Điều hướng chính">
          {NAV.map((item) => {
            const active =
              item.href === "/#tinh-nang"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
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

        <div className="ml-auto hidden items-center gap-2 md:flex">
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
          className="ml-auto inline-flex size-9 items-center justify-center rounded-lg border border-border-strong bg-surface text-muted transition-colors hover:text-foreground md:hidden"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-4 pb-5 pt-2 md:hidden">
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
