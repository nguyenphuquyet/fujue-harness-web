import { redirect } from "next/navigation";
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
    <div className="min-h-dvh bg-background">
      <Topbar name={user.name} email={user.email} plan={user.plan} isAdmin={user.role === "admin"} />

      <div className="mx-auto flex w-full max-w-7xl min-h-[calc(100dvh-3.5rem)]">
        <aside className="hidden w-56 shrink-0 border-r border-border lg:block">
          <div className="sticky top-14 flex h-[calc(100dvh-3.5rem)] flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex h-12 items-center border-b border-border px-4">
                <Logo compact />
              </div>
              <AppSidebar isAdmin={user.role === "admin"} />
            </div>
            <div className="border-t border-border p-3">
              <a
                href="/"
                className="flex h-9 items-center rounded-lg px-3 text-xs text-muted hover:bg-item-hover hover:text-foreground"
              >
                ← Về trang chủ
              </a>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="lg:hidden">
            <AppSidebar isAdmin={user.role === "admin"} mobile />
          </div>
          <div className="p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
