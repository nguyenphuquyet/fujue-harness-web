import Link from "next/link";
import {
  AppWindow,
  ArrowRight,
  Check,
  ChevronRight,
  Circle,
  Cpu,
  Download,
  KeyRound,
  Sparkles,
  Wallet,
} from "lucide-react";
import { currentUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { listKeys } from "@/lib/keys";
import {
  getDefaultModelSlug,
  listModels,
  parseInputTypes,
  parseReasoningEfforts,
} from "@/lib/models";
import { formatNumber, formatRelative, formatTokens, formatVnd, usageLastDays } from "@/lib/usage";
import { walletSummary } from "@/lib/wallet";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

type ActivityRow = {
  id: string;
  action: string;
  target: string | null;
  detail: string | null;
  created_at: number;
};

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) return null;

  const keys = listKeys(user.id).filter((key) => key.revoked_at === null);
  const usage = usageLastDays(user.id, 14);
  const wallet = walletSummary(user.id);
  const models = listModels().filter((model) => model.status !== "retired");
  const defaultModel = models.find((model) => model.slug === getDefaultModelSlug()) ?? models[0];
  const activity = all<ActivityRow>(
    "SELECT id, action, target, detail, created_at FROM audit_log WHERE actor_id = ? ORDER BY created_at DESC LIMIT 5",
    user.id,
  );

  const totals = usage.reduce(
    (acc, row) => ({
      requests: acc.requests + row.requests,
      tokensIn: acc.tokensIn + row.tokens_in,
      tokensOut: acc.tokensOut + row.tokens_out,
      cost: acc.cost + row.cost_vnd,
    }),
    { requests: 0, tokensIn: 0, tokensOut: 0, cost: 0 },
  );

  const maxRequests = Math.max(1, ...usage.map((row) => row.requests));
  const steps = [
    {
      key: "key",
      title: "Tạo khoá API đầu tiên",
      body: "Khoá dùng cho app và các tích hợp nội bộ. Mỗi máy nên một khoá riêng.",
      done: keys.length > 0,
      href: "/dashboard/keys",
      cta: "Quản lý khoá API",
    },
    {
      key: "app",
      title: "Cài FuJue Harness trên máy",
      body: "Bản xem trước 0.9.2 cho Windows, macOS và Linux.",
      done: false,
      href: "/downloads",
      cta: "Tải về",
    },
    {
      key: "first",
      title: "Mở app và giao việc đầu tiên",
      body: "Chọn thư mục dự án, chọn model rồi mô tả việc cần làm cho agent.",
      done: false,
      href: "/docs#bat-dau",
      cta: "Xem hướng dẫn",
    },
  ];
  const doneCount = steps.filter((step) => step.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);

  const modelCaps = defaultModel
    ? [
        parseInputTypes(defaultModel.input_types).includes("image") ? "Văn bản, ảnh" : "Văn bản",
        parseReasoningEfforts(defaultModel.reasoning_efforts)
          ? `${Object.keys(parseReasoningEfforts(defaultModel.reasoning_efforts) ?? {}).length} mức suy luận`
          : null,
        `${formatTokens(defaultModel.context_window)} ngữ cảnh`,
        defaultModel.input_price <= 0 && defaultModel.output_price <= 0 ? "Miễn phí" : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Tổng quan</h1>
          <p className="mt-1 text-sm text-muted">
            {user.name.split(" ").slice(-1)[0]}, đây là tình hình 14 ngày gần nhất.
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/downloads" variant="outline" size="sm">
            <Download className="size-3.5" />
            Tải app
          </ButtonLink>
          <ButtonLink href="/dashboard/billing" variant="primary" size="sm">
            <Wallet className="size-3.5" />
            Nạp tiền
          </ButtonLink>
        </div>
      </div>

      {/* Dải ví: số dư, chi tiêu 30 ngày, lệnh nạp đang chờ */}
      <section className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Link
          href="/dashboard/billing"
          className="flex flex-wrap items-baseline justify-between gap-x-3 px-4 py-3 transition-colors hover:bg-surface-hover sm:block sm:px-5 sm:py-4"
        >
          <p className="text-xs text-muted">Số dư hiện tại</p>
          <p
            className={`text-xl font-semibold tracking-tight tabular-nums sm:mt-1 sm:text-2xl ${
              wallet.balanceVnd <= 0 ? "text-danger" : ""
            }`}
          >
            {formatVnd(wallet.balanceVnd)}
          </p>
          <p className="hidden text-[11px] text-muted sm:mt-0.5 sm:block">
            {wallet.balanceVnd > 0 ? "Khả dụng cho model có giá" : "Nạp thêm để gọi model có giá"}
          </p>
        </Link>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 px-4 py-3 sm:block sm:px-5 sm:py-4">
          <p className="text-xs text-muted">Đã dùng 30 ngày</p>
          <p className="text-xl font-semibold tracking-tight tabular-nums sm:mt-1 sm:text-2xl">
            {formatVnd(wallet.used30Vnd)}
          </p>
          <p className="hidden text-[11px] text-muted sm:mt-0.5 sm:block">trừ theo giá niêm yết</p>
        </div>
        <Link
          href="/dashboard/billing"
          className="flex flex-wrap items-baseline justify-between gap-x-3 px-4 py-3 transition-colors hover:bg-surface-hover sm:block sm:px-5 sm:py-4"
        >
          <p className="text-xs text-muted">Đang chờ xác nhận</p>
          <p className="flex items-center gap-2 text-xl font-semibold tracking-tight tabular-nums sm:mt-1 sm:text-2xl">
            {formatVnd(wallet.pendingVnd)}
            {wallet.pendingCount > 0 ? <Badge tone="warning">{wallet.pendingCount} lệnh</Badge> : null}
          </p>
          <p className="hidden text-[11px] text-muted sm:mt-0.5 sm:block">
            {wallet.pendingCode ?? "chưa có lệnh nào"}
          </p>
        </Link>
      </section>

      {/* Hàng số liệu: một khối chia kẻ, không phải bốn card */}
      <section className="grid grid-cols-2 divide-border overflow-hidden rounded-2xl border border-border bg-surface sm:grid-cols-4 sm:divide-x">
        {[
          { label: "Lượt gọi", value: formatNumber(totals.requests), sub: "14 ngày" },
          { label: "Token vào", value: formatNumber(totals.tokensIn), sub: "tổng cộng" },
          { label: "Token ra", value: formatNumber(totals.tokensOut), sub: "tổng cộng" },
          { label: "Chi phí", value: formatVnd(totals.cost), sub: "đã trừ khỏi ví" },
        ].map((cell) => (
          <div key={cell.label} className="border-b border-border px-5 py-4 sm:border-b-0">
            <p className="text-xs text-muted">{cell.label}</p>
            <p className="mt-1.5 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{cell.value}</p>
            <p className="mt-0.5 text-[11px] text-muted">{cell.sub}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Biểu đồ */}
        <section className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-medium">Lượt gọi theo ngày</h2>
              <p className="mt-0.5 text-xs text-muted">14 ngày gần nhất, tất cả model</p>
            </div>
            <Badge tone="neutral">14 ngày</Badge>
          </div>

          {usage.length === 0 ? (
            <div className="mt-6 flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/60 text-center">
              <p className="text-sm text-muted">Chưa có lượt gọi nào.</p>
              <p className="mt-1 text-xs text-muted">Mở app và giao việc đầu tiên để thấy số liệu.</p>
            </div>
          ) : (
            <>
              <div className="mt-6 flex h-40 items-end gap-1.5">
                {usage.map((row) => (
                  <div
                    key={row.day}
                    className="group relative flex h-full flex-1 flex-col justify-end"
                  >
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 rounded-md border border-border bg-surface-overlay px-2 py-1 font-mono text-[11px] whitespace-nowrap shadow-popover group-hover:block">
                      {formatNumber(row.requests)} lượt
                    </span>
                    <div
                      className="w-full rounded-t-[3px] bg-chart-fill transition-colors group-hover:bg-primary"
                      style={{ height: `${Math.max(4, (row.requests / maxRequests) * 100)}%` }}
                      title={`${row.day}: ${formatNumber(row.requests)} lượt`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-muted">
                <span>
                  {new Date(usage[0].day).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                </span>
                <span>
                  {new Date(usage[usage.length - 1].day).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              </div>
            </>
          )}
        </section>

        {/* Hoạt động gần đây */}
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-base font-medium">Hoạt động của bạn</h2>
          {activity.length === 0 ? (
            <p className="mt-6 text-sm text-muted">Chưa có thao tác nào.</p>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {activity.map((row) => (
                <li key={row.id} className="flex gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm leading-5">
                      <span className="font-medium">{row.action}</span>
                      {row.target ? <span className="text-muted"> · {row.target}</span> : null}
                    </p>
                    <p className="text-xs text-muted">{formatRelative(row.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Lối tắt model mặc định */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Cpu className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{defaultModel?.name ?? "Chưa có model"}</p>
                <Badge tone="brand">Mặc định</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted">{modelCaps || "Danh mục đang trống."}</p>
              <p className="mt-1 text-[11px] text-muted">
                {models.length} model đang phát hành.{" "}
                {defaultModel && defaultModel.input_price > 0
                  ? "Model có giá trừ tiền theo từng lượt gọi."
                  : "Model mặc định hiện không trừ tiền."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <ButtonLink href="/dashboard/billing" variant="outline" size="sm">
              <Wallet className="size-3.5" />
              Nạp tiền
            </ButtonLink>
            <ButtonLink href="/dashboard/models" variant="primary" size="sm">
              Xem model
              <ArrowRight className="size-3.5" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Các bước bắt đầu */}
        <section className="rounded-2xl border border-border bg-surface lg:col-span-2">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h2 className="text-sm font-medium">Các bước bắt đầu</h2>
              </div>
              <span className="text-xs text-muted">
                {doneCount} / {steps.length} bước
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${Math.max(progress, 4)}%` }}
              />
            </div>
          </div>

          <ul className="divide-y divide-border">
            {steps.map((step, index) => (
              <li key={step.key} className="flex items-start gap-3 px-5 py-4">
                {step.done ? (
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                ) : (
                  <Circle className="mt-0.5 size-5 shrink-0 text-muted/40" strokeWidth={1.5} />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${step.done ? "text-muted" : "font-medium"}`}>{step.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted">{step.body}</p>
                  {!step.done && index === steps.findIndex((item) => !item.done) ? (
                    <Link
                      href={step.href}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      {step.cta}
                      <ChevronRight className="size-3" />
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Khoá đang dùng */}
        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">Khoá đang hoạt động</h2>
            <Link href="/dashboard/keys" className="text-xs text-muted hover:text-foreground">
              Xem tất cả
            </Link>
          </div>
          {keys.length === 0 ? (
            <div className="mt-6">
              <p className="text-sm text-muted">Chưa có khoá nào.</p>
              <ButtonLink href="/dashboard/keys" variant="primary" size="sm" className="mt-3">
                Tạo khoá đầu tiên
              </ButtonLink>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {keys.slice(0, 4).map((key) => (
                <li key={key.id} className="py-2.5">
                  <p className="truncate text-sm">{key.name}</p>
                  <p className="font-mono text-[11px] text-muted">
                    {key.prefix}•••• · {formatRelative(key.last_used_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary-light text-primary">
            <AppWindow className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">Đã cài app nhưng chưa thấy phiên?</p>
            <p className="mt-1 text-xs text-muted">
              Mở app, chọn Đăng nhập bằng trình duyệt và duyệt mã thiết bị để nhận khoá riêng.
            </p>
          </div>
        </div>
        <ButtonLink href="/device" variant="outline" size="sm" className="shrink-0">
          Kết nối thiết bị
          <ArrowRight className="size-3.5" />
        </ButtonLink>
      </section>
    </div>
  );
}
