import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Gauge, Layers3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  listModels,
  formatTokens,
  formatPricePerMillion,
  STATUS_LABELS,
  SPEED_LABELS,
} from "@/lib/models";

export const metadata: Metadata = {
  title: "Danh mục model",
  description: "Toàn bộ model FuJue Harness hỗ trợ: ngữ cảnh, giá, tốc độ và trạng thái.",
};

export default function ModelsPage() {
  const models = listModels();
  const vendors = Array.from(new Set(models.map((m) => m.vendor)));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <nav className="flex items-center gap-1.5 text-xs text-muted" aria-label="Đường dẫn">
        <Link href="/" className="hover:text-foreground">
          Trang chủ
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">Model</span>
      </nav>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Danh mục model</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Giá tính theo 1 triệu token, quy đổi USD. Ngữ cảnh là tổng token vào và ra cho một lượt
            gọi. Đổi model giữa phiên không mất ngữ cảnh.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {vendors.map((vendor) => (
            <span
              key={vendor}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted"
            >
              {vendor}
            </span>
          ))}
        </div>
      </header>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left">
          <thead className="bg-surface text-xs text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">Ngữ cảnh</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Ra tối đa</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Vào / ra ($/1M)</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Tốc độ</th>
              <th className="px-5 py-3 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {models.map((model) => (
              <tr key={model.slug} className="transition-colors hover:bg-surface-hover">
                <td className="px-5 py-4">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {model.name}
                    {model.featured === 1 ? <Badge tone="brand">Nổi bật</Badge> : null}
                  </p>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-muted">{model.description}</p>
                </td>
                <td className="px-4 py-4 font-mono text-sm text-muted">
                  {formatTokens(model.context_window)}
                </td>
                <td className="hidden px-4 py-4 font-mono text-sm text-muted sm:table-cell">
                  {formatTokens(model.max_output)}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-4 font-mono text-sm text-muted md:table-cell">
                  {model.input_price === 0 && model.output_price === 0
                    ? "Chưa niêm yết"
                    : `${formatPricePerMillion(model.input_price)} / ${formatPricePerMillion(model.output_price)}`}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-4 text-sm text-muted lg:table-cell">
                  <span className="inline-flex items-center gap-1.5">
                    <Gauge className="size-3.5" />
                    {SPEED_LABELS[model.speed] ?? model.speed}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <Badge tone={model.status === "stable" ? "success" : "warning"}>
                    {STATUS_LABELS[model.status] ?? model.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary-light text-primary">
            <Layers3 className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">Cần model riêng hoặc chạy trong mạng nội bộ?</p>
            <p className="mt-1 text-xs text-muted">
              GPT-OSS và các model trọng số mở chạy được trên hạ tầng của bạn, vẫn qua cùng một API.
            </p>
          </div>
        </div>
        <ButtonLink href="/docs#api" variant="outline" size="sm">
          Xem cách cấu hình
        </ButtonLink>
      </div>
    </div>
  );
}
