"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { formatRelative } from "@/lib/format";

export type ProviderView = {
  id: string;
  name: string;
  base_url: string;
  enabled: number;
  created_at: number;
  last_synced_at: number | null;
  last_error: string | null;
  last_summary: string | null;
  key_hint: string | null;
  models: number;
};

type Draft = { id?: string; name: string; baseUrl: string; apiKey: string };

const EMPTY: Draft = { name: "", baseUrl: "", apiKey: "" };

export function ProvidersPanel({ initial }: { initial: ProviderView[] }) {
  const router = useRouter();
  const [providers, setProviders] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProviderView | null>(null);

  function openCreate() {
    setError(null);
    setMessage(null);
    setDraft({ ...EMPTY });
  }

  function openEdit(provider: ProviderView) {
    setError(null);
    setMessage(null);
    setDraft({ id: provider.id, name: provider.name, baseUrl: provider.base_url, apiKey: "" });
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setPending(true);
    setError(null);

    const isEdit = Boolean(draft.id);
    const response = await fetch(
      isEdit ? `/api/v1/admin/providers/${draft.id}` : "/api/v1/admin/providers",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.name, baseUrl: draft.baseUrl, apiKey: draft.apiKey }),
      },
    );
    const data = (await response.json()) as { provider?: ProviderView; error?: string };
    if (!response.ok || !data.provider) {
      setError(data.error ?? "Không lưu được nguồn.");
      setPending(false);
      return;
    }

    setProviders((current) =>
      isEdit
        ? current.map((row) => (row.id === data.provider!.id ? data.provider! : row))
        : [...current, data.provider!],
    );
    setPending(false);
    setDraft(null);
    setMessage(isEdit ? "Đã lưu nguồn." : "Đã thêm nguồn. Bấm Đồng bộ để lấy danh mục model.");
  }

  async function sync(provider: ProviderView) {
    setBusy(provider.id);
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/v1/admin/providers/${provider.id}/sync`, { method: "POST" });
    const data = (await response.json()) as {
      result?: { total: number; added: number; updated: number; removed: number };
      provider?: ProviderView;
      error?: string;
    };

    if (!response.ok || !data.provider) {
      setError(data.error ?? "Đồng bộ thất bại.");
      setProviders((current) =>
        current.map((row) =>
          row.id === provider.id ? { ...row, last_error: data.error ?? "Đồng bộ thất bại." } : row,
        ),
      );
      setBusy(null);
      return;
    }

    setProviders((current) =>
      current.map((row) => (row.id === data.provider!.id ? data.provider! : row)),
    );
    setMessage(
      `Đã đồng bộ ${provider.name}: ${data.result?.total ?? 0} model · +${data.result?.added ?? 0} mới · ${data.result?.updated ?? 0} cập nhật · -${data.result?.removed ?? 0} xoá.`,
    );
    setBusy(null);
    router.refresh();
  }

  async function remove(provider: ProviderView) {
    setConfirmDelete(null);
    setBusy(provider.id);
    const response = await fetch(`/api/v1/admin/providers/${provider.id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Không xoá được nguồn.");
      setBusy(null);
      return;
    }
    setProviders((current) => current.filter((row) => row.id !== provider.id));
    setBusy(null);
    setMessage(`Đã xoá nguồn ${provider.name} và model nhập từ nguồn đó.`);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-medium">Nguồn model</h2>
            <p className="mt-0.5 text-xs text-muted">
              Kéo danh mục từ API tương thích OpenAI (<span className="font-mono">GET /models</span>). Đồng
              bộ lại bất cứ lúc nào; model biến mất khỏi nguồn sẽ bị gỡ khỏi danh mục.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            Thêm nguồn
          </Button>
        </header>

        {providers.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            Chưa nối nguồn nào. Danh mục dưới đây đang là model nhập tay.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {providers.map((provider) => (
              <li key={provider.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {provider.name}
                    {provider.models > 0 ? (
                      <Badge tone="neutral">{provider.models} model</Badge>
                    ) : (
                      <Badge tone="warning">Chưa đồng bộ</Badge>
                    )}
                    {provider.key_hint ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                        <KeyRound className="size-3" />
                        {provider.key_hint}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-muted">{provider.base_url}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    {provider.last_synced_at
                      ? `Đồng bộ ${formatRelative(provider.last_synced_at)}${provider.last_summary ? ` · ${provider.last_summary}` : ""}`
                      : "Chưa đồng bộ lần nào"}
                  </p>
                  {provider.last_error ? (
                    <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-error-bg px-2 py-1.5 text-[11px] leading-5 text-error-strong">
                      <TriangleAlert className="mt-0.5 size-3 shrink-0" />
                      <span className="min-w-0 break-words">{provider.last_error}</span>
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void sync(provider)}
                    disabled={busy === provider.id}
                    className={buttonClass("outline", "sm")}
                  >
                    {busy === provider.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    Đồng bộ
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(provider)}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-item-hover hover:text-foreground"
                    aria-label={`Sửa nguồn ${provider.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(provider)}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-bg hover:text-danger"
                    aria-label={`Xoá nguồn ${provider.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? (
        <p className="rounded-xl border border-error-border bg-error-bg px-3 py-2 text-xs text-error-strong">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted">{message}</p>
      ) : null}

      {draft ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <form
            onSubmit={save}
            className="w-full max-w-lg rounded-2xl border border-border bg-surface-overlay p-5 shadow-modal"
          >
            <h2 className="text-base font-medium">{draft.id ? "Sửa nguồn model" : "Thêm nguồn model"}</h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              Site gọi <span className="font-mono">GET {"{base URL}"}/models</span> kèm khoá dưới dạng{" "}
              <span className="font-mono">Authorization: Bearer …</span>.
            </p>

            <div className="mt-4 space-y-3">
              <Field label="Tên nguồn" htmlFor="provider-name" hint="Ví dụ: OpenRouter, DeepSeek, máy nội bộ">
                <Input
                  id="provider-name"
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  placeholder="OpenRouter"
                  autoFocus
                />
              </Field>

              <Field
                label="Base URL"
                htmlFor="provider-url"
                hint="Bỏ phần /models — site tự thêm vào."
              >
                <Input
                  id="provider-url"
                  value={draft.baseUrl}
                  onChange={(event) => setDraft({ ...draft, baseUrl: event.target.value })}
                  placeholder="https://openrouter.ai/api/v1"
                  className="font-mono text-xs"
                />
              </Field>

              <Field
                label="API key"
                htmlFor="provider-key"
                hint={
                  draft.id
                    ? "Để trống nếu giữ khoá đã lưu. Khoá không hiện lại sau khi lưu."
                    : "Để trống nếu API nguồn không cần khoá."
                }
              >
                <Input
                  id="provider-key"
                  type="password"
                  value={draft.apiKey}
                  onChange={(event) => setDraft({ ...draft, apiKey: event.target.value })}
                  placeholder="sk-…"
                  autoComplete="off"
                  className="font-mono text-xs"
                />
              </Field>
            </div>

            {error ? <p className="mt-3 text-xs text-error-text">{error}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(null)}>
                Huỷ
              </Button>
              <button type="submit" disabled={pending} className={buttonClass("primary", "sm")}>
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {draft.id ? "Lưu nguồn" : "Thêm nguồn"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-overlay p-5 shadow-modal">
            <p className="text-sm font-medium">Xoá nguồn {confirmDelete.name}?</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {confirmDelete.models} model nhập từ nguồn này sẽ bị gỡ khỏi danh mục công khai. Model
              nhập tay không bị ảnh hưởng.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
                Huỷ
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="bg-danger-bg hover:bg-danger-bg-hover"
                onClick={() => void remove(confirmDelete)}
              >
                Xoá nguồn
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
