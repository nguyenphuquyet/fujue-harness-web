"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
  X,
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

/** Một model đọc từ nguồn, chưa chắc đã có trong danh mục của site. */
type UpstreamModel = {
  externalId: string;
  name: string;
  vendor: string;
  contextWindow: number;
  maxOutput: number;
  inputPrice: number;
  outputPrice: number;
  description: string;
  released: number | null;
  imported: boolean;
};

type Draft = { id?: string; name: string; baseUrl: string; apiKey: string };

const EMPTY: Draft = { name: "", baseUrl: "", apiKey: "" };

/** Hiển thị ngữ cảnh ngắn gọn: 131072 → "131K", 1000000 → "1M". */
function contextLabel(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}K`;
  return String(tokens);
}

/** Giá trên 1 triệu token, hoặc "Chưa niêm yết" khi nguồn không trả giá. */
function priceLabel(model: UpstreamModel): string {
  if (model.inputPrice === 0 && model.outputPrice === 0) return "Chưa niêm yết";
  return `$${model.inputPrice.toFixed(2)} / $${model.outputPrice.toFixed(2)}`;
}

export function ProvidersPanel({ initial }: { initial: ProviderView[] }) {
  const router = useRouter();
  const [providers, setProviders] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProviderView | null>(null);

  // Hộp chọn model của một nguồn: đọc danh mục trước, chỉ ghi khi bấm đồng bộ.
  const [picker, setPicker] = useState<ProviderView | null>(null);
  const [catalog, setCatalog] = useState<UpstreamModel[] | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [savingPick, setSavingPick] = useState(false);
  const requestId = useRef(0);

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
    setMessage(
      isEdit
        ? "Đã lưu nguồn."
        : "Đã thêm nguồn. Giờ có thể thêm model ngay, hoặc bấm Đồng bộ để chọn model từ nguồn.",
    );
    // Nạp lại dữ liệu máy chủ để khung Thêm model nhận nguồn mới ngay, không
    // phải đồng bộ trước.
    router.refresh();
  }

  async function openPicker(provider: ProviderView) {
    setPicker(provider);
    setCatalog(null);
    setCatalogError(null);
    setQuery("");
    setPicked(new Set());
    setSavingPick(false);
    setLoadingCatalog(true);

    const request = ++requestId.current;
    try {
      const response = await fetch(`/api/v1/admin/providers/${provider.id}/models`);
      const data = (await response.json()) as { models?: UpstreamModel[]; error?: string };
      if (request !== requestId.current) return;
      if (!response.ok || !data.models) {
        setCatalogError(data.error ?? "Không tải được danh mục của nguồn.");
        return;
      }
      setCatalog(data.models);
      setPicked(new Set(data.models.filter((model) => model.imported).map((model) => model.externalId)));
    } catch {
      if (request !== requestId.current) return;
      setCatalogError("Không gọi được máy chủ. Kiểm tra kết nối rồi thử lại.");
    } finally {
      if (request === requestId.current) setLoadingCatalog(false);
    }
  }

  function closePicker() {
    requestId.current += 1;
    setPicker(null);
    setCatalog(null);
    setCatalogError(null);
    setPicked(new Set());
    setSavingPick(false);
  }

  function togglePick(externalId: string) {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(externalId)) next.delete(externalId);
      else next.add(externalId);
      return next;
    });
  }

  async function applySelection() {
    if (!picker) return;
    setSavingPick(true);
    setCatalogError(null);

    const response = await fetch(`/api/v1/admin/providers/${picker.id}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ external_ids: [...picked] }),
    });
    const data = (await response.json()) as {
      result?: { total: number; added: number; updated: number; removed: number };
      provider?: ProviderView;
      error?: string;
    };

    if (!response.ok || !data.provider) {
      setCatalogError(data.error ?? "Đồng bộ thất bại.");
      setSavingPick(false);
      return;
    }

    setProviders((current) =>
      current.map((row) => (row.id === data.provider!.id ? data.provider! : row)),
    );
    setMessage(
      `Đã đồng bộ ${picker.name}: ${data.result?.total ?? 0} model · +${data.result?.added ?? 0} mới · ${data.result?.updated ?? 0} cập nhật · -${data.result?.removed ?? 0} xoá.`,
    );
    setSavingPick(false);
    closePicker();
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

  const keyword = query.trim().toLowerCase();
  const visibleCatalog = catalog
    ? catalog.filter(
        (model) =>
          keyword === "" ||
          model.name.toLowerCase().includes(keyword) ||
          model.externalId.toLowerCase().includes(keyword),
      )
    : [];
  const pickedCount = picked.size;

  return (
    <div className="space-y-3">
      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-medium">Nguồn model</h2>
            <p className="mt-0.5 text-xs text-muted">
              Đọc danh mục từ API tương thích OpenAI (<span className="font-mono">GET /models</span>).
              Bấm Đồng bộ để chọn đúng model cần đưa vào danh mục; model bỏ chọn sẽ bị gỡ.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="size-3.5" />
            Thêm nguồn
          </Button>
        </header>

        {providers.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            Chưa nối nguồn nào. Thêm nguồn trước khi tạo model.
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
                      <Badge tone="warning">Chưa chọn model</Badge>
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
                    onClick={() => void openPicker(provider)}
                    disabled={busy === provider.id}
                    className={buttonClass("outline", "sm")}
                  >
                    <RefreshCw className="size-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 sm:items-center">
          <form
            onSubmit={save}
            className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-modal"
          >
            <h2 className="text-base font-medium">{draft.id ? "Sửa nguồn model" : "Thêm nguồn model"}</h2>
            <p className="mt-1 text-sm/6 text-muted">
              Site gọi <span className="font-mono text-xs">GET {"{base URL}"}/models</span> kèm khoá dưới dạng{" "}
              <span className="font-mono text-xs">Authorization: Bearer …</span>.
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
              <Button type="button" variant="secondary" size="sm" onClick={() => setDraft(null)}>
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

      {picker ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="provider-models-title"
            className="flex max-h-[min(100dvh-2rem,44rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-modal"
          >
            <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h2 id="provider-models-title" className="text-base font-medium">
                  Chọn model từ {picker.name}
                </h2>
                <p className="mt-1 text-sm/6 text-muted text-pretty">
                  Chỉ model được chọn mới vào danh mục công khai. Bỏ chọn model đã thêm sẽ gỡ nó
                  khỏi danh mục; model nhập tay không bị ảnh hưởng.
                </p>
              </div>
              <button
                type="button"
                onClick={closePicker}
                aria-label="Đóng"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-item-hover hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="border-b border-border px-5 py-3">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên hoặc mã model"
                aria-label="Tìm model từ nguồn"
                autoFocus
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loadingCatalog ? (
                <p className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-muted">
                  <Loader2 className="size-4 animate-spin" />
                  Đang tải danh mục từ nguồn…
                </p>
              ) : catalogError ? (
                <div className="px-5 py-10">
                  <p className="flex items-start gap-2 rounded-xl border border-error-border bg-error-bg px-3 py-2 text-sm text-error-strong">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    <span className="min-w-0 break-words">{catalogError}</span>
                  </p>
                  <div className="mt-3 flex justify-center">
                    <Button variant="outline" size="sm" onClick={() => void openPicker(picker)}>
                      Thử lại
                    </Button>
                  </div>
                </div>
              ) : visibleCatalog.length === 0 ? (
                <p className="px-5 py-16 text-center text-sm text-muted">
                  {catalog && catalog.length > 0
                    ? "Không có model nào khớp. Thử gõ ngắn hơn."
                    : "Nguồn không trả về model nào."}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {visibleCatalog.map((model) => (
                    <li key={model.externalId}>
                      <label className="flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors hover:bg-item-hover">
                        <input
                          type="checkbox"
                          checked={picked.has(model.externalId)}
                          onChange={() => togglePick(model.externalId)}
                          className="mt-0.5 size-4 rounded border-border-strong bg-surface accent-[var(--primary)]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{model.name}</span>
                            {model.imported ? <Badge tone="success">Đã thêm</Badge> : null}
                          </span>
                          <span
                            className="mt-0.5 block truncate font-mono text-[11px] text-muted"
                            title={model.externalId}
                          >
                            {model.externalId}
                          </span>
                          <span className="mt-1 block text-xs text-muted">
                            {contextLabel(model.contextWindow)} ngữ cảnh · {priceLabel(model)}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <footer className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">
                {catalog ? `Đã chọn ${pickedCount} / ${catalog.length} model` : "\u00a0"}
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="secondary" size="sm" onClick={closePicker} disabled={savingPick}>
                  Huỷ
                </Button>
                <button
                  type="button"
                  onClick={() => void applySelection()}
                  disabled={savingPick || loadingCatalog || Boolean(catalogError) || pickedCount === 0}
                  className={buttonClass("primary", "sm")}
                >
                  {savingPick ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Đồng bộ {pickedCount} model
                </button>
              </div>
            </footer>
          </div>
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-modal">
            <p className="text-base font-semibold">Xoá nguồn {confirmDelete.name}?</p>
            <p className="mt-2 text-sm/6 text-muted">
              <span className="font-medium text-foreground">{confirmDelete.models} model</span> nhập từ
              nguồn này sẽ bị gỡ khỏi danh mục công khai. Model nhập tay không bị ảnh hưởng.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)}>
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
