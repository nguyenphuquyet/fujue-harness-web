import {
  ArrowUp,
  Check,
  ChevronDown,
  Circle,
  CircleDot,
  FileCode2,
  FolderGit2,
  History,
  Paperclip,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

function ToolStep({
  icon: Icon,
  title,
  detail,
  state = "done",
}: {
  icon: typeof FileCode2;
  title: string;
  detail: string;
  state?: "done" | "error" | "running";
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-subtle/70 px-2.5 py-2">
      <span
        className={
          state === "error"
            ? "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-danger-bg text-danger"
            : state === "running"
              ? "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary"
              : "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-success-bg text-success"
        }
      >
        {state === "done" ? (
          <Check className="size-3" />
        ) : state === "running" ? (
          <CircleDot className="size-3" />
        ) : (
          <Circle className="size-3" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[11.5px] leading-4 font-medium text-foreground">
          <Icon className="size-3 shrink-0 text-muted" />
          <span className="truncate">{title}</span>
        </p>
        <p className="mt-0.5 truncate text-[10.5px] leading-4 text-muted">{detail}</p>
      </div>
    </div>
  );
}

export function AppPreview() {
  return (
    <div
      className="app-window overflow-hidden rounded-2xl border border-white/10"
      aria-hidden
    >
      {/* Thanh tiêu đề */}
      <div className="flex h-10 items-center gap-2 border-b border-border px-3.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="size-2.5 rounded-full bg-[#febc2e]/80" />
          <span className="size-2.5 rounded-full bg-[#28c840]/80" />
        </div>
        <div className="ml-2 flex min-w-0 items-center gap-1.5 rounded-md bg-surface-subtle px-2 py-1 text-[10.5px] text-muted">
          <FolderGit2 className="size-3 shrink-0" />
          <span className="truncate">tuyendung-web</span>
          <ChevronDown className="size-3 shrink-0 opacity-60" />
        </div>
        <span className="ml-auto hidden items-center gap-1.5 text-[10.5px] text-muted sm:inline-flex">
          <span className="size-1.5 rounded-full bg-success" />
          Đã lưu phiên
        </span>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-44 shrink-0 flex-col border-r border-border p-2.5 sm:flex lg:w-48">
          <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary/90 text-[10px] font-semibold text-primary-foreground">
              FJ
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-foreground">Không gian cá nhân</p>
              <p className="text-[10px] text-muted">Gói Pro</p>
            </div>
          </div>

          <div className="mt-2 flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface-subtle px-2 text-[10.5px] text-muted">
            <Search className="size-3" />
            Tìm phiên, tệp…
          </div>

          <nav className="mt-3 space-y-0.5">
            {[
              { icon: History, label: "Phiên làm việc", active: true },
              { icon: Sparkles, label: "Tác vụ nền" },
              { icon: Wrench, label: "Công cụ" },
              { icon: ShieldCheck, label: "Quyền truy cập" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={
                    item.active
                      ? "flex h-7 items-center gap-2 rounded-md bg-primary-light px-2 text-[11px] font-medium text-foreground"
                      : "flex h-7 items-center gap-2 rounded-md px-2 text-[11px] text-muted"
                  }
                >
                  <Icon className={item.active ? "size-3.5 text-primary" : "size-3.5"} />
                  {item.label}
                </div>
              );
            })}
          </nav>

          <p className="mt-4 px-2 text-[9.5px] font-medium tracking-wider text-muted uppercase">
            Gần đây
          </p>
          <div className="mt-1.5 space-y-0.5">
            {["Sửa lỗi build gói web", "Viết test cho API khoá", "Dọn component cũ"].map((label, index) => (
              <p
                key={label}
                className={
                  index === 0
                    ? "truncate rounded-md px-2 py-1.5 text-[10.5px] text-foreground"
                    : "truncate rounded-md px-2 py-1.5 text-[10.5px] text-muted"
                }
              >
                {label}
              </p>
            ))}
          </div>

          <div className="mt-auto flex items-center gap-2 rounded-md px-2 py-1.5 text-[10.5px] text-muted">
            <Settings className="size-3.5" />
            Cài đặt
          </div>
        </aside>

        {/* Nội dung phiên */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-10 items-center gap-2 border-b border-border px-3.5">
            <FolderGit2 className="size-3.5 text-muted" />
            <span className="truncate text-[11px] text-muted">tuyendung-web</span>
            <span className="text-[11px] text-muted/50">/</span>
            <span className="truncate text-[11px] font-medium text-foreground">Sửa lỗi build</span>
            <span className="ml-auto hidden items-center gap-1 rounded-full border border-border bg-surface-subtle px-2 py-0.5 text-[10px] text-muted md:inline-flex">
              <span className="size-1.5 rounded-full bg-success" />
              DeepSeek V4
            </span>
            <span className="flex size-6 items-center justify-center rounded-full bg-primary-light text-[9.5px] font-medium text-primary">
              LQ
            </span>
          </div>

          <div className="space-y-3 p-3.5 sm:p-4">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-xl rounded-br-sm bg-primary px-3 py-2 text-[11.5px] leading-5 text-primary-foreground">
                Sửa lỗi build của gói web, chạy lại test rồi tóm tắt thay đổi.
              </p>
            </div>

            <div className="flex gap-2.5">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                <Sparkles className="size-3" />
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-[11.5px] leading-5 text-foreground">
                  Đã đọc cấu trúc dự án. Tìm thấy lỗi import trong{" "}
                  <span className="rounded bg-surface-subtle px-1 font-mono text-[10.5px]">
                    lib/env.ts
                  </span>
                  .
                </p>
                <ToolStep icon={FileCode2} title="Đọc 42 tệp" detail="apps/web · packages/ui" />
                <ToolStep
                  icon={Wrench}
                  title="Chạy pnpm build"
                  detail="TS2305: Module '@/lib/env' has no exported member"
                  state="error"
                />
                <ToolStep
                  icon={FileCode2}
                  title="Sửa 2 tệp"
                  detail="env.ts · .env.example"
                  state="running"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-success/25 bg-success-bg px-2.5 py-1.5 text-[10.5px] text-success">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3" />
                Build và test đã qua
              </span>
              <span className="hidden text-success/80 sm:inline">38.412 vào · 4.109 ra · $0,015</span>
            </div>
          </div>

          <div className="mt-auto border-t border-border p-2.5 sm:p-3">
            <div className="rounded-xl border border-border-strong bg-surface-subtle p-2">
              <p className="px-1 text-[11px] text-muted">Giao việc tiếp theo…</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="flex size-6 items-center justify-center rounded-md text-muted">
                  <Paperclip className="size-3.5" />
                </span>
                <span className="flex size-6 items-center justify-center rounded-md text-muted">
                  <Plus className="size-3.5" />
                </span>
                <span className="ml-auto rounded-md border border-border px-1.5 py-0.5 text-[9.5px] text-muted">
                  ⌘ ↵
                </span>
                <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <ArrowUp className="size-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
