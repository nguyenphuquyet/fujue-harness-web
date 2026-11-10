"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ChartNoAxesColumn,
  Cpu,
  Gauge,
  KeyRound,
  LayoutDashboard,
  MonitorSmartphone,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

const ICONS = {
  overview: LayoutDashboard,
  keys: KeyRound,
  sessions: Activity,
  devices: MonitorSmartphone,
  admin: ShieldCheck,
  users: Users,
  models: Cpu,
  logs: ScrollText,
  usage: ChartNoAxesColumn,
  gauge: Gauge,
};

const USER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan", icon: "overview" },
  { href: "/dashboard/keys", label: "Khoá API", icon: "keys" },
  { href: "/dashboard/sessions", label: "Phiên đăng nhập", icon: "sessions" },
  { href: "/device", label: "Kết nối thiết bị", icon: "devices" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Tổng quan quản trị", icon: "admin" },
  { href: "/admin/users", label: "Người dùng", icon: "users" },
  { href: "/admin/models", label: "Model", icon: "models" },
  { href: "/admin/logs", label: "Nhật ký", icon: "logs" },
];

function NavLink({ item, exact, compact = false }: { item: NavItem; exact?: boolean; compact?: boolean }) {
  const pathname = usePathname();
  const Icon = ICONS[item.icon];
  const active = exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg transition-colors",
        compact ? "h-8 shrink-0 whitespace-nowrap px-3 text-xs" : "h-9 px-3 text-sm",
        active
          ? "bg-primary-light text-foreground"
          : "text-muted hover:bg-item-hover hover:text-foreground",
      )}
    >
      <Icon className={cn("size-4", active ? "text-primary" : "text-muted")} />
      {item.label}
    </Link>
  );
}

export function AppSidebar({
  isAdmin,
  mobile = false,
}: {
  isAdmin: boolean;
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <nav
        className="scrollbar-clean flex gap-1 overflow-x-auto border-b border-border bg-surface px-3 py-2"
        aria-label="Điều hướng bảng điều khiển"
      >
        {USER_NAV.map((item) => (
          <NavLink key={item.href} item={item} exact={item.href === "/dashboard"} compact />
        ))}
        {isAdmin
          ? ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} exact={item.href === "/admin"} compact />
            ))
          : null}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Điều hướng bảng điều khiển">
      {USER_NAV.map((item) => (
        <NavLink key={item.href} item={item} exact={item.href === "/dashboard"} />
      ))}

      {isAdmin ? (
        <>
          <p className="mt-4 px-3 pb-1 text-[11px] font-medium tracking-wide text-muted uppercase">
            Quản trị
          </p>
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} exact={item.href === "/admin"} />
          ))}
        </>
      ) : null}
    </nav>
  );
}
