import { all, one } from "./db";

export type UsageRow = {
  day: string;
  requests: number;
  tokens_in: number;
  tokens_out: number;
  cost_vnd: number;
};

export function usageLastDays(userId: string, days = 14): UsageRow[] {
  const rows = all<UsageRow>(
    `SELECT day, requests, tokens_in, tokens_out, cost_vnd
       FROM usage_daily WHERE user_id = ? ORDER BY day DESC LIMIT ?`,
    userId,
    days,
  );
  return rows.reverse();
}

export function usageTotals(userId: string): UsageRow {
  const row = one<UsageRow>(
    `SELECT COALESCE(SUM(requests), 0) AS requests,
            COALESCE(SUM(tokens_in), 0) AS tokens_in,
            COALESCE(SUM(tokens_out), 0) AS tokens_out,
            COALESCE(SUM(cost_vnd), 0) AS cost_vnd,
            '' AS day
       FROM usage_daily WHERE user_id = ?`,
    userId,
  );
  return row ?? { day: "", requests: 0, tokens_in: 0, tokens_out: 0, cost_vnd: 0 };
}

/** Chi tiêu thật của N ngày gần nhất, cộng từ số tiền đã trừ khỏi ví. */
export function usageCostLastDays(userId: string, days = 30): number {
  const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  const row = one<{ total: number }>(
    "SELECT COALESCE(SUM(cost_vnd), 0) AS total FROM usage_daily WHERE user_id = ? AND day >= ?",
    userId,
    since,
  );
  return row?.total ?? 0;
}

export type ModelUsageRow = {
  model_slug: string;
  requests: number;
  tokens_in: number;
  tokens_out: number;
  cost_vnd: number;
};

/** Số liệu theo từng model để trang Model so sánh mức dùng và chi phí. */
export function usageByModel(userId: string, days = 30): ModelUsageRow[] {
  const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  return all<ModelUsageRow>(
    `SELECT model_slug,
            COALESCE(SUM(requests), 0) AS requests,
            COALESCE(SUM(tokens_in), 0) AS tokens_in,
            COALESCE(SUM(tokens_out), 0) AS tokens_out,
            COALESCE(SUM(cost_vnd), 0) AS cost_vnd
       FROM usage_model_daily
      WHERE user_id = ? AND day >= ?
      GROUP BY model_slug
      ORDER BY requests DESC`,
    userId,
    since,
  );
}

export { formatCost, formatDateTime, formatNumber, formatRelative, formatTokens, formatVnd } from "./format";
