"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Download, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "@/components/app/mobile-nav";
import { cn } from "@/lib/cn";

const TITLES: Record<string, string> = {
  "/dashboard": "Tổng quan",
  "/dashboard/models": "Model",
  "/dashboard/billing": "Nạp tiền",
  "/dashboard/keys": "Khoá API",
  "/dashboard/sessions": "Phiên đăng nhập",
  "/device": "Kết nối thiết bị",
  "/admin": "Quản trị",
  "/admin/users": "Người dùng",
  "/admin/models": "Model",
  "/admin/settings": "Cài đặt",
  "/admin/logs": "Nhật ký",
};

export function Topbar({
  name,
  email,
  plan,
  isAdmin,
}: {
  name: string;
  email: string;
  plan: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  async function signOut() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const title = TITLES[pathname] ?? "Bảng điều khiển";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">
      <MobileNav isAdmin={isAdmin} />
      <div className="min-w-0">
        <p className="hidden text-[11px] text-muted sm:block">Bảng điều khiển</p>
        <p className="truncate text-sm font-medium">{title}</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/downloads"
          className="hidden h-9 items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 text-xs text-muted transition-colors hover:text-foreground sm:inline-flex"
        >
          <Download className="size-3.5" />
          Tải app
        </Link>

        <Badge tone={plan === "free" ? "neutral" : "brand"}>
          Gói {plan === "free" ? "Miễn phí" : plan === "pro" ? "Pro" : "Đội nhóm"}
        </Badge>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-9 items-center gap-2 rounded-lg border border-border-strong bg-surface px-2 pr-2.5 text-sm transition-colors hover:bg-item-hover"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary-light text-[11px] font-medium text-primary">
              {initials || "?"}
            </span>
            <span className="hidden max-w-36 truncate text-xs text-muted sm:block">{email}</span>
            <ChevronDown className="size-3.5 text-muted" />
          </button>

          {open ? (
            <>
              <button
                type="button"
                aria-label="Đóng menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setOpen(false)}
              />
              <div
                role="menu"
                className={cn(
                  "absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border-strong",
                  "bg-surface-overlay shadow-popover",
                )}
              >
                <div className="border-b border-border px-3 py-3">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="truncate text-xs text-muted">{email}</p>
                </div>
                <div className="p-1">
                  <Link
                    href="/dashboard"
                    className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm text-muted hover:bg-item-hover hover:text-foreground"
                    role="menuitem"
                  >
                    <LayoutDashboard className="size-4" />
                    Bảng điều khiển
                  </Link>
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm text-muted hover:bg-item-hover hover:text-foreground"
                      role="menuitem"
                    >
                      <ShieldCheck className="size-4" />
                      Trang quản trị
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-sm text-danger hover:bg-danger-bg"
                    role="menuitem"
                  >
                    <LogOut className="size-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
