"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CircleAlert, Cpu, Image as ImageIcon, RotateCw, Search, Type, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { formatNumber, formatPricePerMillion, formatTokens, formatVnd } from "@/lib/format";
import type { InputModality } from "@/lib/model-config";

export type ModelCard = {
  slug: string;
  name: string;
  vendor: string;
  contextWindow: number;
  maxOutput: number;
  inputPrice: number;
  outputPrice: number;
  inputTypes: InputModality[];
  reasoningLevels: string[];
  status: string;
  isDefault: boolean;
  requests: number;
  tokens: number;
  costVnd: number;
};

type Filter = "all" | "image" | "reasoning" | "free";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "image", label: "Nhận ảnh" },
  { id: "reasoning", label: "Có suy luận" },
  { id: "free", label: "Miễn phí" },
];

function isFree(model: ModelCard): boolean {
  return model.inputPrice <= 0 && model.outputPrice <= 0;
}

function pricingLabel(model: ModelCard): string {
  if (isFree(model)) return "Miễn phí";
  return `${formatPricePerMillion(model.inputPrice)} / ${formatPricePerMillion(model.outputPrice)}`;
}

function InputChips({ types }: { types: InputModality[] }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      {types.map((type) => (
        <span key={type} className="inline-flex items-center gap-1" title={type === "image" ? "Nhận ảnh" : "Văn bản"}>
          {type === "image" ? <ImageIcon className="size-3.5" /> : <Type className="size-3.5" />}
        </span>
      ))}
      <span>{types.includes("image") ? "Văn bản, ảnh" : "Văn bản"}</span>
    </span>
  );
}

export function ModelsClient({ models, balanceVnd }: { models: ModelCard[]; balanceVnd: number }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return models.filter((model) => {
      if (filter === "image" && !model.inputTypes.includes("image")) return false;
      if (filter === "reasoning" && model.reasoningLevels.length === 0) return false;
      if (filter === "free" && !isFree(model)) return false;
      if (text === "") return true;
      return `${model.name} ${model.slug} ${model.vendor}`.toLowerCase().includes(text);
    });
  }, [models, filter, query]);

  const freeCount = models.filter(isFree).length;

  if (models.length === 0) {
    return (
      <div className="space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Model</h1>
            <p className="mt-1 text-sm text-muted">Danh mục model harness dùng để giao việc.</p>
          </div>
        </header>
        <section className="rounded-2xl border border-dashed border-border-strong bg-surface px-5 py-12 text-center">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-light text-primary">
            <Cpu className="size-5" />
          </span>
          <p className="mt-3 text-sm font-medium">Chưa có model nào được phát hành</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted">
            Quản trị viên thêm model trong trang quản trị, danh mục sẽ hiện ở đây.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-xl border border-border-strong bg-surface px-3 text-xs hover:bg-item-hover"
          >
            <RotateCw className="size-3.5" />
            Tải lại danh mục
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Model</h1>
          <p className="mt-1 text-sm text-muted">
            {models.length} model đang phát hành · {freeCount} miễn phí. Giá tính theo 1 triệu token.
          </p>
        </div>
        <ButtonLink href="/dashboard/billing" variant="primary" size="sm">
          <Wallet className="size-3.5" />
          Nạp tiền
        </ButtonLink>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                aria-pressed={filter === item.id}
                className={cn(
                  "inline-flex h-8 items-center rounded-full px-3 text-xs transition-colors",
                  filter === item.id
                    ? "bg-primary text-primary-foreground"
                    : "border border-border-strong bg-surface text-muted hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="relative lg:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm model"
              className="h-9 pl-8 text-sm"
              aria-label="Tìm model"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium">Không có model khớp bộ lọc</p>
            <p className="mt-1 text-xs text-muted">Thử bỏ bộ lọc hoặc từ khoá khác.</p>
          </div>
        ) : (
          <>
            {/* Bảng cho màn rộng */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="bg-surface-subtle text-[11px] text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Model</th>
                    <th className="px-3 py-2.5 font-medium whitespace-nowrap">Giá vào / ra</th>
                    <th className="px-3 py-2.5 font-medium whitespace-nowrap">Nhận</th>
                    <th className="px-3 py-2.5 font-medium whitespace-nowrap">Suy luận</th>
                    <th className="hidden px-3 py-2.5 text-right font-medium whitespace-nowrap lg:table-cell">
                      Dùng 30 ngày
                    </th>
                    <th className="px-3 py-2.5 text-right font-medium whitespace-nowrap">Chi phí</th>
                    <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visible.map((model) => (
                    <tr key={model.slug} className="transition-colors hover:bg-surface-hover">
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-sm font-medium">{model.name}</p>
                            {model.isDefault ? <Badge tone="brand">Mặc định</Badge> : null}
                          </div>
                          <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
                            {model.slug} · {model.vendor} · {formatTokens(model.contextWindow)} ngữ cảnh
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap tabular-nums">
                        {isFree(model) ? (
                          <span className="text-success">Miễn phí</span>
                        ) : (
                          <>
                            <span className="font-medium">{pricingLabel(model)}</span>
                            <p className="text-[11px] text-muted">USD / 1M token</p>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <InputChips types={model.inputTypes} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {model.reasoningLevels.length === 0 ? (
                          <span className="text-xs text-muted">Không</span>
                        ) : (
                          <Badge tone="neutral" className="font-mono text-[10.5px]">
                            {model.reasoningLevels.join(" · ")}
                          </Badge>
                        )}
                      </td>
                      <td className="hidden px-3 py-3 text-right text-xs whitespace-nowrap tabular-nums lg:table-cell">
                        {model.requests === 0 ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <>
                            <span className="text-sm">{formatNumber(model.requests)}</span>
                            <p className="text-[11px] text-muted">{formatTokens(model.tokens)} token</p>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-xs whitespace-nowrap tabular-nums">
                        {model.costVnd === 0 ? (
                          <span className="text-muted">—</span>
                        ) : (
                          formatVnd(model.costVnd)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Badge
                          tone={
                            model.status === "stable"
                              ? "success"
                              : model.status === "beta"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {model.status === "stable"
                            ? "Ổn định"
                            : model.status === "beta"
                              ? "Beta"
                              : "Xem trước"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Thẻ cho điện thoại */}
            <div className="divide-y divide-border md:hidden">
              {visible.map((model) => (
                <section key={model.slug} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{model.name}</p>
                    {model.isDefault ? <Badge tone="brand">Mặc định</Badge> : null}
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
                    {model.slug} · {model.vendor}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <InputChips types={model.inputTypes} />
                    {model.reasoningLevels.length > 0 ? (
                      <span className="text-[11px] text-muted">{model.reasoningLevels.length} mức suy luận</span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3 border-t border-border pt-3">
                    <div>
                      <p className="text-xs text-muted">Giá vào / ra</p>
                      <p className="mt-0.5 text-sm font-medium tabular-nums">
                        {isFree(model) ? <span className="text-success">Miễn phí</span> : pricingLabel(model)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm tabular-nums">
                        {model.requests === 0 ? "—" : `${formatNumber(model.requests)} lượt`}
                      </p>
                      <p className="text-[11px] text-muted">
                        {model.costVnd === 0 ? "chưa phát sinh" : formatVnd(model.costVnd)}
                      </p>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
          <h2 className="text-base font-medium">Cách tính tiền</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">
            Giá trên bảng là USD cho mỗi 1 triệu token vào và ra. Mỗi lượt gọi được quy đổi sang
            đồng và trừ thẳng vào ví, làm tròn lên tới đồng. Model miễn phí không trừ tiền.
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-surface-subtle px-3.5 py-3">
              <dt className="text-xs text-muted">Tỷ giá quy đổi</dt>
              <dd className="mt-0.5 font-medium tabular-nums">1 USD = 26.500 ₫</dd>
            </div>
            <div className="rounded-xl bg-surface-subtle px-3.5 py-3">
              <dt className="text-xs text-muted">Khi ví hết tiền</dt>
              <dd className="mt-0.5 font-medium">Model có giá tạm dừng, model miễn phí vẫn chạy</dd>
            </div>
          </dl>
          <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-5 text-muted">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
            Chưa thấy chi phí tăng dù đã gọi model? Số liệu cập nhật theo lượt gọi hoàn tất, kể cả
            lượt đang stream.
          </p>
        </section>

        <section className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5">
          <div>
            <p className="text-xs text-muted">Số dư ví</p>
            <p className={cn("mt-1 text-2xl font-semibold tracking-tight tabular-nums", balanceVnd <= 0 && "text-danger")}>
              {formatVnd(balanceVnd)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              {balanceVnd > 0 ? "Đủ để gọi model có giá" : "Nạp thêm để gọi model có giá"}
            </p>
          </div>
          <ButtonLink href="/dashboard/billing" variant="outline" size="sm" className="mt-4 w-full">
            <Wallet className="size-3.5" />
            Nạp tiền
          </ButtonLink>
          <p className="mt-3 text-[11px] leading-5 text-muted">
            Cần model khác?{" "}
            <Link href="/docs" className="text-primary hover:underline">
              Xem hướng dẫn chọn model
            </Link>{" "}
            trong app.
          </p>
        </section>
      </div>
    </div>
  );
}
