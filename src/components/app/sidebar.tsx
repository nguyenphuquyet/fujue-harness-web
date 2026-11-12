"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Cpu,
  KeyRound,
  LayoutDashboard,
  MonitorSmartphone,
  ScrollText,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

const ICONS = {
  overview: LayoutDashboard,
  keys: KeyRound,
  sessions: Activity,
  devices: MonitorSmartphone,
  wallet: Wallet,
  admin: ShieldCheck,
  users: Users,
  models: Cpu,
  logs: ScrollText,
};

const USER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan", icon: "overview" },
  { href: "/dashboard/models", label: "Model", icon: "models" },
  { href: "/dashboard/billing", label: "Nạp tiền", icon: "wallet" },
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

function NavLink({ item, exact }: { item: NavItem; exact?: boolean }) {
  const pathname = usePathname();
  const Icon = ICONS[item.icon];
  const active = exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 items-center gap-2.5 rounded-xl px-3 text-sm transition-colors",
        active
          ? "bg-primary-light font-medium text-primary"
          : "text-foreground/70 hover:bg-item-hover hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function AppSidebar({ isAdmin }: { isAdmin: boolean }) {
  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Điều hướng bảng điều khiển">
      {USER_NAV.map((item) => (
        <NavLink key={item.href} item={item} exact={item.href === "/dashboard"} />
      ))}

      {isAdmin ? (
        <>
          <p className="mt-5 px-3 pb-1.5 text-[11px] font-medium tracking-wide text-muted uppercase">
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
