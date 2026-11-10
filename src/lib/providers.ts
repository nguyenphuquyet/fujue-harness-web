import { all, getDb, newId, now, one, run } from "./db";
import { pruneDefaultModel } from "./models";

/**
 * Nguồn model bên ngoài. Mỗi nguồn là một API tương thích OpenAI với
 * `GET {base_url}/models`; đồng bộ sẽ thêm, cập nhật và dọn model đã biến mất
 * khỏi danh mục công khai của site.
 */
export type ProviderRow = {
  id: string;
  name: string;
  base_url: string;
  api_key: string;
  enabled: number;
  created_at: number;
  last_synced_at: number | null;
  last_error: string | null;
  last_summary: string | null;
};

/** Bản gửi ra API: không bao giờ kèm khoá đầy đủ. */
export type ProviderView = Omit<ProviderRow, "api_key"> & {
  key_hint: string | null;
  models: number;
};

const TIMEOUT_MS = 15_000;

export function listProviders(): ProviderView[] {
  return all<ProviderRow & { models: number }>(
    `SELECT p.*, (SELECT COUNT(*) FROM models m WHERE m.provider_id = p.id) AS models
       FROM providers p
      ORDER BY p.created_at ASC`,
  ).map(toView);
}

export function getProvider(id: string): ProviderView | null {
  const row = one<ProviderRow>(
    "SELECT * FROM providers WHERE id = ?",
    id,
  );
  if (!row) return null;
  const count = one<{ n: number }>("SELECT COUNT(*) AS n FROM models WHERE provider_id = ?", id);
  return toView({ ...row, models: count?.n ?? 0 });
}

function toView(row: ProviderRow & { models: number }): ProviderView {
  const { api_key, ...rest } = row;
  return {
    ...rest,
    key_hint: api_key ? `••••${api_key.slice(-4)}` : null,
    models: row.models,
  };
}

export function normalizeBaseUrl(input: string): string | null {
  const trimmed = input.trim().replace(/\/+$/, "");
  if (!/^https?:\/\/[^\s/]+/i.test(trimmed)) return null;
  return trimmed;
}

/** URL danh sách model. Nhận cả base `https://host/v1` và URL đã có `/models`. */
export function modelsUrl(baseUrl: string): string {
  return baseUrl.endsWith("/models") ? baseUrl : `${baseUrl}/models`;
}

export type SourceBinding = { providerId: string; externalId: string | null };

/**
 * Đọc cặp nguồn/model gốc từ body quản trị. Mọi model đều phải thuộc một nguồn,
 * nên `provider_id` rỗng bị từ chối. `external_id` là mã model bên nguồn, dùng để
 * lần đồng bộ sau cập nhật đúng dòng.
 *
 * @param body Body JSON của yêu cầu tạo/sửa model.
 * @param exceptModelId Model đang sửa, để không tự báo trùng với chính nó.
 * @returns Cặp nguồn hợp lệ, hoặc lỗi kèm mã HTTP và tên trường.
 */
export function resolveSource(
  body: Record<string, unknown>,
  exceptModelId?: string,
): SourceBinding | { error: string; status: number; field: string } {
  const providerId = typeof body.provider_id === "string" ? body.provider_id.trim() : "";
  if (providerId === "") {
    return {
      error: "Model phải thuộc một nguồn model. Thêm nguồn ở khung Nguồn model trước.",
      status: 422,
      field: "provider_id",
    };
  }
  if (!one<{ id: string }>("SELECT id FROM providers WHERE id = ?", providerId)) {
    return { error: "Nguồn model không tồn tại.", status: 422, field: "provider_id" };
  }

  const externalId =
    typeof body.external_id === "string" && body.external_id.trim() !== ""
      ? body.external_id.trim()
      : null;

  if (externalId) {
    const clash = exceptModelId
      ? one<{ id: string }>(
          "SELECT id FROM models WHERE provider_id = ? AND external_id = ? AND id <> ?",
          providerId,
          externalId,
          exceptModelId,
        )
      : one<{ id: string }>(
          "SELECT id FROM models WHERE provider_id = ? AND external_id = ?",
          providerId,
          externalId,
        );
    if (clash) {
      return {
        error: "Nguồn này đã có model với mã đó. Sửa model đang có thay vì tạo bản trùng.",
        status: 409,
        field: "external_id",
      };
    }
  }

  return { providerId, externalId };
}

export type ProviderInput = { name: string; baseUrl: string; apiKey?: string };

export function createProvider(input: ProviderInput): ProviderView | { error: string; field: string } {
  const name = input.name.trim();
  const baseUrl = normalizeBaseUrl(input.baseUrl);
  if (name.length < 2) return { error: "Tên nguồn cần ít nhất 2 ký tự.", field: "name" };
  if (!baseUrl) return { error: "Base URL phải bắt đầu bằng http:// hoặc https://.", field: "base_url" };

  const id = newId("prv");
  run(
    `INSERT INTO providers (id, name, base_url, api_key, enabled, created_at)
     VALUES (?, ?, ?, ?, 1, ?)`,
    id,
    name,
    baseUrl,
    input.apiKey?.trim() ?? "",
    now(),
  );
  return getProvider(id)!;
}

export function updateProvider(
  id: string,
  input: Partial<ProviderInput> & { enabled?: boolean },
): ProviderView | { error: string; field: string } | null {
  const current = one<ProviderRow>("SELECT * FROM providers WHERE id = ?", id);
  if (!current) return null;

  const fields: string[] = [];
  const values: Array<string | number | null> = [];
  const push = (column: string, value: string | number | null) => {
    fields.push(`${column} = ?`);
    values.push(value);
  };

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 2) return { error: "Tên nguồn cần ít nhất 2 ký tự.", field: "name" };
    push("name", name);
  }
  if (input.baseUrl !== undefined) {
    const baseUrl = normalizeBaseUrl(input.baseUrl);
    if (!baseUrl) return { error: "Base URL phải bắt đầu bằng http:// hoặc https://.", field: "base_url" };
    push("base_url", baseUrl);
  }
  // Khoá rỗng nghĩa là "giữ nguyên"; muốn xoá khoá thì gửi clearKey.
  if (input.apiKey !== undefined && input.apiKey.trim() !== "") push("api_key", input.apiKey.trim());
  if (input.enabled !== undefined) push("enabled", input.enabled ? 1 : 0);

  if (fields.length === 0) return getProvider(id);
  run(`UPDATE providers SET ${fields.join(", ")} WHERE id = ?`, ...values, id);
  return getProvider(id);
}

export function clearProviderKey(id: string): void {
  run("UPDATE providers SET api_key = '' WHERE id = ?", id);
}

/** Xoá nguồn kèm các model đã nhập từ nguồn đó. */
export function deleteProvider(id: string): { removedModels: number } | null {
  const exists = one<{ id: string }>("SELECT id FROM providers WHERE id = ?", id);
  if (!exists) return null;
  const removed = run("DELETE FROM models WHERE provider_id = ?", id);
  run("DELETE FROM providers WHERE id = ?", id);
  pruneDefaultModel();
  return { removedModels: removed.changes };
}

type UpstreamModel = {
  id?: unknown;
  name?: unknown;
  owned_by?: unknown;
  created?: unknown;
  context_length?: unknown;
  max_completion_tokens?: unknown;
  description?: unknown;
  top_provider?: { context_length?: unknown };
  pricing?: { prompt?: unknown; completion?: unknown };
};

export type SyncResult = { total: number; added: number; updated: number; removed: number };

/** Đọc giá theo token của OpenRouter rồi đổi sang USD trên 1 triệu token. */
function pricePerMillion(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 1_000_000 * 1000) / 1000;
}

function positiveInt(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

/** "deepseek-ai/DeepSeek-V3" → "DeepSeek V3", dùng khi API không có tên hiển thị. */
function prettyName(id: string): string {
  const tail = id.split("/").pop() ?? id;
  return tail
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function slugify(id: string): string {
  const slug = id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "model";
}

async function fetchUpstream(provider: ProviderRow): Promise<UpstreamModel[]> {
  const url = modelsUrl(provider.base_url);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (provider.api_key) headers.Authorization = `Bearer ${provider.api_key}`;

  let response: Response;
  try {
    response = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Không gọi được ${url}: ${detail}`);
  }

  if (!response.ok) {
    const body = (await response.text().catch(() => "")).slice(0, 200).replace(/\s+/g, " ");
    throw new Error(`Nguồn trả HTTP ${response.status}${body ? ` — ${body}` : ""}`);
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)
      ? ((payload as { data: unknown[] }).data)
      : null;
  if (!list) throw new Error("Phản hồi không có mảng `data` như chuẩn OpenAI.");
  return list.filter((item): item is UpstreamModel => Boolean(item) && typeof item === "object");
}

/**
 * Kéo danh mục model từ nguồn: thêm model mới, cập nhật model đã có, xoá model
 * đã biến mất khỏi nguồn. Chạy trong một transaction để bảng không ở trạng thái
 * nửa vời khi một dòng lỗi.
 */
export async function syncProvider(id: string): Promise<SyncResult | { error: string; status: number }> {
  const provider = one<ProviderRow>("SELECT * FROM providers WHERE id = ?", id);
  if (!provider) return { error: "Không tìm thấy nguồn model.", status: 404 };

  let rows: UpstreamModel[];
  try {
    rows = await fetchUpstream(provider);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    run(
      "UPDATE providers SET last_error = ?, last_synced_at = ? WHERE id = ?",
      message.slice(0, 300),
      now(),
      id,
    );
    return { error: message, status: 502 };
  }

  const db = getDb();
  const result: SyncResult = { total: 0, added: 0, updated: 0, removed: 0 };
  const keep = new Set<string>();

  db.exec("BEGIN");
  try {
    for (const row of rows) {
      const externalId = text(row.id);
      if (!externalId) continue;
      keep.add(externalId);

      const contextWindow =
        positiveInt(row.context_length) ?? positiveInt(row.top_provider?.context_length) ?? 131_072;
      const maxOutput = positiveInt(row.max_completion_tokens) ?? 16_384;
      const inputPrice = pricePerMillion(row.pricing?.prompt) ?? 0;
      const outputPrice = pricePerMillion(row.pricing?.completion) ?? 0;
      const name = text(row.name) ?? prettyName(externalId);
      const vendor = text(row.owned_by) ?? provider.name;
      const description = text(row.description) ?? `Model nhập từ ${provider.name}.`;
      const released = positiveInt(row.created);

      const existing = one<{ id: string }>(
        "SELECT id FROM models WHERE provider_id = ? AND external_id = ?",
        id,
        externalId,
      );

      if (existing) {
        run(
          `UPDATE models SET name = ?, family = ?, vendor = ?, context_window = ?, max_output = ?,
                  input_price = ?, output_price = ?, description = ?, synced_at = ?
            WHERE id = ?`,
          name,
          vendor,
          vendor,
          contextWindow,
          maxOutput,
          inputPrice,
          outputPrice,
          description,
          now(),
          existing.id,
        );
        result.updated += 1;
      } else {
        const slug = uniqueSlug(externalId);
        run(
          `INSERT INTO models (id, slug, name, family, vendor, context_window, max_output,
             input_price, output_price, speed, status, description, featured, released_at,
             provider_id, external_id, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'balanced', 'stable', ?, 0, ?, ?, ?, ?)`,
          newId("mdl"),
          slug,
          name,
          vendor,
          vendor,
          contextWindow,
          maxOutput,
          inputPrice,
          outputPrice,
          description,
          released ? released * 1000 : now(),
          id,
          externalId,
          now(),
        );
        result.added += 1;
      }
    }

    // Chỉ gỡ model do chính lần đồng bộ trước nhập vào. Model gắn tay vào nguồn
    // không có mã bên nguồn nên không bao giờ bị coi là đã biến mất.
    const stale = all<{ id: string; external_id: string | null }>(
      "SELECT id, external_id FROM models WHERE provider_id = ?",
      id,
    ).filter((model) => model.external_id !== null && !keep.has(model.external_id));

    for (const model of stale) {
      run("DELETE FROM models WHERE id = ?", model.id);
      result.removed += 1;
    }

    result.total = keep.size;
    pruneDefaultModel();
    run(
      "UPDATE providers SET last_synced_at = ?, last_error = NULL, last_summary = ? WHERE id = ?",
      now(),
      `+${result.added} mới · ${result.updated} cập nhật · -${result.removed} xoá`,
      id,
    );
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    const message = error instanceof Error ? error.message : String(error);
    run("UPDATE providers SET last_error = ? WHERE id = ?", message.slice(0, 300), id);
    return { error: `Đồng bộ thất bại: ${message}`, status: 500 };
  }

  return result;
}

/** Slug phải duy nhất toàn bảng, kể cả khi model tạo tay đã chiếm tên đó. */
function uniqueSlug(externalId: string): string {
  const base = slugify(externalId);
  let candidate = base;
  for (let attempt = 2; attempt < 50; attempt += 1) {
    if (!one<{ id: string }>("SELECT id FROM models WHERE slug = ?", candidate)) return candidate;
    candidate = `${base}-${attempt}`.slice(0, 60);
  }
  return `${base}-${Date.now().toString(36)}`.slice(0, 60);
}
