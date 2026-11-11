"use client";

import { useState } from "react";
import { Loader2, Pencil, Pin, Plus, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import {
  DEFAULT_REASONING_EFFORTS,
  INPUT_MODALITIES,
  REASONING_LEVELS,
  type InputModality,
  type ReasoningEfforts,
  type ReasoningLevel,
} from "@/lib/model-config";

export type ModelView = {
  id: string;
  slug: string;
  name: string;
  family: string;
  vendor: string;
  contextWindow: number;
  maxOutput: number;
  inputPrice: number;
  outputPrice: number;
  speed: string;
  status: string;
  description: string;
  featured: boolean;
  /** Kiểu đầu vào model nhận, luôn có ít nhất `text`. */
  inputTypes: InputModality[];
  /** Mức suy luận → giá trị gửi lên API, null khi model không suy luận. */
  reasoningEfforts: ReasoningEfforts | null;
  released: string;
  /** Model mặc định harness dùng khi cấu hình không chỉ định model khác. */
  isDefault: boolean;
  /** Nguồn model được gắn, null khi nhập tay. */
  providerId: string | null;
  /** Mã model bên nguồn, null khi nhập tay hoặc chưa khai báo. */
  externalId: string | null;
  /** Tên nguồn đã nhập model, "Nhập tay" khi tạo trong trang quản trị. */
  source: string;
};

/** Nguồn chọn được trong hộp thoại: `""` là model nhập tay. */
export type ProviderOption = { id: string; name: string };

type Draft = Omit<
  ModelView,
  "id" | "released" | "source" | "providerId" | "externalId" | "isDefault"
> & {
  id?: string;
  providerId: string;
  externalId: string;
};

const EMPTY: Draft = {
  slug: "",
  name: "",
  family: "DeepSeek",
  vendor: "DeepSeek",
  contextWindow: 131072,
  maxOutput: 16384,
  inputPrice: 0.28,
  outputPrice: 1.12,
  speed: "balanced",
  status: "beta",
  description: "",
  featured: false,
  inputTypes: ["text"],
  reasoningEfforts: null,
  providerId: "",
  externalId: "",
};

/**
 * Ô giá trị để trống nghĩa là gửi đúng tên mức; riêng “off” luôn không gửi gì.
 *
 * @param efforts Bảng mức suy luận đang sửa, null khi model không suy luận.
 * @returns Bảng đã điền giá trị mặc định, hoặc null.
 */
function sanitizeEfforts(efforts: ReasoningEfforts | null): ReasoningEfforts | null {
  if (!efforts) return null;
  const entries = Object.entries(efforts).map(([level, wire]) => {
    if (level === "off") return [level, null] as const;
    const text = (wire ?? "").trim();
    return [level, text === "" ? level : text] as const;
  });
  return entries.length === 0 ? null : Object.fromEntries(entries);
}

/**
 * Đổi tên một mức, giữ nguyên thứ tự và giá trị tuỳ chỉnh đã gõ.
 *
 * @param efforts Bảng mức suy luận đang sửa.
 * @param from Mức hiện tại của dòng.
 * @param to Mức mới.
 * @returns Bảng mới, không sửa bảng cũ.
 */
function replaceLevel(
  efforts: ReasoningEfforts,
  from: string,
  to: ReasoningLevel,
): ReasoningEfforts {
  const next: ReasoningEfforts = {};
  for (const [level, wire] of Object.entries(efforts)) {
    if (level !== from) {
      next[level] = wire;
      continue;
    }
    next[to] =
      to === "off" ? null : typeof wire === "string" && wire !== "" && wire !== from ? wire : to;
  }
  return next;
}

export function ModelsClient({
  initial,
  providers,
}: {
  initial: ModelView[];
  providers: ProviderOption[];
}) {
  const [models, setModels] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ModelView | null>(null);
  const [sourceFilter, setSourceFilter] = useState("all");

  const manualCount = models.filter((model) => !model.providerId).length;
  const visible =
    sourceFilter === "all"
      ? models
      : models.filter((model) => model.providerId === sourceFilter);

  function openCreate() {
    setError(null);
    setDraft({ ...EMPTY, providerId: providers[0]?.id ?? "" });
  }

  function openEdit(model: ModelView) {
    setError(null);
    setDraft({
      ...model,
      providerId: model.providerId ?? "",
      externalId: model.externalId ?? "",
    });
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    if (!draft.providerId) {
      setError("Chọn nguồn cho model trước khi lưu.");
      return;
    }
    const efforts = sanitizeEfforts(draft.reasoningEfforts);
    if (efforts && !Object.keys(efforts).some((level) => level !== "off")) {
      setError("Bật suy luận thì cần thêm ít nhất một mức khác “off”.");
      return;
    }
    setPending(true);
    setError(null);

    const isEdit = Boolean(draft.id);
    const response = await fetch(isEdit ? `/api/v1/admin/models/${draft.id}` : "/api/v1/admin/models", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: draft.slug,
        name: draft.name,
        family: draft.family,
        vendor: draft.vendor,
        context_window: draft.contextWindow,
        max_output: draft.maxOutput,
        input_price: draft.inputPrice,
        output_price: draft.outputPrice,
        speed: draft.speed,
        status: draft.status,
        description: draft.description,
        featured: draft.featured,
        input_types: draft.inputTypes,
        reasoning_efforts: efforts,
        provider_id: draft.providerId,
        external_id: draft.externalId,
      }),
    });

    const data = (await response.json()) as { id?: string; error?: string };
    if (!response.ok) {
      setError(data.error ?? "Không lưu được model.");
      setPending(false);
      return;
    }

    const source =
      providers.find((provider) => provider.id === draft.providerId)?.name ?? "Chưa gắn nguồn";
    const saved: Omit<ModelView, "id" | "released" | "isDefault"> = {
      slug: draft.slug,
      name: draft.name,
      family: draft.family,
      vendor: draft.vendor,
      contextWindow: draft.contextWindow,
      maxOutput: draft.maxOutput,
      inputPrice: draft.inputPrice,
      outputPrice: draft.outputPrice,
      speed: draft.speed,
      status: draft.status,
      description: draft.description,
      featured: draft.featured,
      inputTypes: draft.inputTypes,
      reasoningEfforts: efforts,
      providerId: draft.providerId === "" ? null : draft.providerId,
      externalId: draft.externalId.trim() === "" ? null : draft.externalId.trim(),
      source,
    };

    setModels((current) => {
      if (isEdit) {
        return current.map((model) => (model.id === draft.id ? { ...model, ...saved } : model));
      }
      return [
        {
          ...saved,
          id: data.id ?? crypto.randomUUID(),
          released: new Date().toLocaleDateString("vi-VN"),
          isDefault: false,
        },
        ...current,
      ];
    });
    setPending(false);
    setDraft(null);
  }

  async function remove(model: ModelView) {
    setConfirmDelete(null);
    const response = await fetch(`/api/v1/admin/models/${model.id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Không xoá được model.");
      return;
    }
    setModels((current) => current.filter((row) => row.id !== model.id));
  }

  async function toggleFeatured(model: ModelView) {
    const next = !model.featured;
    setModels((current) =>
      current.map((row) => (row.id === model.id ? { ...row, featured: next } : row)),
    );
    await fetch(`/api/v1/admin/models/${model.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: next }),
    });
  }

  async function toggleDefault(model: ModelView) {
    const next = !model.isDefault;
    setModels((current) =>
      current.map((row) => ({ ...row, isDefault: next ? row.id === model.id : row.isDefault && row.id !== model.id })),
    );
    await fetch(`/api/v1/admin/models/${model.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ default: next }),
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-medium">Danh mục model</h2>
          <p className="mt-0.5 text-xs text-muted">
            {models.length} model đang hiện công khai và trong cấu hình harness. Ghim một model làm
            mặc định; giá tính theo 1 triệu token.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={openCreate}
          disabled={providers.length === 0}
          title={providers.length === 0 ? "Thêm nguồn model trước" : undefined}
        >
          <Plus className="size-3.5" />
          Thêm model
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-1.5">
        <SourceChip active={sourceFilter === "all"} onClick={() => setSourceFilter("all")}>
          Tất cả · {models.length}
        </SourceChip>
        {providers.map((provider) => (
          <SourceChip
            key={provider.id}
            active={sourceFilter === provider.id}
            onClick={() => setSourceFilter(provider.id)}
          >
            {provider.name} · {models.filter((model) => model.providerId === provider.id).length}
          </SourceChip>
        ))}
      </div>

      {manualCount > 0 ? (
        <p className="rounded-xl border border-warning-bg bg-warning-bg px-3 py-2 text-xs text-warning">
          {manualCount} model chưa gắn nguồn. Mở model và chọn nguồn để lần đồng bộ sau cập nhật
          giá, ngữ cảnh.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-error-border bg-error-bg px-3 py-2 text-xs text-error-strong">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left">
            <thead className="bg-surface text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Model</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Ngữ cảnh</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Vào / ra</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Nguồn</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted">
                    Không có model nào ở nguồn này.
                  </td>
                </tr>
              ) : null}
              {visible.map((model) => (
                <tr key={model.id} className="transition-colors hover:bg-surface-hover">
                  <td className="px-5 py-3">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {model.name}
                      {model.isDefault ? <Badge tone="success">Mặc định</Badge> : null}
                      {model.featured ? <Badge tone="brand">Nổi bật</Badge> : null}
                    </p>
                    <p className="font-mono text-[11px] whitespace-nowrap text-muted">
                      {model.slug} · {model.vendor}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge>
                        {model.inputTypes.includes("image") ? "Văn bản + hình ảnh" : "Văn bản"}
                      </Badge>
                      {model.reasoningEfforts ? (
                        <Badge tone="brand">
                          Suy luận · {Object.keys(model.reasoningEfforts).join(" / ")}
                        </Badge>
                      ) : null}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-muted sm:table-cell">
                    {(model.contextWindow / 1000).toLocaleString("vi-VN")}K
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 font-mono text-xs text-muted md:table-cell">
                    {model.inputPrice === 0 && model.outputPrice === 0
                      ? "Chưa niêm yết"
                      : `$${model.inputPrice.toFixed(2)} / $${model.outputPrice.toFixed(2)}`}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    {model.providerId ? (
                      <Badge tone="brand">{model.source}</Badge>
                    ) : (
                      <Badge tone="warning">Chưa gắn nguồn</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={model.status === "stable" ? "success" : "warning"}>
                      {model.status === "stable"
                        ? "Ổn định"
                        : model.status === "beta"
                          ? "Beta"
                          : "Xem trước"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => void toggleDefault(model)}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-item-hover hover:text-foreground"
                        aria-label={model.isDefault ? "Bỏ làm model mặc định" : "Đặt làm model mặc định"}
                        title={model.isDefault ? "Bỏ làm model mặc định" : "Đặt làm model mặc định"}
                      >
                        <Pin className={`size-3.5 ${model.isDefault ? "text-primary" : ""}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleFeatured(model)}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-item-hover hover:text-foreground"
                        aria-label={model.featured ? "Bỏ nổi bật" : "Đánh dấu nổi bật"}
                        title={model.featured ? "Bỏ nổi bật" : "Đánh dấu nổi bật"}
                      >
                        <Star className={`size-3.5 ${model.featured ? "text-primary" : ""}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(model)}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-item-hover hover:text-foreground"
                        aria-label={`Sửa ${model.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(model)}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-bg hover:text-danger"
                        aria-label={`Xoá ${model.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {draft ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form
            onSubmit={save}
            className="my-auto w-full max-w-lg rounded-2xl border border-border bg-surface-overlay p-5 shadow-modal"
          >
            <h2 className="text-base font-medium">{draft.id ? "Sửa model" : "Thêm model"}</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Nguồn model"
                  htmlFor="provider"
                  hint={
                    providers.length === 0
                      ? "Chưa có nguồn nào. Thêm nguồn ở khung phía trên trước khi thêm model."
                      : "Mọi model đều thuộc một nguồn. Lần đồng bộ sau sẽ cập nhật giá, ngữ cảnh và cảnh báo lỗi theo nguồn đó."
                  }
                >
                  <Select
                    id="provider"
                    value={draft.providerId}
                    onChange={(event) => setDraft({ ...draft, providerId: event.target.value })}
                  >
                    {draft.providerId === "" ? (
                      <option value="" disabled>
                        — Chọn nguồn —
                      </option>
                    ) : null}
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {draft.providerId ? (
                <div className="sm:col-span-2">
                  <Field
                    label="Mã model bên nguồn"
                    htmlFor="external-id"
                    hint="Đúng id trong GET /models của nguồn, ví dụ openai/gpt-4o. Để trống nếu nguồn không trả về model này."
                  >
                    <Input
                      id="external-id"
                      value={draft.externalId}
                      onChange={(event) => setDraft({ ...draft, externalId: event.target.value })}
                      placeholder="openai/gpt-4o"
                      className="font-mono text-xs"
                    />
                  </Field>
                </div>
              ) : null}

              <Field label="Mã model" htmlFor="slug" hint="Chữ thường, số, gạch ngang">
                <Input
                  id="slug"
                  value={draft.slug}
                  disabled={Boolean(draft.id)}
                  onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
                  placeholder="deepseek-v4"
                />
              </Field>
              <Field label="Tên hiển thị" htmlFor="model-name">
                <Input
                  id="model-name"
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  placeholder="DeepSeek V4"
                />
              </Field>
              <Field label="Họ model" htmlFor="family">
                <Input
                  id="family"
                  value={draft.family}
                  onChange={(event) => setDraft({ ...draft, family: event.target.value })}
                />
              </Field>
              <Field label="Nhà cung cấp" htmlFor="vendor">
                <Input
                  id="vendor"
                  value={draft.vendor}
                  onChange={(event) => setDraft({ ...draft, vendor: event.target.value })}
                />
              </Field>
              <Field label="Ngữ cảnh (token)" htmlFor="context">
                <Input
                  id="context"
                  type="number"
                  value={draft.contextWindow}
                  onChange={(event) =>
                    setDraft({ ...draft, contextWindow: Number(event.target.value) })
                  }
                />
              </Field>
              <Field label="Ra tối đa (token)" htmlFor="max-output">
                <Input
                  id="max-output"
                  type="number"
                  value={draft.maxOutput}
                  onChange={(event) => setDraft({ ...draft, maxOutput: Number(event.target.value) })}
                />
              </Field>
              <Field label="Giá vào ($/1M)" htmlFor="input-price">
                <Input
                  id="input-price"
                  type="number"
                  step="0.01"
                  value={draft.inputPrice}
                  onChange={(event) =>
                    setDraft({ ...draft, inputPrice: Number(event.target.value) })
                  }
                />
              </Field>
              <Field label="Giá ra ($/1M)" htmlFor="output-price">
                <Input
                  id="output-price"
                  type="number"
                  step="0.01"
                  value={draft.outputPrice}
                  onChange={(event) =>
                    setDraft({ ...draft, outputPrice: Number(event.target.value) })
                  }
                />
              </Field>
              <Field label="Tốc độ" htmlFor="speed">
                <Select
                  id="speed"
                  value={draft.speed}
                  onChange={(event) => setDraft({ ...draft, speed: event.target.value })}
                >
                  <option value="fast">Nhanh</option>
                  <option value="balanced">Cân bằng</option>
                  <option value="deep">Suy luận sâu</option>
                </Select>
              </Field>
              <Field label="Trạng thái" htmlFor="status">
                <Select
                  id="status"
                  value={draft.status}
                  onChange={(event) => setDraft({ ...draft, status: event.target.value })}
                >
                  <option value="stable">Ổn định</option>
                  <option value="beta">Beta</option>
                  <option value="preview">Xem trước</option>
                  <option value="retired">Ngừng phát hành</option>
                </Select>
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Mô tả" htmlFor="description" hint="Một câu, hiện dưới tên model">
                <Textarea
                  id="description"
                  rows={3}
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                />
              </Field>
            </div>

            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(event) => setDraft({ ...draft, featured: event.target.checked })}
                className="size-4 rounded border-border-strong bg-surface accent-[var(--primary)]"
              />
              Hiện ở mục “Nổi bật” trên trang chủ
            </label>

            <fieldset className="mt-4">
              <legend className="text-sm font-medium">Loại đầu vào</legend>
              <div className="mt-2 flex flex-wrap gap-4">
                {INPUT_MODALITIES.map((modality) => {
                  const checked = draft.inputTypes.includes(modality);
                  return (
                    <label key={modality} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        // Model luôn phải nhận ít nhất một kiểu đầu vào.
                        disabled={checked && draft.inputTypes.length === 1}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? INPUT_MODALITIES.filter(
                                (item) => item === modality || draft.inputTypes.includes(item),
                              )
                            : draft.inputTypes.filter((item) => item !== modality);
                          setDraft({ ...draft, inputTypes: next.length > 0 ? next : ["text"] });
                        }}
                        className="size-4 rounded border-border-strong bg-surface accent-[var(--primary)]"
                      />
                      {modality === "text" ? "Văn bản" : "Hình ảnh"}
                    </label>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Harness ghi thẳng vào <span className="font-mono">input</span> của pi-ai, nên model
                chỉ nhận hình ảnh nếu khai báo ở đây.
              </p>
            </fieldset>

            <div className="mt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Mức suy luận</span>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={draft.reasoningEfforts !== null}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        reasoningEfforts: event.target.checked
                          ? { ...DEFAULT_REASONING_EFFORTS }
                          : null,
                      })
                    }
                    className="size-4 rounded border-border-strong bg-surface accent-[var(--primary)]"
                  />
                  Bật suy luận
                </label>
              </div>

              {draft.reasoningEfforts ? (
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-[7.5rem_1fr_2rem] gap-2 text-[11px] text-muted">
                    <span>Mức</span>
                    <span>Giá trị gửi API</span>
                    <span aria-hidden />
                  </div>
                  {Object.entries(draft.reasoningEfforts).map(([level, wire], index) => (
                    <div key={index} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-2">
                      <Select
                        aria-label={`Mức suy luận ${index + 1}`}
                        value={level}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            reasoningEfforts: replaceLevel(
                              draft.reasoningEfforts ?? {},
                              level,
                              event.target.value as ReasoningLevel,
                            ),
                          })
                        }
                        className="h-9 md:h-9"
                      >
                        {REASONING_LEVELS.map((option) => (
                          <option
                            key={option}
                            value={option}
                            disabled={
                              option !== level &&
                              Object.prototype.hasOwnProperty.call(
                                draft.reasoningEfforts,
                                option,
                              )
                            }
                          >
                            {option}
                          </option>
                        ))}
                      </Select>
                      <Input
                        aria-label={`Giá trị gửi API cho ${level}`}
                        value={wire ?? ""}
                        disabled={level === "off"}
                        placeholder={level === "off" ? "Không gửi" : level}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            reasoningEfforts: {
                              ...draft.reasoningEfforts,
                              [level]: event.target.value === "" ? null : event.target.value,
                            },
                          })
                        }
                        className="h-9 font-mono text-xs md:h-9"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = Object.fromEntries(
                            Object.entries(draft.reasoningEfforts ?? {}).filter(
                              ([item]) => item !== level,
                            ),
                          );
                          setDraft({
                            ...draft,
                            reasoningEfforts: Object.keys(next).length > 0 ? next : null,
                          });
                        }}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-bg hover:text-danger"
                        aria-label={`Xoá mức ${level}`}
                        title={`Xoá mức ${level}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const used = Object.keys(draft.reasoningEfforts ?? {});
                      const level = REASONING_LEVELS.find((option) => !used.includes(option));
                      if (!level) return;
                      setDraft({
                        ...draft,
                        reasoningEfforts: {
                          ...draft.reasoningEfforts,
                          [level]: level === "off" ? null : level,
                        },
                      });
                    }}
                    disabled={Object.keys(draft.reasoningEfforts).length >= REASONING_LEVELS.length}
                  >
                    <Plus className="size-3.5" />
                    Thêm mức
                  </Button>
                </div>
              ) : (
                <p className="mt-1.5 text-xs text-muted">
                  Tắt: harness không khai báo mức nào, model không hiện lựa chọn suy luận.
                </p>
              )}
            </div>

            {error ? <p className="mt-3 text-xs text-error-text">{error}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(null)}>
                Huỷ
              </Button>
              <button type="submit" disabled={pending} className={buttonClass("primary", "sm")}>
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Lưu model
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-overlay p-5 shadow-modal">
            <p className="text-sm font-medium">Xoá model {confirmDelete.name}?</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Model biến khỏi danh mục công khai. Phiên đang chạy với model này sẽ báo lỗi ở lượt
              gọi kế tiếp.
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
                Xoá model
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Chip lọc theo nguồn model, kèm số lượng để so nhanh giữa các nguồn. */
function SourceChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-primary/40 bg-primary-light text-primary"
          : "border-border bg-surface text-muted hover:bg-item-hover hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
