"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, Copy, Landmark, Loader2, QrCode, Timer, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  MAX_TOPUP_VND,
  MIN_TOPUP_VND,
  TOPUP_DENOMINATIONS,
  TOPUP_STATUS_LABELS,
  formatVnd,
  vietQrUrl,
  type BankInfo,
} from "@/lib/billing";
import { formatDateTime } from "@/lib/format";

export type TopupItem = {
  id: string;
  code: string;
  amountVnd: number;
  status: string;
  createdAt: number;
  expiresAt: number;
};

function statusTone(status: string): "warning" | "success" | "danger" | "neutral" {
  if (status === "pending") return "warning";
  if (status === "paid") return "success";
  if (status === "rejected") return "danger";
  return "neutral";
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function BillingClient({
  balanceVnd,
  used30Vnd,
  pending,
  history,
  bank,
}: {
  balanceVnd: number;
  used30Vnd: number;
  pending: TopupItem | null;
  history: TopupItem[];
  bank: BankInfo | null;
}) {
  const router = useRouter();
  const [digits, setDigits] = useState(pending ? String(pending.amountVnd) : "100000");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [qrFailed, setQrFailed] = useState(false);
  const [clock, setClock] = useState<number | null>(null);

  useEffect(() => {
    setClock(Date.now());
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    setQrFailed(false);
  }, [pending?.code]);

  const amount = Number(digits || 0);
  const valid = Number.isFinite(amount) && amount >= MIN_TOPUP_VND && amount <= MAX_TOPUP_VND;
  const remaining = pending && clock !== null ? pending.expiresAt - clock : null;
  const expired = remaining !== null && remaining <= 0;

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
    } catch {
      setCopied(null);
    }
  }

  async function create() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/v1/billing/topups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount_vnd: amount }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Không tạo được lệnh nạp.");
    } else {
      router.refresh();
    }
    setBusy(false);
  }

  const step = pending && !expired ? 2 : pending ? 1 : 1;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Nạp tiền</h1>
          <p className="mt-1 text-sm text-muted">
            Chuyển khoản theo mã VietQR, quản trị viên đối chiếu rồi cộng vào ví.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 px-4 py-3 sm:block sm:px-5 sm:py-4">
          <p className="text-xs text-muted">Số dư hiện tại</p>
          <p className={cn("text-xl font-semibold tracking-tight tabular-nums sm:mt-1 sm:text-2xl", balanceVnd <= 0 && "text-danger")}>
            {formatVnd(balanceVnd)}
          </p>
          <p className="hidden text-[11px] text-muted sm:mt-0.5 sm:block">Dùng cho model có giá</p>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 px-4 py-3 sm:block sm:px-5 sm:py-4">
          <p className="text-xs text-muted">Đã dùng 30 ngày</p>
          <p className="text-xl font-semibold tracking-tight tabular-nums sm:mt-1 sm:text-2xl">
            {formatVnd(used30Vnd)}
          </p>
          <p className="hidden text-[11px] text-muted sm:mt-0.5 sm:block">trừ theo giá niêm yết</p>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 px-4 py-3 sm:block sm:px-5 sm:py-4">
          <p className="text-xs text-muted">Đang chờ xác nhận</p>
          <p className="flex items-center gap-2 text-xl font-semibold tracking-tight tabular-nums sm:mt-1 sm:text-2xl">
            {pending ? formatVnd(pending.amountVnd) : "0 ₫"}
            {pending ? <Badge tone="warning">1 lệnh</Badge> : null}
          </p>
          <p className="hidden text-[11px] text-muted sm:mt-0.5 sm:block">
            {pending ? pending.code : "chưa có lệnh nào"}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface px-5 py-3.5">
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
          {[
            ["1", "Số tiền", "done"],
            ["2", "Chuyển khoản", step === 2 ? "now" : "todo"],
            ["3", "Hoàn tất", "todo"],
          ].map(([index, label, state], position) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full",
                  state === "done" || state === "now"
                    ? state === "done"
                      ? "bg-primary text-primary-foreground"
                      : "border border-primary text-primary"
                    : "border border-border-strong text-muted",
                )}
              >
                {state === "done" ? <Check className="size-3" /> : index}
              </span>
              <span className={state === "now" ? "font-medium" : "text-muted"}>{label}</span>
              {position < 2 ? <span className="mx-2 hidden h-px w-10 bg-border sm:block" /> : null}
            </li>
          ))}
        </ol>
      </section>

      {!bank ? (
        <section className="rounded-2xl border border-error-border bg-error-bg px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-medium text-error-strong">
            <CircleAlert className="size-4" />
            Nạp tiền chưa được bật
          </p>
          <p className="mt-1 text-xs leading-5 text-error-strong/80">
            Quản trị viên chưa cấu hình tài khoản nhận tiền. Liên hệ để được hướng dẫn chuyển khoản.
          </p>
        </section>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-base font-medium">Chọn số tiền</h2>
          <p className="mt-0.5 text-xs text-muted">
            Mệnh giá gợi ý, hoặc nhập số khác từ {formatVnd(MIN_TOPUP_VND)} đến {formatVnd(MAX_TOPUP_VND)}.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TOPUP_DENOMINATIONS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDigits(String(value))}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left transition-colors",
                  amount === value
                    ? "border-primary bg-primary-light"
                    : "border-border-strong bg-surface hover:bg-item-hover",
                )}
              >
                <p className="text-sm font-medium tabular-nums">{formatVnd(value)}</p>
                <p className="mt-0.5 text-[11px] text-muted">chuyển một lần</p>
              </button>
            ))}
          </div>

          <label htmlFor="topup-amount" className="mt-4 block text-sm font-medium">
            Số tiền khác
          </label>
          <div className="relative mt-1.5">
            <input
              id="topup-amount"
              inputMode="numeric"
              autoComplete="off"
              value={amount > 0 ? amount.toLocaleString("vi-VN") : ""}
              onChange={(event) => setDigits(event.target.value.replace(/\D/g, "").slice(0, 9))}
              className="h-11 w-full rounded-xl border border-border-strong bg-surface px-3 pr-10 text-sm tabular-nums focus:border-focus focus:outline-none focus:ring-2 focus:ring-ring-focus md:h-10"
              placeholder="200.000"
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted">₫</span>
          </div>
          <p className="mt-1.5 text-[11px] text-muted">
            {amount === 0
              ? `Tối thiểu ${formatVnd(MIN_TOPUP_VND)}.`
              : valid
                ? `${formatVnd(amount)} · chuyển đúng số tiền này để được cộng đủ.`
                : `Số tiền ngoài khoảng cho phép (${formatVnd(MIN_TOPUP_VND)} – ${formatVnd(MAX_TOPUP_VND)}).`}
          </p>

          {error ? (
            <p className="mt-3 rounded-xl border border-error-border bg-error-bg px-3 py-2 text-xs text-error-strong">
              {error}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-20">
          <h2 className="text-base font-medium">Thanh toán</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Số tiền nạp</dt>
              <dd className="tabular-nums">{formatVnd(amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Phí chuyển khoản</dt>
              <dd>0 ₫</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2.5 font-medium">
              <dt>Tổng</dt>
              <dd className="tabular-nums">{formatVnd(amount)}</dd>
            </div>
          </dl>

          {pending ? (
            <div className="mt-4 rounded-xl bg-surface-subtle px-3 py-2.5 text-xs">
              <p className="font-medium">Đang có lệnh {pending.code} chờ xác nhận</p>
              <p className="mt-0.5 leading-5 text-muted">
                Quét mã bên dưới hoặc chờ quản trị viên đối chiếu. Tạo lệnh mới sẽ huỷ lệnh cũ.
              </p>
            </div>
          ) : null}

          <Button
            variant="primary"
            size="md"
            className="mt-3 w-full"
            disabled={!valid || busy || !bank}
            onClick={() => void create()}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
            {pending ? "Tạo lệnh khác" : "Tạo mã VietQR"}
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted">Mã có hiệu lực 15 phút</p>
        </section>
      </div>

      {pending && bank ? (
        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium">Chuyển khoản VietQR</h2>
              <Badge tone={expired ? "danger" : "warning"}>
                {expired ? "Đã hết hạn" : "Đang chờ xác nhận"}
              </Badge>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Timer className="size-3.5" />
              {expired
                ? "Tạo lệnh mới để tiếp tục"
                : remaining === null
                  ? "Còn 15 phút"
                  : `Còn ${formatCountdown(remaining)}`}
            </span>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-[200px_1fr]">
            <div className="flex flex-col items-center gap-2">
              {qrFailed ? (
                <div className="flex h-[200px] w-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border-strong px-3 text-center text-[11px] leading-5 text-muted">
                  Không tải được ảnh VietQR. Chuyển khoản theo thông tin bên cạnh.
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={vietQrUrl(bank, pending.amountVnd, pending.code)}
                  width={200}
                  height={200}
                  alt={`Mã VietQR cho lệnh ${pending.code}`}
                  onError={() => setQrFailed(true)}
                  className="h-auto w-[200px] rounded-xl border border-border bg-white p-2"
                />
              )}
              <p className="text-[11px] text-muted">Quét bằng app ngân hàng</p>
            </div>

            <div className="space-y-2.5 text-sm">
              {[
                ["Ngân hàng", bank.name],
                ["Số tài khoản", bank.account],
                ["Chủ tài khoản", bank.accountName],
                ["Số tiền", formatVnd(pending.amountVnd)],
                ["Nội dung", pending.code],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 border-b border-border pb-2 last:border-b-0">
                  <span className="shrink-0 text-xs text-muted">{label}</span>
                  <span className="flex items-center gap-1.5 text-right">
                    <span className={cn("tabular-nums", label === "Nội dung" && "font-mono text-[13px]")}>{value}</span>
                    <button
                      type="button"
                      onClick={() => void copy(value, label)}
                      className="inline-flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-item-hover hover:text-foreground"
                      aria-label={`Sao chép ${label.toLowerCase()}`}
                    >
                      {copied === label ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                    </button>
                  </span>
                </div>
              ))}
              <p className="pt-1 text-[11px] leading-5 text-muted">
                Chuyển đúng số tiền và giữ nguyên nội dung <span className="font-mono">{pending.code}</span> để
                quản trị viên đối chiếu nhanh. Ví chỉ được cộng sau khi xác nhận.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-base font-medium">Lệnh nạp của bạn</h2>
        </div>
        {history.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <span className="mx-auto inline-flex size-9 items-center justify-center rounded-xl bg-secondary text-muted">
              <Wallet className="size-4" />
            </span>
            <p className="mt-2 text-sm font-medium">Chưa có lệnh nạp nào</p>
            <p className="mt-1 text-xs text-muted">Chọn số tiền ở trên để tạo lệnh đầu tiên.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-subtle text-[11px] text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Mã lệnh</th>
                  <th className="px-3 py-2.5 text-right font-medium">Số tiền</th>
                  <th className="px-3 py-2.5 font-medium">Trạng thái</th>
                  <th className="px-5 py-2.5 text-right font-medium">Tạo lúc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((row) => (
                  <tr key={row.id}>
                    <td className="px-5 py-3 font-mono text-xs">{row.code}</td>
                    <td className="px-3 py-3 text-right text-sm tabular-nums">{formatVnd(row.amountVnd)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={statusTone(row.status)}>{TOPUP_STATUS_LABELS[row.status] ?? row.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-xs whitespace-nowrap text-muted">
                      {formatDateTime(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-start">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
          <Landmark className="size-4" />
        </span>
        <div className="text-sm">
          <p className="font-medium">Chuyển khoản xong mà ví chưa đổi?</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Quản trị viên đối chiếu sao kê theo mã lệnh, thường trong vài phút giờ hành chính.
            {pending ? (
              <>
                {" "}Nếu quá 30 phút, gửi mã lệnh{" "}
                <span className="font-mono">{pending.code}</span> cho quản trị viên.
              </>
            ) : null}
          </p>
        </div>
      </section>
    </div>
  );
}
