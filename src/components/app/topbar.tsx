"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

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

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">
      <div className="lg:hidden">
        <Logo compact />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Badge tone={plan === "free" ? "neutral" : "brand"}>
          Gói {plan === "free" ? "Miễn phí" : plan === "pro" ? "Pro" : "Đội nhóm"}
        </Badge>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-9 items-center gap-2 rounded-lg border border-border-strong px-2 pr-2.5 text-sm transition-colors hover:bg-item-hover"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary-light text-[11px] font-medium text-primary">
              {initials || "?"}
            </span>
            <span className="hidden max-w-40 truncate text-xs text-muted sm:block">{email}</span>
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
                  "absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border-strong",
                  "bg-surface-overlay shadow-popover",
                )}
              >
                <div className="border-b border-border px-3 py-3">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="truncate text-xs text-muted">{email}</p>
                </div>
                <div className="p-1">
                  <a
                    href="/dashboard"
                    className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm text-muted hover:bg-item-hover hover:text-foreground"
                    role="menuitem"
                  >
                    <Settings className="size-4" />
                    Bảng điều khiển
                  </a>
                  {isAdmin ? (
                    <a
                      href="/admin"
                      className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm text-muted hover:bg-item-hover hover:text-foreground"
                      role="menuitem"
                    >
                      <Settings className="size-4" />
                      Trang quản trị
                    </a>
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
