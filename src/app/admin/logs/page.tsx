import { all } from "@/lib/db";
import { formatDateTime } from "@/lib/usage";
import { Badge } from "@/components/ui/badge";

type LogRow = {
  id: string;
  actor_email: string | null;
  action: string;
  target: string | null;
  detail: string | null;
  created_at: number;
};

function toneFor(action: string) {
  if (action.includes("Xoá") || action.includes("khoá")) return "danger" as const;
  if (action.includes("Tạo")) return "success" as const;
  if (action.includes("Cập nhật") || action.includes("Duyệt")) return "brand" as const;
  return "neutral" as const;
}

export default function AdminLogsPage() {
  const logs = all<LogRow>(
    "SELECT id, actor_email, action, target, detail, created_at FROM audit_log ORDER BY created_at DESC LIMIT 100",
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Nhật ký thao tác</h1>
        <p className="mt-1 text-sm text-muted">100 sự kiện gần nhất trên toàn hệ thống.</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] text-left">
            <thead className="bg-surface text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Thời điểm</th>
                <th className="px-4 py-3 font-medium">Hành động</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Đối tượng</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Người thực hiện</th>
                <th className="px-5 py-3 font-medium">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {logs.map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-surface-hover">
                  <td className="px-5 py-3 text-xs whitespace-nowrap text-muted">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={toneFor(log.action)}>{log.action}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-sm sm:table-cell">{log.target ?? "—"}</td>
                  <td className="hidden px-4 py-3 text-xs text-muted md:table-cell">
                    {log.actor_email ?? "hệ thống"}
                  </td>
                  <td className="max-w-xs truncate px-5 py-3 text-xs text-muted">{log.detail ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
