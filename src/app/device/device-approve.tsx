"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeviceApprove({
  signedIn,
  initialCode = "",
}: {
  signedIn: boolean;
  initialCode?: string;
}) {
  const [code, setCode] = useState(initialCode);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/v1/device/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_code: code }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Không duyệt được mã.");
        setPending(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Không kết nối được máy chủ.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <CheckCircle2 className="mx-auto size-8 text-success" />
        <h2 className="mt-3 text-base font-medium">Đã duyệt thiết bị</h2>
        <p className="mt-1 text-sm text-muted">
          Quay lại FuJue Harness — app sẽ tự nhận khoá API trong vài giây.
        </p>
        <a
          href="/dashboard/keys"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Xem khoá vừa cấp
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary-light text-primary">
          <MonitorSmartphone className="size-4" />
        </span>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Kết nối thiết bị</h1>
          <p className="text-xs text-muted">Nhập mã 8 ký tự đang hiện trong app</p>
        </div>
      </div>

      {signedIn ? (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <label htmlFor="code" className="block text-sm font-medium">
            Mã thiết bị
          </label>
          <input
            id="code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="ABCD-2345"
            autoFocus
            className="h-12 w-full rounded-xl border border-border-strong bg-surface px-3 text-center font-mono text-lg tracking-[0.3em] text-foreground uppercase placeholder:text-muted/50 focus:border-focus focus:ring-2 focus:ring-ring-focus focus:outline-none"
            maxLength={9}
          />
          {error ? <p className="text-xs text-error-text">{error}</p> : null}
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Duyệt thiết bị
          </Button>
          <p className="text-center text-xs text-muted">
            Mã hết hạn sau 10 phút. Chỉ duyệt khi bạn vừa bấm đăng nhập trong app trên máy của mình.
          </p>
        </form>
      ) : (
        <div className="mt-6">
          <p className="text-sm text-muted">
            Đăng nhập tài khoản FuJue rồi quay lại trang này để duyệt mã thiết bị.
          </p>
          {initialCode ? (
            <p className="mt-3 rounded-xl border border-border bg-background px-3 py-2.5 text-center font-mono text-base tracking-[0.2em] text-foreground">
              {initialCode}
            </p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <a
              href={`/login?next=${encodeURIComponent(initialCode ? `/device?code=${initialCode}` : "/device")}`}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Đăng nhập
            </a>
            <a
              href="/register"
              className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border-strong text-sm font-medium hover:bg-button-hover"
            >
              Tạo tài khoản
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
