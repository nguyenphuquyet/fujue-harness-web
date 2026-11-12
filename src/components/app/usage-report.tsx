"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatNumber, formatTokens, formatVnd } from "@/lib/format";
import type { ModelUsageRow, UsageRow, UsageTotals } from "@/lib/usage";

type Metric = "requests" | "tokens" | "cost";

const METRICS: { value: Metric; label: string; unit: string }[] = [
  { value: "requests", label: "Lượt gọi", unit: "lượt" },
  { value: "tokens", label: "Token", unit: "token" },
  { value: "cost", label: "Chi phí", unit: "" },
];

function metricValue(row: UsageRow, metric: Metric): number {
  if (metric === "requests") return row.requests;
  if (metric === "tokens") return row.tokens_in + row.tokens_out;
  return row.cost_vnd;
}

function formatMetric(value: number, metric: Metric): string {
  if (metric === "requests") return formatNumber(value);
  if (metric === "tokens") return formatTokens(value);
  return formatVnd(value);
}

/** Nhãn mức gọn cho trục trái: 1,2 tỷ / 40 tr / 800 nghìn. */
function formatCompact(value: number): string {
  const fmt = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  if (value >= 1_000_000_000) return `${fmt(value / 1_000_000_000)} tỷ`;
  if (value >= 1_000_000) return `${fmt(value / 1_000_000)} tr`;
  if (value >= 1_000) return `${fmt(value / 1_000)} nghìn`;
  return formatNumber(value);
}

function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 1, 2, 3, 4];
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  return [0, 1, 2, 3, 4].map((i) => step * i);
}

function dayShort(day: string): string {
  return new Date(day).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function Delta({ current, prev, kind }: { current: number; prev: number; kind: "neutral" | "cost" }) {
  if (prev <= 0) return null;
  const diff = current - prev;
  if (diff === 0) {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs text-muted">
        <Minus className="size-3.5" />
        Không đổi
      </p>
    );
  }
  const up = diff > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const tone = kind === "cost" ? (up ? "text-danger" : "text-success") : "text-muted";
  const text =
    prev < 20 && kind === "neutral"
      ? `${up ? "+" : "−"}${formatNumber(Math.abs(diff))}`
      : `${up ? "+" : "−"}${Math.abs((diff / prev) * 100).toLocaleString("vi-VN", {
          maximumFractionDigits: 1,
        })}%`;
  return (
    <p className={cn("mt-1 flex items-center gap-1 text-xs tabular-nums", tone)}>
      <Icon className="size-3.5" />
      {text}
    </p>
  );
}

function AxisLabels({
  daily,
  step,
  mobileStep,
}: {
  daily: UsageRow[];
  step: number;
  mobileStep: number;
}) {
  const n = daily.length;
  const label = (i: number, mobile: boolean) => (
    <div
      key={daily[i].day}
      className={cn(
        "absolute top-3 flex w-0",
        i === 0 ? "justify-start" : i === n - 1 ? "justify-end" : "justify-center",
      )}
      style={{ left: `${(i / (n - 1)) * 100}%` }}
    >
      <p className="text-xs text-muted whitespace-nowrap tabular-nums">
        {i === n - 1 && !mobile ? "Hôm nay" : dayShort(daily[i].day)}
      </p>
    </div>
  );
  // Hai bộ nhãn riêng theo breakpoint: bộ thừa phải display:none, nhãn invisible
  // vẫn chiếm layout và mực chữ của nó tràn mép phải ở màn hẹp.
  return (
    <div className="relative mt-3 h-8 border-t border-border">
      <div className="absolute inset-0 sm:hidden">
        {daily.map((_, i) => ((n - 1 - i) % mobileStep === 0 ? label(i, true) : null))}
      </div>
      <div className="absolute inset-0 max-sm:hidden">
        {daily.map((_, i) => ((n - 1 - i) % step === 0 ? label(i, false) : null))}
      </div>
    </div>
  );
}

function BarChart({ daily, metric }: { daily: UsageRow[]; metric: Metric }) {
  const values = daily.map((row) => metricValue(row, metric));
  const max = Math.max(1, ...values);
  return (
    <>
      <div className="mt-6 flex h-56 items-end gap-1.5 pt-6 sm:gap-3">
        {daily.map((row, i) => {
          const value = values[i];
          const pct = (value / max) * 100;
          const today = i === daily.length - 1;
          return (
            <div key={row.day} className="relative flex h-full flex-1 items-end">
              <p
                className="absolute inset-x-0 text-center text-xs font-medium text-muted tabular-nums"
                style={{ bottom: value === 0 ? 0 : `calc(${pct}% + 6px)` }}
              >
                {formatMetric(value, metric)}
              </p>
              {value > 0 ? (
                <div
                  className={cn(
                    "mx-auto w-full max-w-8 rounded-t-md",
                    today ? "bg-chart-fill/35" : "bg-chart-fill",
                  )}
                  style={{ height: `${pct}%` }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <AxisLabels daily={daily} step={1} mobileStep={Math.max(1, Math.ceil(daily.length / 4))} />
    </>
  );
}

function LineChart({
  daily,
  metric,
  unit,
  title,
}: {
  daily: UsageRow[];
  metric: Metric;
  unit: string;
  title: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const n = daily.length;
  const values = daily.map((row) => metricValue(row, metric));
  const ticks = niceTicks(Math.max(1, ...values));
  const top = ticks[ticks.length - 1];
  const x = (i: number) => (i / (n - 1)) * 100;
  const y = (v: number) => 100 - (v / top) * 100;
  const shown = active ?? n - 1;
  const step = Math.max(1, Math.ceil(n / 8));
  const mobileStep = Math.max(1, Math.ceil(n / 4));

  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const mainPoints = values.slice(0, n - 1).map((v, i) => `${x(i)},${y(v)}`).join(" ");

  const value = values[shown];
  const px = x(shown);
  const py = y(value);
  const leftNeighbor = shown > 0 ? values[shown - 1] : null;
  const rightNeighbor = shown < n - 1 ? values[shown + 1] : null;
  let place: "above" | "below" | "left" | "right";
  if (px < 12) place = "right";
  else if (px > 88) place = "left";
  else if (leftNeighbor !== null && rightNeighbor !== null && leftNeighbor <= value && rightNeighbor <= value)
    place = "above";
  else if (leftNeighbor !== null && rightNeighbor !== null && leftNeighbor >= value && rightNeighbor >= value)
    place = "below";
  else if (leftNeighbor !== null && (rightNeighbor === null || leftNeighbor <= rightNeighbor)) place = "right";
  else place = "left";
  if (place === "above" && py < 14) place = "below";
  if (place === "below" && py > 86) place = "above";

  const label = shown === n - 1 ? "Hôm nay" : dayShort(daily[shown].day);
  const summary = `${title} ${n} ngày, cao nhất ${formatMetric(Math.max(...values), metric)}${unit ? ` ${unit}` : ""}`;

  return (
    <>
      <div className="mt-6 flex gap-3">
        <div className="flex h-56 w-12 shrink-0 flex-col justify-between text-right text-xs text-muted tabular-nums">
          {[...ticks].reverse().map((tick) => (
            <p key={tick}>{metric === "cost" ? formatCompact(tick) : formatMetric(tick, metric)}</p>
          ))}
        </div>
        <div
          tabIndex={0}
          role="img"
          aria-label={summary}
          className="relative h-56 min-w-0 flex-1 outline-hidden"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const idx = Math.round(((event.clientX - rect.left) / rect.width) * (n - 1));
            setActive(Math.min(n - 1, Math.max(0, idx)));
          }}
          onMouseLeave={() => setActive(null)}
          onFocus={() => setActive(n - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              const base = active ?? n - 1;
              setActive(Math.min(n - 1, Math.max(0, base + (event.key === "ArrowLeft" ? -1 : 1))));
            } else if (event.key === "Home") {
              event.preventDefault();
              setActive(0);
            } else if (event.key === "End") {
              event.preventDefault();
              setActive(n - 1);
            }
          }}
        >
          {ticks.map((tick) => (
            <div
              key={tick}
              aria-hidden
              className="absolute inset-x-0 border-t border-border"
              style={{ top: `${y(tick)}%` }}
            />
          ))}
          <svg
            aria-hidden
            className="absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              points={mainPoints}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={x(n - 2)}
              y1={y(values[n - 2])}
              x2={x(n - 1)}
              y2={y(values[n - 1])}
              stroke="var(--primary)"
              strokeWidth={2}
              strokeDasharray="5 4"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div
            aria-hidden
            className="absolute flex h-0 w-0 items-center justify-center"
            style={{ left: `${px}%`, top: `${py}%` }}
          >
            <span className="size-2.5 rounded-full bg-primary" />
          </div>
          <div
            aria-hidden
            className="absolute flex h-0 w-0 items-center justify-center"
            style={{ left: `${px}%`, top: `${py}%` }}
          >
            <span
              className={cn(
                "absolute mx-auto w-fit rounded-md bg-surface px-1 text-xs font-semibold whitespace-nowrap tabular-nums",
                place === "above" && "right-0 bottom-2.5 left-0",
                place === "below" && "right-0 top-2.5 left-0",
                place === "right" && "top-0 bottom-0 left-2.5 my-auto h-fit",
                place === "left" && "top-0 right-2.5 bottom-0 my-auto h-fit",
              )}
            >
              <span className="font-normal text-muted">{label} · </span>
              {formatMetric(value, metric)}
              {unit ? <span className="font-normal text-muted"> {unit}</span> : null}
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="w-12 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <AxisLabels daily={daily} step={step} mobileStep={mobileStep} />
        </div>
      </div>
    </>
  );
}

export function UsageReport({
  days,
  daily,
  totals,
  prevTotals,
  prevLabel,
  byModel,
  modelNames,
}: {
  days: number;
  daily: UsageRow[];
  totals: UsageTotals;
  prevTotals: UsageTotals;
  prevLabel: string;
  byModel: ModelUsageRow[];
  modelNames: Record<string, string>;
}) {
  const [metric, setMetric] = useState<Metric>("requests");
  const config = METRICS.find((item) => item.value === metric) ?? METRICS[0];
  const hasData = totals.requests > 0;
  const hasPrev = prevTotals.requests > 0;
  const topDays = [...daily].sort((a, b) => b.requests - a.requests).filter((row) => row.requests > 0).slice(0, 5);
  const today = daily[daily.length - 1]?.day;

  if (!hasData) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <p className="text-sm text-muted">
          Chưa có lượt gọi nào trong {days} ngày qua. Mở app và giao việc đầu tiên để thấy số liệu ở
          đây.
        </p>
        <ButtonLink href="/docs#bat-dau" variant="outline" size="sm" className="mt-3">
          Xem hướng dẫn
        </ButtonLink>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">{prevLabel}</p>

      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
        {[
          { label: "Lượt gọi", value: formatNumber(totals.requests), current: totals.requests, prev: prevTotals.requests, kind: "neutral" as const },
          { label: "Token vào", value: formatNumber(totals.tokensIn), current: totals.tokensIn, prev: prevTotals.tokensIn, kind: "neutral" as const },
          { label: "Token ra", value: formatNumber(totals.tokensOut), current: totals.tokensOut, prev: prevTotals.tokensOut, kind: "neutral" as const },
          { label: "Chi phí", value: formatVnd(totals.cost), current: totals.cost, prev: prevTotals.cost, kind: "cost" as const },
        ].map((cell) => (
          <div key={cell.label} className="min-w-0 bg-surface p-4 sm:p-5">
            <p className="text-xs font-medium text-muted">{cell.label}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
              {cell.value}
            </p>
            {hasPrev ? <Delta current={cell.current} prev={cell.prev} kind={cell.kind} /> : null}
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-medium">{config.label} theo ngày</h2>
            <p className="mt-0.5 text-xs text-muted">
              {days} ngày gần nhất, tất cả model
              {metric === "tokens" ? " (vào + ra)" : metric === "cost" ? " (₫)" : ""}
            </p>
          </div>
          <div
            role="group"
            aria-label="Chỉ số biểu đồ"
            className="inline-flex w-fit max-w-full gap-1 rounded-xl bg-foreground/5 p-1 shadow-segment-track"
          >
            {METRICS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={metric === item.value}
                onClick={() => setMetric(item.value)}
                className={cn(
                  "h-8 cursor-pointer rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow] duration-150",
                  metric === item.value
                    ? "bg-surface text-foreground shadow-segment-thumb"
                    : "text-foreground/60 hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {Math.max(...daily.map((row) => metricValue(row, metric))) === 0 ? (
          <div className="mt-6 flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/60 text-center">
            <p className="text-sm text-muted">Chưa có {config.label.toLowerCase()} nào trong khoảng này.</p>
          </div>
        ) : days <= 12 ? (
          <BarChart daily={daily} metric={metric} />
        ) : (
          <LineChart daily={daily} metric={metric} unit={config.unit} title={config.label} />
        )}
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-medium">Theo model</h2>
            <Link
              href="/dashboard/models"
              className="inline-flex h-8 items-center text-xs text-muted transition-colors hover:text-foreground hover:underline"
            >
              Xem danh mục
            </Link>
          </div>
          {byModel.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Chưa có lượt gọi theo model trong khoảng này.</p>
          ) : (
            <ul className="mt-4">
              {byModel.map((row) => {
                const pct = totals.requests > 0 ? (row.requests / totals.requests) * 100 : 0;
                const name = modelNames[row.model_slug] ?? row.model_slug;
                return (
                  <li key={row.model_slug} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium" title={name}>
                        {name}
                      </p>
                      <p className="shrink-0 text-sm font-medium tabular-nums">
                        {pct.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%
                      </p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-foreground/5">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted tabular-nums">
                      {formatNumber(row.requests)} lượt · {formatTokens(row.tokens_in + row.tokens_out)} token · {formatVnd(row.cost_vnd)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="text-base font-medium">Ngày dùng nhiều nhất</h2>
          {topDays.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Chưa có ngày nào phát sinh lượt gọi.</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {topDays.map((row) => (
                <li key={row.day} className="flex items-baseline justify-between gap-3 py-2.5">
                  <p className="text-sm font-medium">
                    {row.day === today ? "Hôm nay" : dayShort(row.day)}
                  </p>
                  <p className="text-sm text-muted tabular-nums">
                    {formatNumber(row.requests)} lượt · {formatVnd(row.cost_vnd)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}