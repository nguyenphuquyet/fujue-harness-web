import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { Topbar } from "@/components/app/topbar";
import { AppSidebar } from "@/components/app/sidebar";
import { Logo } from "@/components/brand/logo";

/**
 * Khung app cho bảng điều khiển và trang quản trị: cột điều hướng bên trái,
 * thanh trên cùng chứa tài khoản.
 */
export async function AppShell({
  children,
  requireAdmin = false,
  next,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
  next: string;
}) {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (requireAdmin && user.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-surface lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-border px-4">
          <Logo compact />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-3">
          <AppSidebar isAdmin={user.role === "admin"} />
        </div>

        <div className="border-t border-border p-3">
          <Link
            href="/docs"
            className="flex h-9 items-center gap-2 rounded-lg px-3 text-xs text-muted transition-colors hover:bg-item-hover hover:text-foreground"
          >
            <LifeBuoy className="size-3.5" />
            Hướng dẫn sử dụng
          </Link>
          <Link
            href="/"
            className="flex h-9 items-center gap-2 rounded-lg px-3 text-xs text-muted transition-colors hover:bg-item-hover hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Về trang chủ
          </Link>
          <p className="px-3 pt-2 text-[10.5px] text-muted/70">FuJue Harness 0.9.2</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar name={user.name} email={user.email} plan={user.plan} isAdmin={user.role === "admin"} />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
