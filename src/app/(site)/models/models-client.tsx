"use client";

import { useMemo, useState } from "react";
import { Gauge, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export type ModelView = {
  slug: string;
  name: string;
  vendor: string;
  context: number;
  maxOutput: number;
  inputPrice: number;
  outputPrice: number;
  speed: string;
  speedLabel: string;
  status: string;
  statusLabel: string;
  description: string;
  featured: boolean;
};

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return String(value);
}

function formatPrice(value: number): string {
  if (value === 0) return "—";
  if (value < 0.1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(2)}`;
}

const STATUS_TABS = [
  { value: "all", label: "Mọi trạng thái" },
  { value: "stable", label: "Ổn định" },
  { value: "beta", label: "Beta" },
];

export function ModelsClient({ models, vendors }: { models: ModelView[]; vendors: string[] }) {
  const [query, setQuery] = useState("");
  const [vendor, setVendor] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return models.filter((model) => {
      if (vendor !== "all" && model.vendor !== vendor) return false;
      if (status !== "all" && model.status !== status) return false;
      if (!keyword) return true;
      return (
        model.name.toLowerCase().includes(keyword) ||
        model.vendor.toLowerCase().includes(keyword) ||
        model.description.toLowerCase().includes(keyword)
      );
    });
  }, [models, query, status, vendor]);

  const activeFilter = query.trim() !== "" || vendor !== "all" || status !== "all";

  return (
    <div>
      <div className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative lg:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm model, nhà cung cấp…"
              className="h-9 w-full rounded-lg border border-border-strong bg-surface pr-8 pl-8 text-sm text-foreground transition-colors placeholder:text-muted/70 focus:border-focus focus:ring-2 focus:ring-ring-focus focus:outline-none"
              aria-label="Tìm model"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted hover:text-foreground"
                aria-label="Xoá tìm kiếm"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1">
            {["all", ...vendors].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setVendor(item)}
                className={cn(
                  "h-8 shrink-0 rounded-lg px-2.5 text-xs transition-colors",
                  vendor === item
                    ? "bg-primary-light font-medium text-primary"
                    : "text-muted hover:bg-item-hover hover:text-foreground",
                )}
              >
                {item === "all" ? "Tất cả" : item}
              </button>
            ))}
          </div>

          <div className="flex gap-1 lg:ml-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatus(tab.value)}
                className={cn(
                  "h-8 shrink-0 rounded-lg px-2.5 text-xs transition-colors",
                  status === tab.value
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted hover:bg-item-hover hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-3 border-t border-border pt-3 text-xs text-muted">
          {filtered.length} / {models.length} model
          {activeFilter ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setVendor("all");
                setStatus("all");
              }}
              className="ml-2 font-medium text-primary hover:underline"
            >
              Bỏ bộ lọc
            </button>
          ) : null}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-border bg-surface px-6 py-16 text-center">
          <Search className="mx-auto size-5 text-muted" />
          <p className="mt-3 text-sm font-medium">Không tìm thấy model phù hợp</p>
          <p className="mt-1 text-xs text-muted">Thử từ khoá khác hoặc bỏ bớt bộ lọc.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setVendor("all");
              setStatus("all");
            }}
            className="mt-4 text-xs font-medium text-primary hover:underline"
          >
            Xoá bộ lọc
          </button>
        </div>
      ) : (
        <>
          <div className="mt-3 hidden overflow-hidden rounded-2xl border border-border md:block">
            <table className="w-full text-left">
              <thead className="bg-surface-subtle text-xs text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Ngữ cảnh</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Ra tối đa</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Vào / ra ($/1M)</th>
                  <th className="hidden px-4 py-3 font-medium xl:table-cell">Tốc độ</th>
                  <th className="px-5 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {filtered.map((model) => (
                  <tr key={model.slug} className="transition-colors hover:bg-surface-hover">
                    <td className="px-5 py-4">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {model.name}
                        {model.featured ? <Badge tone="brand">Nổi bật</Badge> : null}
                      </p>
                      <p className="mt-1 max-w-xl text-xs leading-5 text-muted">{model.description}</p>
                      <p className="mt-1 text-[11px] text-muted/80">{model.vendor}</p>
                    </td>
                    <td className="px-4 py-4 font-mono text-sm whitespace-nowrap text-muted">
                      {formatTokens(model.context)}
                    </td>
                    <td className="hidden px-4 py-4 font-mono text-sm whitespace-nowrap text-muted lg:table-cell">
                      {formatTokens(model.maxOutput)}
                    </td>
                    <td className="hidden px-4 py-4 font-mono text-sm whitespace-nowrap text-muted sm:table-cell">
                      {model.inputPrice === 0 && model.outputPrice === 0
                        ? "Chưa niêm yết"
                        : `${formatPrice(model.inputPrice)} / ${formatPrice(model.outputPrice)}`}
                    </td>
                    <td className="hidden px-4 py-4 text-sm whitespace-nowrap text-muted xl:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <Gauge className="size-3.5" />
                        {model.speedLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={model.status === "stable" ? "success" : "warning"}>
                        {model.statusLabel}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 grid gap-2 md:hidden">
            {filtered.map((model) => (
              <article key={model.slug} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{model.name}</p>
                  {model.featured ? <Badge tone="brand">Nổi bật</Badge> : null}
                  <Badge
                    tone={model.status === "stable" ? "success" : "warning"}
                    className="ml-auto"
                  >
                    {model.statusLabel}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-muted">{model.vendor}</p>
                <p className="mt-2 text-xs leading-5 text-muted">{model.description}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
                  <div>
                    <dt className="text-[11px] text-muted">Ngữ cảnh</dt>
                    <dd className="mt-0.5 font-mono">{formatTokens(model.context)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted">Vào / ra</dt>
                    <dd className="mt-0.5 font-mono">
                      {formatPrice(model.inputPrice)}/{formatPrice(model.outputPrice)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted">Tốc độ</dt>
                    <dd className="mt-0.5">{model.speedLabel}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
