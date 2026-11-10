import { MonitorSmartphone } from "lucide-react";
import { currentUser, listSessions } from "@/lib/auth";
import { formatDateTime } from "@/lib/usage";
import { Badge } from "@/components/ui/badge";

function describeAgent(agent: string | null): string {
  if (!agent) return "Không rõ thiết bị";
  const browser = agent.includes("Edg")
    ? "Edge"
    : agent.includes("Chrome")
      ? "Chrome"
      : agent.includes("Firefox")
        ? "Firefox"
        : agent.includes("Safari")
          ? "Safari"
          : "Trình duyệt";
  const os = agent.includes("Windows")
    ? "Windows"
    : agent.includes("Mac")
      ? "macOS"
      : agent.includes("Linux")
        ? "Linux"
        : agent.includes("Android")
          ? "Android"
          : agent.includes("iPhone")
            ? "iOS"
            : "";
  return os ? `${browser} · ${os}` : browser;
}

export default async function SessionsPage() {
  const user = await currentUser();
  if (!user) return null;
  const sessions = listSessions(user.id);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Phiên đăng nhập</h1>
        <p className="mt-1 text-sm text-muted">
          Mỗi lần đăng nhập tạo một phiên. Phiên hết hạn sau 30 ngày hoặc khi bạn đăng xuất.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left">
            <thead className="bg-surface text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Thiết bị</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Địa chỉ IP</th>
                <th className="px-4 py-3 font-medium">Bắt đầu</th>
                <th className="px-5 py-3 font-medium">Hết hạn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {sessions.map((session) => (
                <tr key={session.id} className="transition-colors hover:bg-surface-hover">
                  <td className="px-5 py-3.5">
                    <p className="flex items-center gap-2 text-sm">
                      <MonitorSmartphone className="size-3.5 text-muted" />
                      {describeAgent(session.user_agent)}
                    </p>
                    <p className="mt-0.5 max-w-md truncate text-[11px] text-muted">
                      {session.user_agent ?? "—"}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3.5 font-mono text-xs text-muted sm:table-cell">
                    {session.ip ?? "—"}
                  </td>
                  <td className="px-4 py-3.5 text-xs whitespace-nowrap text-muted">
                    {formatDateTime(session.created_at)}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone={session.expires_at > Date.now() ? "success" : "neutral"}>
                      {session.expires_at > Date.now() ? "Đang hiệu lực" : "Hết hạn"}
                    </Badge>
                    <p className="mt-1 text-[11px] whitespace-nowrap text-muted">
                      {formatDateTime(session.expires_at)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
