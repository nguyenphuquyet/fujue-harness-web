import { all, one } from "./db";

export type UsageRow = {
  day: string;
  requests: number;
  tokens_in: number;
  tokens_out: number;
};

export function usageLastDays(userId: string, days = 14): UsageRow[] {
  const rows = all<UsageRow>(
    "SELECT day, requests, tokens_in, tokens_out FROM usage_daily WHERE user_id = ? ORDER BY day DESC LIMIT ?",
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
            '' AS day
       FROM usage_daily WHERE user_id = ?`,
    userId,
  );
  return row ?? { day: "", requests: 0, tokens_in: 0, tokens_out: 0 };
}

/** Giá tham chiếu cho phần ước tính chi phí: $0,28 vào / $1,12 ra mỗi triệu token. */
export const ESTIMATE_INPUT_PRICE = 0.28;
export const ESTIMATE_OUTPUT_PRICE = 1.12;

export function estimateCost(totals: UsageRow): number {
  return (
    (totals.tokens_in / 1_000_000) * ESTIMATE_INPUT_PRICE +
    (totals.tokens_out / 1_000_000) * ESTIMATE_OUTPUT_PRICE
  );
}

export { formatCost, formatDateTime, formatNumber, formatRelative } from "./format";
