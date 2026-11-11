"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AppSidebar } from "@/components/app/sidebar";

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex size-9 items-center justify-center rounded-lg border border-border-strong bg-surface text-muted transition-colors hover:text-foreground lg:hidden"
        aria-label="Mở điều hướng"
        aria-expanded={open}
      >
        <Menu className="size-4" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/25"
            onClick={() => setOpen(false)}
            aria-label="Đóng điều hướng"
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-surface shadow-modal">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Logo compact />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-item-hover hover:text-foreground"
                aria-label="Đóng"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <AppSidebar isAdmin={isAdmin} />
            </div>
            <div className="border-t border-border p-3">
              <Link
                href="/"
                className="flex h-9 items-center gap-2 rounded-lg px-3 text-xs text-muted hover:bg-item-hover hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
