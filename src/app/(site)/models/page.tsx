import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Layers3 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { listModels, STATUS_LABELS, SPEED_LABELS } from "@/lib/models";
import { ModelsClient, type ModelView } from "./models-client";

export const metadata: Metadata = {
  title: "Danh mục model",
  description: "Toàn bộ model FuJue Harness hỗ trợ: ngữ cảnh, giá, tốc độ và trạng thái.",
};

export default function ModelsPage() {
  const models = listModels();
  const vendors = Array.from(new Set(models.map((m) => m.vendor)));

  const views: ModelView[] = models.map((model) => ({
    slug: model.slug,
    name: model.name,
    vendor: model.vendor,
    context: model.context_window,
    maxOutput: model.max_output,
    inputPrice: model.input_price,
    outputPrice: model.output_price,
    speed: model.speed,
    speedLabel: SPEED_LABELS[model.speed] ?? model.speed,
    status: model.status,
    statusLabel: STATUS_LABELS[model.status] ?? model.status,
    description: model.description,
    featured: model.featured === 1,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <nav className="flex items-center gap-1.5 text-xs text-muted" aria-label="Đường dẫn">
        <Link href="/" className="hover:text-foreground">
          Trang chủ
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">Model</span>
      </nav>

      <header className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Danh mục model</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Giá tính theo 1 triệu token, quy đổi USD. Ngữ cảnh là tổng token vào và ra cho một lượt
            gọi. Đổi model giữa phiên không mất ngữ cảnh.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted">
          <Layers3 className="size-3.5 text-primary" />
          {models.length} model · {vendors.length} nhà cung cấp
        </div>
      </header>

      <div className="mt-6">
        <ModelsClient models={views} vendors={vendors} />
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
