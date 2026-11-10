import Link from "next/link";
import { ArrowUpRight, Cpu, KeyRound, ShieldAlert, Users } from "lucide-react";
import { one } from "@/lib/db";
import { all } from "@/lib/db";
import { formatRelative } from "@/lib/usage";
import { Badge } from "@/components/ui/badge";

type Count = { n: number };

type LogRow = {
  id: string;
  actor_email: string | null;
  action: string;
  target: string | null;
  detail: string | null;
  created_at: number;
};

export default function AdminOverviewPage() {
  const users = one<Count>("SELECT COUNT(*) AS n FROM users")?.n ?? 0;
  const active = one<Count>("SELECT COUNT(*) AS n FROM users WHERE status = 'active'")?.n ?? 0;
  const admins = one<Count>("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'")?.n ?? 0;
  const keys = one<Count>("SELECT COUNT(*) AS n FROM api_keys WHERE revoked_at IS NULL")?.n ?? 0;
  const models = one<Count>("SELECT COUNT(*) AS n FROM models")?.n ?? 0;
  const requests = one<Count>("SELECT COALESCE(SUM(requests), 0) AS n FROM usage_daily")?.n ?? 0;
  const logs = all<LogRow>(
    "SELECT id, actor_email, action, target, detail, created_at FROM audit_log ORDER BY created_at DESC LIMIT 8",
  );

  const cells = [
    { label: "Người dùng", value: users, sub: `${active} đang hoạt động`, icon: Users, href: "/admin/users" },
    { label: "Quản trị viên", value: admins, sub: "có toàn quyền", icon: ShieldAlert, href: "/admin/users" },
    { label: "Khoá API", value: keys, sub: "đang hoạt động", icon: KeyRound, href: "/admin/users" },
    { label: "Model", value: models, sub: "trong danh mục", icon: Cpu, href: "/admin/models" },
  ];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Quản trị</h1>
        <p className="mt-1 text-sm text-muted">
          {requests.toLocaleString("vi-VN")} lượt gọi đã ghi nhận trên toàn hệ thống.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cells.map((cell) => {
          const Icon = cell.icon;
          return (
            <Link
              key={cell.label}
              href={cell.href}
              className="group rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">{cell.label}</p>
                <Icon className="size-3.5 text-muted" />
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{cell.value}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                {cell.sub}
                <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </p>
            </Link>
          );
        })}
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        <section className="min-w-0 rounded-2xl border border-border bg-surface lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-medium">Nhật ký gần đây</h2>
            <Link href="/admin/logs" className="text-xs text-muted hover:text-foreground">
              Xem tất cả
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {logs.map((log) => (
              <li key={log.id} className="flex items-start justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{log.action}</span>
                    {log.target ? <span className="text-muted"> · {log.target}</span> : null}
                  </p>
                  <p className="truncate text-[11px] text-muted">
                    {log.actor_email ?? "hệ thống"}
                    {log.detail ? ` · ${log.detail}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-muted">{formatRelative(log.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-medium">Việc cần để ý</h2>
          <ul className="mt-4 space-y-4">
            <li>
              <p className="text-sm">Tài khoản bị tạm khoá</p>
              <p className="text-xs text-muted">
                {one<Count>("SELECT COUNT(*) AS n FROM users WHERE status = 'suspended'")?.n ?? 0} tài khoản đang
                chờ mở lại.
              </p>
            </li>
            <li>
              <p className="text-sm">Model ở trạng thái beta</p>
              <p className="text-xs text-muted">
                {one<Count>("SELECT COUNT(*) AS n FROM models WHERE status = 'beta'")?.n ?? 0} model chưa chốt
                giá cuối.
              </p>
            </li>
            <li className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
              <Badge tone="success">Ổn định</Badge>
              <span className="text-xs text-muted">Không có lỗi dịch vụ trong 24 giờ</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
