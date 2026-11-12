import { one, run, transaction } from "./db";
import { usageCostVnd, walletBalance, applyLedger } from "./wallet";

/**
 * Hạn mức token mỗi tháng theo gói. Con số này là nguồn duy nhất cho cả trang
 * bảng giá lẫn cổng model, để hai nơi không hứa khác nhau.
 */
export const MONTHLY_TOKEN_QUOTA: Record<string, number> = {
  free: 500_000,
  pro: 20_000_000,
  team: 100_000_000,
};

/** Nhãn gói dùng trong thông báo lỗi trả về cho harness. */
const PLAN_LABELS: Record<string, string> = {
  free: "Miễn phí",
  pro: "Pro",
  team: "Đội nhóm",
};

function dayStamp(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function monthStamp(now = new Date()): string {
  return now.toISOString().slice(0, 7);
}

/**
 * Tổng token đã dùng trong tháng hiện tại, cộng cả chiều vào và chiều ra.
 *
 * @param userId Chủ khoá API đang gọi.
 * @returns Số token đã dùng trong tháng, 0 khi chưa có lượt nào.
 */
export function monthlyTokens(userId: string): number {
  const row = one<{ n: number }>(
    `SELECT COALESCE(SUM(tokens_in + tokens_out), 0) AS n
       FROM usage_daily WHERE user_id = ? AND day LIKE ?`,
    userId,
    `${monthStamp()}-%`,
  );
  return row?.n ?? 0;
}

export type UsageDelta = { requests?: number; tokensIn?: number; tokensOut?: number };

export type UsageCharge = { costVnd: number; balanceVnd: number };

/**
 * Cộng dồn lượt gọi, token và tiền phải trả vào thống kê ngày, thống kê theo
 * model rồi trừ ví trong cùng một giao dịch.
 *
 * @param userId Chủ khoá API.
 * @param route Model đang gọi, cần slug và giá niêm yết để tính tiền.
 * @param delta Số lượt và số token cần cộng thêm.
 * @returns Tiền đã trừ của lượt này và số dư còn lại.
 */
export function recordUsage(
  userId: string,
  route: { slug: string; inputPrice: number; outputPrice: number },
  delta: UsageDelta,
): UsageCharge {
  const requests = Math.max(0, Math.round(delta.requests ?? 0));
  const tokensIn = Math.max(0, Math.round(delta.tokensIn ?? 0));
  const tokensOut = Math.max(0, Math.round(delta.tokensOut ?? 0));
  if (requests === 0 && tokensIn === 0 && tokensOut === 0) {
    return { costVnd: 0, balanceVnd: walletBalance(userId) };
  }

  const day = dayStamp();
  const costVnd = usageCostVnd(route.inputPrice, route.outputPrice, tokensIn, tokensOut);

  return transaction(() => {
    run(
      `INSERT INTO usage_daily (user_id, day, requests, tokens_in, tokens_out, cost_vnd)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, day) DO UPDATE SET
         requests = requests + excluded.requests,
         tokens_in = tokens_in + excluded.tokens_in,
         tokens_out = tokens_out + excluded.tokens_out,
         cost_vnd = cost_vnd + excluded.cost_vnd`,
      userId,
      day,
      requests,
      tokensIn,
      tokensOut,
      costVnd,
    );
    run(
      `INSERT INTO usage_model_daily (user_id, day, model_slug, requests, tokens_in, tokens_out, cost_vnd)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, day, model_slug) DO UPDATE SET
         requests = requests + excluded.requests,
         tokens_in = tokens_in + excluded.tokens_in,
         tokens_out = tokens_out + excluded.tokens_out,
         cost_vnd = cost_vnd + excluded.cost_vnd`,
      userId,
      day,
      route.slug,
      requests,
      tokensIn,
      tokensOut,
      costVnd,
    );
    const balanceVnd =
      costVnd > 0
        ? applyLedger(userId, "usage", -costVnd, route.slug, `${tokensIn} vào / ${tokensOut} ra`)
        : walletBalance(userId);
    return { costVnd, balanceVnd };
  });
}

/** Đích chuyển tiếp một lời gọi model: API nguồn và mã model bên nguồn. */
export type GatewayRoute = {
  baseUrl: string;
  apiKey: string;
  upstreamId: string;
  provider: string;
  /** Slug trong danh mục, dùng làm khoá thống kê và sổ ví. */
  slug: string;
  /** Giá niêm yết USD mỗi triệu token vào/ra, dùng để tính tiền phải trả. */
  inputPrice: number;
  outputPrice: number;
  /** Model giá 0: không cần số dư, không trừ ví. */
  free: boolean;
};

/** Lý do không chuyển tiếp được, kèm mã HTTP mà harness sẽ thấy. */
export type GatewayFailure = { status: number; code: string; message: string };

/**
 * Ghép slug model của site với nguồn đứng sau nó. Harness gửi slug, nguồn cần mã
 * model riêng, nên cổng model là nơi duy nhất biết cả hai.
 *
 * @param slug Slug model harness gửi trong `model`.
 * @returns Đích chuyển tiếp, hoặc lỗi nêu rõ vì sao model không dùng được.
 */
export function resolveGatewayRoute(slug: string): GatewayRoute | GatewayFailure {
  const row = one<{
    status: string;
    external_id: string | null;
    input_price: number;
    output_price: number;
    provider_name: string | null;
    provider_base_url: string | null;
    provider_api_key: string | null;
    provider_enabled: number | null;
  }>(
    `SELECT m.status, m.external_id, m.input_price, m.output_price, p.name AS provider_name,
            p.base_url AS provider_base_url, p.api_key AS provider_api_key, p.enabled AS provider_enabled
       FROM models m
       LEFT JOIN providers p ON p.id = m.provider_id
      WHERE m.slug = ?`,
    slug,
  );

  if (!row) {
    return { status: 404, code: "model_not_found", message: `Danh mục không có model "${slug}".` };
  }
  if (row.status === "retired") {
    return { status: 410, code: "model_retired", message: `Model "${slug}" đã ngừng phát hành.` };
  }
  if (!row.provider_name || !row.provider_base_url) {
    return {
      status: 503,
      code: "model_without_source",
      message: `Model "${slug}" chưa gắn nguồn model nên chưa gọi được.`,
    };
  }
  if (row.provider_enabled === 0) {
    return {
      status: 503,
      code: "source_disabled",
      message: `Nguồn ${row.provider_name} đang tắt. Bật lại trong trang quản trị.`,
    };
  }
  return {
    baseUrl: row.provider_base_url.replace(/\/+$/, ""),
    apiKey: row.provider_api_key ?? "",
    upstreamId: row.external_id ?? slug,
    provider: row.provider_name,
    slug,
    inputPrice: row.input_price,
    outputPrice: row.output_price,
    free: row.input_price <= 0 && row.output_price <= 0,
  };
}

/**
 * Câu lỗi khi chạm hạn mức tháng, nêu gói hiện tại và con số đã dùng để người
 * dùng biết phải nâng gói hay chờ sang tháng sau.
 *
 * @param plan Gói của tài khoản đang gọi.
 * @param used Số token đã dùng trong tháng.
 * @returns Thông báo tiếng Việt cho header lỗi của harness.
 */
export function quotaMessage(plan: string, used: number): string {
  const label = PLAN_LABELS[plan] ?? PLAN_LABELS.free;
  const quota = MONTHLY_TOKEN_QUOTA[plan] ?? MONTHLY_TOKEN_QUOTA.free;
  return `Gói ${label} đã dùng ${used.toLocaleString("vi-VN")}/${quota.toLocaleString("vi-VN")} token trong tháng. Nâng gói hoặc chờ sang tháng sau.`;
}

/**
 * Tách số token đã dùng khỏi `usage` của phản hồi OpenAI, chấp nhận cả tên
 * trường kiểu cũ (`prompt_tokens`) lẫn kiểu mới (`input_tokens`).
 *
 * @param usage Giá trị `usage` trong phản hồi nguồn.
 * @returns Số token vào và ra, 0 khi nguồn không báo.
 */
export function splitUsage(usage: unknown): { tokensIn: number; tokensOut: number } {
  if (!usage || typeof usage !== "object") return { tokensIn: 0, tokensOut: 0 };
  const record = usage as Record<string, unknown>;
  const pick = (...keys: string[]): number => {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "number" && Number.isFinite(value)) return value;
    }
    return 0;
  };
  return {
    tokensIn: pick("prompt_tokens", "input_tokens"),
    tokensOut: pick("completion_tokens", "output_tokens"),
  };
}
