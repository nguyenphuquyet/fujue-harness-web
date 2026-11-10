import { all, deleteSetting, getSetting, one, setSetting } from "./db";

export type ModelRow = {
  id: string;
  slug: string;
  name: string;
  family: string;
  vendor: string;
  context_window: number;
  max_output: number;
  input_price: number;
  output_price: number;
  speed: string;
  status: string;
  description: string;
  featured: number;
  released_at: number;
  /** Nguồn nhập model, null khi model được tạo tay trong trang quản trị. */
  provider_id: string | null;
  /** Mã model bên API nguồn, dùng để ghép cặp khi đồng bộ lại. */
  external_id: string | null;
  synced_at: number | null;
};

export const SPEED_LABELS: Record<string, string> = {
  fast: "Nhanh",
  balanced: "Cân bằng",
  deep: "Suy luận sâu",
};

export const STATUS_LABELS: Record<string, string> = {
  stable: "Ổn định",
  beta: "Beta",
  preview: "Xem trước",
  retired: "Ngừng phát hành",
};

export function listModels(): ModelRow[] {
  return all<ModelRow>("SELECT * FROM models ORDER BY featured DESC, name ASC");
}

/** Khoá cấu hình cho model mặc định mà harness nhận khi khởi động. */
const DEFAULT_MODEL_KEY = "default_model_slug";

export type ModelSource = {
  /** Tên nguồn model, ví dụ OpenRouter. */
  provider: string;
  /** Base URL của API nguồn, harness dùng để gọi thẳng model. */
  base_url: string;
  /** Mã model bên nguồn; null khi model do quản trị viên gắn tay vào nguồn. */
  upstream_id: string | null;
};

export type PublicModel = {
  /** Slug dùng làm `model` trong mọi lời gọi tới harness. */
  id: string;
  object: "model";
  owned_by: string;
  context_window: number;
  max_output_tokens: number;
  pricing: { input_per_million_usd: number; output_per_million_usd: number };
  status: string;
  /** Model mặc định mà harness dùng khi cấu hình không chỉ định model khác. */
  default: boolean;
  /** Nguồn model, null khi model chưa được gắn nguồn. */
  source: ModelSource | null;
};

/**
 * Danh mục model kèm nguồn, dùng chung cho API công khai và cấu hình harness để
 * hai nơi không lệch nhau về model nào đang phát hành.
 *
 * @returns Danh sách model, model nổi bật trước, kèm cờ model mặc định.
 */
export function listPublicModels(): PublicModel[] {
  const defaultSlug = getDefaultModelSlug();
  return all<ModelRow & { provider_name: string | null; provider_base_url: string | null }>(
    `SELECT m.*, p.name AS provider_name, p.base_url AS provider_base_url
       FROM models m
       LEFT JOIN providers p ON p.id = m.provider_id
      ORDER BY m.featured DESC, m.name ASC`,
  ).map((model) => ({
    id: model.slug,
    object: "model" as const,
    owned_by: model.vendor,
    context_window: model.context_window,
    max_output_tokens: model.max_output,
    pricing: {
      input_per_million_usd: model.input_price,
      output_per_million_usd: model.output_price,
    },
    status: model.status,
    default: model.slug === defaultSlug,
    source:
      model.provider_id && model.provider_name && model.provider_base_url
        ? {
            provider: model.provider_name,
            base_url: model.provider_base_url,
            upstream_id: model.external_id,
          }
        : null,
  }));
}

/**
 * Slug model mặc định. Khi quản trị viên chưa chọn, lấy model nổi bật đầu tiên
 * rồi tới model đầu danh mục để harness luôn có model khởi động.
 *
 * @returns Slug model mặc định, null khi danh mục rỗng.
 */
export function getDefaultModelSlug(): string | null {
  const configured = getSetting(DEFAULT_MODEL_KEY);
  const exists = configured
    ? one<{ slug: string }>("SELECT slug FROM models WHERE slug = ?", configured)
    : undefined;
  if (exists) return exists.slug;
  const fallback = one<{ slug: string }>(
    "SELECT slug FROM models ORDER BY featured DESC, name ASC LIMIT 1",
  );
  return fallback?.slug ?? null;
}

/** Đặt model mặc định; gọi với `null` để bỏ chọn và quay về model nổi bật đầu tiên. */
export function setDefaultModelSlug(slug: string | null): void {
  if (slug === null) deleteSetting(DEFAULT_MODEL_KEY);
  else setSetting(DEFAULT_MODEL_KEY, slug);
}

/** Bỏ cấu hình mặc định khi chính model đó bị xoá khỏi danh mục. */
export function clearDefaultModelIf(slug: string): void {
  if (getSetting(DEFAULT_MODEL_KEY) === slug) deleteSetting(DEFAULT_MODEL_KEY);
}

/** Bỏ cấu hình mặc định nếu model đã chọn không còn trong danh mục (ví dụ sau khi đồng bộ). */
export function pruneDefaultModel(): void {
  const slug = getSetting(DEFAULT_MODEL_KEY);
  if (slug && !one<{ slug: string }>("SELECT slug FROM models WHERE slug = ?", slug)) {
    deleteSetting(DEFAULT_MODEL_KEY);
  }
}

export function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return String(value);
}

/**
 * Giá trên 1 triệu token. Model nhập từ nguồn ngoài có thể không kèm giá, khi đó
 * giá trị 0 nghĩa là "chưa niêm yết" chứ không phải miễn phí.
 */
export function formatPricePerMillion(value: number): string {
  if (value === 0) return "—";
  if (value < 0.1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(2)}`;
}

export function formatVnd(value: number): string {
  return `${value.toLocaleString("vi-VN")} ₫`;
}
