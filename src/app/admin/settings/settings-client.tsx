"use client";

import { useState } from "react";
import { Check, CircleAlert, Landmark, Loader2, QrCode, Save, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import {
  MAX_TOPUP_VND,
  MAX_VND_PER_USD,
  MIN_TOPUP_VND,
  MIN_VND_PER_USD,
  formatVnd,
  vietQrUrl,
  type WalletConfigView,
} from "@/lib/billing";

/**
 * Ngân hàng phổ biến kèm mã BIN dùng cho VietQR. Chọn tên là điền sẵn BIN và tên
 * hiển thị; ngân hàng ngoài danh sách vẫn nhập tay được.
 */
const BANKS: Array<{ bin: string; name: string }> = [
  { bin: "970436", name: "Vietcombank" },
  { bin: "970415", name: "VietinBank" },
  { bin: "970418", name: "BIDV" },
  { bin: "970405", name: "Agribank" },
  { bin: "970407", name: "Techcombank" },
  { bin: "970422", name: "MB Bank" },
  { bin: "970416", name: "ACB" },
  { bin: "970432", name: "VPBank" },
  { bin: "970423", name: "TPBank" },
  { bin: "970403", name: "Sacombank" },
  { bin: "970441", name: "VIB" },
  { bin: "970426", name: "MSB" },
  { bin: "970443", name: "SHB" },
  { bin: "970437", name: "HDBank" },
  { bin: "970448", name: "OCB" },
  { bin: "970440", name: "SeABank" },
  { bin: "970431", name: "Eximbank" },
  { bin: "970449", name: "LPBank" },
  { bin: "970454", name: "BVBank" },
];

const BIN_RE = /^\d{6}$/;
const ACCOUNT_RE = /^\d{6,19}$/;

function sourceLabel(source: WalletConfigView["bankSource"]): string {
  if (source === "settings") return "Lưu trong web";
  if (source === "env") return "Biến môi trường";
  return "Chưa cấu hình";
}

export function SettingsClient({
  initial,
  pendingCount,
}: {
  initial: WalletConfigView;
  pendingCount: number;
}) {
  const [bin, setBin] = useState(initial.bank?.bin ?? "");
  const [bankName, setBankName] = useState(initial.bank?.name ?? "");
  const [account, setAccount] = useState(initial.bank?.account ?? "");
  const [accountName, setAccountName] = useState(initial.bank?.accountName ?? "");
  const [rate, setRate] = useState(String(initial.vndPerUsd));
  const [bankSource, setBankSource] = useState(initial.bankSource);
  const [rateSource, setRateSource] = useState(initial.rateSource);
  const [baseline, setBaseline] = useState(() => ({
    bin: initial.bank?.bin ?? "",
    bankName: initial.bank?.name ?? "",
    account: initial.bank?.account ?? "",
    accountName: initial.bank?.accountName ?? "",
    rate: String(initial.vndPerUsd),
  }));
  const [custom, setCustom] = useState(
    () => initial.bank !== null && !BANKS.some((bank) => bank.bin === initial.bank?.bin),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);

  const known = BANKS.find((bank) => bank.bin === bin);
  const accountReady = ACCOUNT_RE.test(account.trim());
  const nameReady = accountName.trim().length >= 3;
  const bankReady = BIN_RE.test(bin.trim()) && accountReady && nameReady;
  const rateValue = Number(rate);
  const rateReady =
    Number.isFinite(rateValue) && rateValue >= MIN_VND_PER_USD && rateValue <= MAX_VND_PER_USD;
  const dirty =
    bin !== baseline.bin ||
    bankName !== baseline.bankName ||
    account !== baseline.account ||
    accountName !== baseline.accountName ||
    rate !== baseline.rate;

  function chooseBank(value: string) {
    setSaved(false);
    if (value === "custom") {
      setCustom(true);
      return;
    }
    setCustom(false);
    const found = BANKS.find((bank) => bank.bin === value);
    setBin(found?.bin ?? "");
    setBankName(found?.name ?? "");
  }

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    const response = await fetch("/api/v1/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bin: bin.trim(),
        bankName,
        account: account.trim(),
        accountName,
        vndPerUsd: rateValue,
      }),
    });
    const data = (await response.json()) as {
      error?: string;
      wallet?: WalletConfigView;
    };
    if (!response.ok || !data.wallet) {
      setError(data.error ?? "Không lưu được cấu hình.");
      setBusy(false);
      return;
    }
    setBin(data.wallet.bank?.bin ?? bin);
    setBankName(data.wallet.bank?.name ?? bankName);
    setAccount(data.wallet.bank?.account ?? account);
    setAccountName(data.wallet.bank?.accountName ?? accountName);
    setRate(String(data.wallet.vndPerUsd));
    setBankSource(data.wallet.bankSource);
    setRateSource(data.wallet.rateSource);
    setBaseline({
      bin: data.wallet.bank?.bin ?? bin,
      bankName: data.wallet.bank?.name ?? bankName,
      account: data.wallet.bank?.account ?? account,
      accountName: data.wallet.bank?.accountName ?? accountName,
      rate: String(data.wallet.vndPerUsd),
    });
    setSaved(true);
    setQrFailed(false);
    setBusy(false);
  }

  const memo = "FJ-0000-0000";
  const preview =
    bankReady && !qrFailed
      ? vietQrUrl(
          {
            bin: bin.trim(),
            name: bankName.trim() || `Ngân hàng ${bin.trim()}`,
            account: account.trim(),
            accountName: accountName.trim(),
          },
          100_000,
          memo,
        )
      : null;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Cài đặt</h1>
          <p className="mt-1 text-sm text-muted">
            Tài khoản nhận tiền và cách quy đổi giá model sang đồng.
          </p>
        </div>
        <Badge tone={bankSource === "settings" ? "success" : bankSource === "env" ? "warning" : "neutral"}>
          {sourceLabel(bankSource)}
        </Badge>
      </header>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
                bankReady ? "bg-primary-light text-primary" : "bg-warning-bg text-warning",
              )}
            >
              {bankReady ? <Wallet className="size-4" /> : <CircleAlert className="size-4" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {bankReady ? "Nạp tiền đang bật" : "Nạp tiền đang tắt"}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-muted">
                {bankReady
                  ? "Người dùng tạo được lệnh nạp và quét VietQR theo thông tin dưới đây."
                  : "Điền đủ ngân hàng, số tài khoản và tên chủ tài khoản để mở nạp tiền."}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Ngân hàng"
              htmlFor="bank-choice"
              hint="Chọn từ danh sách hoặc nhập tay ngân hàng khác."
            >
              <Select
                id="bank-choice"
                value={custom ? "custom" : (known?.bin ?? "")}
                onChange={(event) => chooseBank(event.target.value)}
              >
                <option value="">Chọn ngân hàng</option>
                {BANKS.map((bank) => (
                  <option key={bank.bin} value={bank.bin}>
                    {bank.name} · {bank.bin}
                  </option>
                ))}
                <option value="custom">Ngân hàng khác…</option>
              </Select>
            </Field>

            <Field label="Số tài khoản" htmlFor="bank-account" hint="Chỉ chữ số, 6–19 ký tự.">
              <Input
                id="bank-account"
                inputMode="numeric"
                autoComplete="off"
                value={account}
                onChange={(event) => {
                  setSaved(false);
                  setAccount(event.target.value.replace(/\D/g, "").slice(0, 19));
                }}
                placeholder="0123456789"
                className="tabular-nums"
              />
            </Field>

            {custom ? (
              <>
                <Field label="Mã BIN" htmlFor="bank-bin" hint="6 chữ số, tra ở danh sách ngân hàng VietQR.">
                  <Input
                    id="bank-bin"
                    inputMode="numeric"
                    autoComplete="off"
                    value={bin}
                    onChange={(event) => {
                      setSaved(false);
                      setBin(event.target.value.replace(/\D/g, "").slice(0, 6));
                    }}
                    placeholder="970436"
                    className="tabular-nums"
                  />
                </Field>
                <Field label="Tên ngân hàng hiển thị" htmlFor="bank-name" hint="Không bắt buộc, tối đa 60 ký tự.">
                  <Input
                    id="bank-name"
                    value={bankName}
                    onChange={(event) => {
                      setSaved(false);
                      setBankName(event.target.value.slice(0, 60));
                    }}
                    placeholder="Vietcombank"
                  />
                </Field>
              </>
            ) : null}

            <Field
              label="Chủ tài khoản"
              htmlFor="bank-account-name"
              hint="Viết hoa không dấu, đúng như trên sao kê."
              error={accountName.trim() !== "" && !nameReady ? "Cần ít nhất 3 ký tự." : undefined}
            >
              <Input
                id="bank-account-name"
                value={accountName}
                onChange={(event) => {
                  setSaved(false);
                  setAccountName(event.target.value.toUpperCase().slice(0, 60));
                }}
                placeholder="NGUYEN VAN A"
              />
            </Field>

            <Field
              label="Tỷ giá"
              htmlFor="bank-rate"
              hint={`1 USD = ${rateReady ? formatVnd(rateValue) : "…"} · dùng để trừ tiền mỗi lượt gọi.`}
              error={
                rate !== "" && !rateReady
                  ? `Tỷ giá từ ${MIN_VND_PER_USD.toLocaleString("vi-VN")} đến ${MAX_VND_PER_USD.toLocaleString("vi-VN")} ₫/USD.`
                  : undefined
              }
            >
              <div className="relative">
                <Input
                  id="bank-rate"
                  inputMode="numeric"
                  autoComplete="off"
                  value={rate}
                  onChange={(event) => {
                    setSaved(false);
                    setRate(event.target.value.replace(/\D/g, "").slice(0, 6));
                  }}
                  placeholder="26500"
                  className="pr-14 tabular-nums"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">
                  ₫/USD
                </span>
              </div>
            </Field>
          </div>

          {bankSource === "env" && !saved ? (
            <p className="mt-4 rounded-xl bg-surface-subtle px-3 py-2.5 text-[11px] leading-5 text-muted">
              Đang dùng thông tin từ biến môi trường <span className="font-mono">FUJUE_BANK_*</span>. Lưu
              ở đây để chuyển sang cấu hình trong web; biến môi trường vẫn là giá trị dự phòng khi
              trống.
            </p>
          ) : null}

          {rateSource === "env" && !saved ? (
            <p className="mt-2 text-[11px] leading-5 text-muted">
              Tỷ giá đang lấy từ <span className="font-mono">FUJUE_VND_PER_USD</span>.
            </p>
          ) : null}

          {pendingCount > 0 ? (
            <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-5 text-warning">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
              Có {pendingCount} lệnh nạp đang chờ. Lệnh đã tạo sẽ hiển thị theo thông tin mới; nếu vừa
              đổi tài khoản, đối chiếu lại với người dùng trước khi xác nhận.
            </p>
          ) : null}

          {error ? (
            <p className="mt-3 rounded-xl border border-error-border bg-error-bg px-3 py-2 text-xs text-error-strong">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex items-center justify-end gap-3">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-success">
                <Check className="size-3.5" />
                Đã lưu, áp dụng ngay
              </span>
            ) : dirty ? (
              <span className="text-xs text-muted">Có thay đổi chưa lưu</span>
            ) : null}
            <Button
              variant="primary"
              size="sm"
              disabled={busy || !dirty}
              onClick={() => void save()}
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Lưu cài đặt
            </Button>
          </div>
        </section>

        <aside className="space-y-3 lg:sticky lg:top-20">
          <section className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <QrCode className="size-4 text-primary" />
              <h2 className="text-sm font-medium">Xem trước mã nhận tiền</h2>
            </div>
            <div className="px-4 py-4">
              {preview ? (
                <div className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    width={180}
                    height={214}
                    alt="Mã VietQR minh hoạ"
                    onError={() => setQrFailed(true)}
                    className="h-auto w-[180px] rounded-xl border border-border bg-white p-2"
                  />
                  <p className="text-center text-[11px] leading-5 text-muted">
                    Minh hoạ 100.000 ₫ · nội dung <span className="font-mono">{memo}</span>
                  </p>
                </div>
              ) : (
                <div className="flex h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-border-strong px-4 text-center">
                  <Landmark className="size-5 text-muted" />
                  <p className="mt-2 text-xs font-medium">Chưa đủ thông tin để tạo mã</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">
                    Chọn ngân hàng, nhập số tài khoản và chủ tài khoản.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-4 text-[11px] leading-5 text-muted">
            <p className="text-xs font-medium text-foreground">Lưu ý khi đổi thông tin</p>
            <ul className="mt-2 space-y-1.5">
              <li>· Mã QR của lệnh đang chờ được tạo lại theo thông tin mới ngay khi tải trang.</li>
              <li>· Tỷ giá mới áp dụng cho lượt gọi kế tiếp, không tính lại lượt đã trừ.</li>
              <li>
                · Lệnh nạp nhận từ {formatVnd(MIN_TOPUP_VND)} đến {formatVnd(MAX_TOPUP_VND)}, hết hạn
                sau 15 phút.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
