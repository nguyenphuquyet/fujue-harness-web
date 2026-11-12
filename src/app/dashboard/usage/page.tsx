import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { listModels } from "@/lib/models";
import { sumUsage, usageByModel, usageDailyRange } from "@/lib/usage";
import { DashboardTabs } from "@/components/app/dashboard-tabs";
import { UsageReport } from "@/components/app/usage-report";
import { cn } from "@/lib/cn";

const RANGES = [7, 14, 30, 90];

function dayLabel(offset: number): string {
  return new Date(Date.now() - offset * 86_400_000).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function UsagePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const user = await currentUser();
  if (!user) return null;

  const { days: raw } = await searchParams;
  const days = RANGES.includes(Number(raw)) ? Number(raw) : 30;

  const daily = usageDailyRange(user.id, days);
  const prevRows = usageDailyRange(user.id, days * 2).slice(0, days);
  const totals = sumUsage(daily);
  const prevTotals = sumUsage(prevRows);
  const byModel = usageByModel(user.id, days).map((row) => ({ ...row }));
  const modelNames = Object.fromEntries(listModels().map((model) => [model.slug, model.name]));
  const prevLabel =
    prevTotals.requests > 0
      ? `So với ${days} ngày liền trước, ${dayLabel(days * 2 - 1)} – ${dayLabel(days)}`
      : "Chưa có kỳ trước để so";

  return (
    <div className="space-y-5">
      <DashboardTabs />

      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-balance">Mức sử dụng</h1>
          <p className="mt-1 max-w-[55ch] text-sm text-pretty text-muted">
            Lượt gọi, token và chi phí theo ngày và theo model trong khoảng đang chọn.
          </p>
        </div>
        <div className="scrollbar-clean max-w-full overflow-x-auto">
          <div
            role="group"
            aria-label="Khoảng ngày"
            className="inline-flex w-max gap-1 rounded-xl bg-foreground/5 p-1 shadow-segment-track"
          >
            {RANGES.map((range) => (
              <Link
                key={range}
                href={`/dashboard/usage?days=${range}`}
                aria-current={range === days ? "true" : undefined}
                className={cn(
                  "h-8 shrink-0 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow] duration-150",
                  range === days
                    ? "bg-surface text-foreground shadow-segment-thumb"
                    : "text-foreground/60 hover:text-foreground",
                )}
              >
                {range} ngày
              </Link>
            ))}
          </div>
        </div>
      </div>

      <UsageReport
        days={days}
        daily={daily}
        totals={totals}
        prevTotals={prevTotals}
        prevLabel={prevLabel}
        byModel={byModel}
        modelNames={modelNames}
      />
    </div>
  );
}