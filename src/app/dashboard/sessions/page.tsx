import { MonitorSmartphone, ShieldCheck } from "lucide-react";
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
  const active = sessions.filter((session) => session.expires_at > Date.now()).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Phiên đăng nhập</h1>
          <p className="mt-1 text-sm text-muted">
            Mỗi lần đăng nhập tạo một phiên. Phiên hết hạn sau 30 ngày hoặc khi bạn đăng xuất.
          </p>
        </div>
        <Badge tone="neutral">{active} đang hiệu lực</Badge>
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
        <p className="text-xs leading-5 text-muted">
          Chỉ bạn thấy danh sách này. Nếu phát hiện phiên lạ, hãy đổi mật khẩu và thu hồi các khoá
          API không còn dùng trong mục Khoá API.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[30rem] text-left">
            <thead className="bg-surface-subtle text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Thiết bị</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Địa chỉ IP</th>
                <th className="px-4 py-3 font-medium">Bắt đầu</th>
                <th className="px-5 py-3 font-medium">Hết hạn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <p className="text-sm font-medium">Chưa có phiên nào</p>
                    <p className="mt-1 text-xs text-muted">
                      Phiên sẽ xuất hiện sau lần đăng nhập tiếp theo.
                    </p>
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-border sm:hidden">
          {sessions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-medium">Chưa có phiên nào</p>
              <p className="mt-1 text-xs text-muted">
                Phiên sẽ xuất hiện sau lần đăng nhập tiếp theo.
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <article key={session.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm">
                      <MonitorSmartphone className="size-3.5 shrink-0 text-muted" />
                      {describeAgent(session.user_agent)}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {session.user_agent ?? "—"}
                    </p>
                  </div>
                  <Badge tone={session.expires_at > Date.now() ? "success" : "neutral"}>
                    {session.expires_at > Date.now() ? "Đang hiệu lực" : "Hết hạn"}
                  </Badge>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-2 text-[11px]">
                  <div>
                    <dt className="text-muted">Bắt đầu</dt>
                    <dd className="mt-0.5 whitespace-nowrap">{formatDateTime(session.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Hết hạn</dt>
                    <dd className="mt-0.5 whitespace-nowrap">{formatDateTime(session.expires_at)}</dd>
                  </div>
                </dl>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
