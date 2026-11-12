"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export type SwitcherModel = {
  slug: string;
  name: string;
  context: string;
  price: string;
  speed: string;
};

export function ModelSwitcher({ models }: { models: SwitcherModel[] }) {
  const [active, setActive] = useState(0);
  const model = models[active] ?? models[0];
  if (!model) return null;

  return (
    <div className="mt-4 rounded-xl border border-border bg-background/70 p-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Chọn model xem thử">
        {models.map((item, index) => (
          <button
            key={item.slug}
            type="button"
            aria-pressed={index === active}
            onClick={() => setActive(index)}
            className={cn(
              "h-8 cursor-pointer rounded-full px-3 text-xs font-medium transition-colors",
              index === active
                ? "bg-primary text-primary-foreground"
                : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10 hover:text-foreground",
            )}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div key={model.slug} className="fj-rise mt-3 grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-surface">
        {[
          { label: "Ngữ cảnh", value: model.context },
          { label: "Vào / ra mỗi 1M", value: model.price },
          { label: "Tốc độ", value: model.speed },
        ].map((cell) => (
          <div key={cell.label} className="min-w-0 px-3 py-2.5">
            <p className="text-[10.5px] text-muted">{cell.label}</p>
            <p className="mt-0.5 truncate font-mono text-xs font-medium" title={cell.value}>
              {cell.value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Đổi model giữa phiên không mất ngữ cảnh — giá cập nhật ngay khi chọn.
      </p>
    </div>
  );
}