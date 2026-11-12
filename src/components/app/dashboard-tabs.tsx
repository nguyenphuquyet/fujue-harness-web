"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/dashboard/usage", label: "Mức sử dụng" },
];

export function DashboardTabs() {
  const pathname = usePathname();

  return (
    <div className="scrollbar-clean overflow-x-auto">
      <nav
        aria-label="Các mục bảng điều khiển"
        className="flex min-w-full gap-2 shadow-[inset_0_-1px_0_var(--tab-rail)]"
      >
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative box-content h-10 rounded-xl px-2 pb-px text-sm font-medium whitespace-nowrap transition-colors",
                "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full",
                active
                  ? "text-foreground after:bg-foreground"
                  : "text-foreground/70 after:bg-transparent hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}