"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Plus, Trash2, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export type KeyView = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed: string;
  revoked: boolean;
  requests: number;
};

export function KeysClient({ initial, limit }: { initial: KeyView[]; limit: number }) {
  const router = useRouter();
  const [keys, setKeys] = useState(initial);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);

  const activeCount = keys.filter((key) => !key.revoked).length;

  async function createKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/v1/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await response.json()) as {
        key?: { id: string; name: string; prefix: string; key: string; created_at: number };
        error?: string;
      };
      if (!response.ok || !data.key) {
        setError(data.error ?? "Không tạo được khoá.");
        setPending(false);
        return;
      }
      setCreatedKey(data.key.key);
      setName("");
      setKeys((current) => [
        {
          id: data.key!.id,
          name: data.key!.name,
          prefix: data.key!.prefix,
          createdAt: new Date(data.key!.created_at).toLocaleString("vi-VN"),
          lastUsed: "Chưa dùng",
          revoked: false,
          requests: 0,
        },
        ...current,
      ]);
      router.refresh();
    } catch {
      setError("Không kết nối được máy chủ.");
    } finally {
      setPending(false);
    }
  }

  async function revoke(id: string) {
    setConfirming(null);
    const response = await fetch(`/api/v1/keys/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Không thu hồi được khoá.");
      return;
    }
    setKeys((current) => current.map((key) => (key.id === id ? { ...key, revoked: true } : key)));
    router.refresh();
  }

  async function copy() {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Khoá API</h1>
          <p className="mt-1 text-sm text-muted">
            {activeCount} / {limit} khoá đang hoạt động. Khoá chỉ hiện đầy đủ một lần ngay khi tạo.
          </p>
        </div>
      </header>

      {createdKey ? (
        <div className="rounded-2xl border border-primary/40 bg-primary-light/40 p-5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Check className="size-4 text-success" />
            Đã tạo khoá. Sao chép ngay — trang này sẽ không hiện lại khoá đầy đủ.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 overflow-x-auto rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-xs">
              {createdKey}
            </code>
            <Button variant="outline" size="md" onClick={copy} className="shrink-0">
              {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
              {copied ? "Đã sao chép" : "Sao chép"}
            </Button>
            <Button variant="ghost" size="md" onClick={() => setCreatedKey(null)}>
              Ẩn
            </Button>
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-base font-medium">Tạo khoá mới</h2>
        <form onSubmit={createKey} className="mt-4">
          <label htmlFor="key-name" className="block text-sm font-medium text-foreground">
            Tên khoá
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              id="key-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nhập tên khoá"
              maxLength={60}
              className="sm:flex-1"
            />
            <button
              type="submit"
              disabled={pending}
              className={buttonClass("primary", "md", "shrink-0 sm:w-36")}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Tạo khoá
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">Ví dụ: Máy văn phòng, CI pipeline</p>
        </form>
        {error ? <p className="mt-2 text-xs text-error-text">{error}</p> : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left">
            <thead className="bg-surface text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Tên</th>
                <th className="px-4 py-3 font-medium">Khoá</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Dùng gần nhất</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Lượt gọi</th>
                <th className="px-5 py-3 text-right font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted">
                    Chưa có khoá nào. Tạo khoá đầu tiên ở trên.
                  </td>
                </tr>
              ) : (
                keys.map((key) => (
                  <tr key={key.id} className="transition-colors hover:bg-surface-hover">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium">{key.name}</p>
                      <p className="text-[11px] whitespace-nowrap text-muted">Tạo {key.createdAt}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap text-muted">
                      {key.prefix}••••
                    </td>
                    <td className="hidden px-4 py-3.5 text-xs whitespace-nowrap text-muted sm:table-cell">
                      {key.lastUsed}
                    </td>
                    <td className="hidden px-4 py-3.5 font-mono text-xs text-muted md:table-cell">
                      {key.requests.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {key.revoked ? (
                          <Badge tone="neutral">Đã thu hồi</Badge>
                        ) : (
                          <>
                            <Badge tone="success">Hoạt động</Badge>
                            <button
                              type="button"
                              onClick={() => setConfirming(key.id)}
                              className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-bg hover:text-danger"
                              aria-label={`Thu hồi khoá ${key.name}`}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {confirming ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-overlay p-5 shadow-modal">
            <p className="flex items-center gap-2 text-sm font-medium">
              <TriangleAlert className="size-4 text-warning" />
              Thu hồi khoá này?
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Mọi lệnh gọi đang dùng khoá sẽ nhận lỗi 401 ngay sau khi thu hồi. Không hoàn tác được.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirming(null)}>
                Huỷ
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="bg-danger-bg hover:bg-danger-bg-hover"
                onClick={() => revoke(confirming)}
              >
                Thu hồi khoá
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
