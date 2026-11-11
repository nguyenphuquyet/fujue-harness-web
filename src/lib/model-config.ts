/**
 * Kiểu đầu vào và mức suy luận của model, tách khỏi `models.ts` để component phía
 * client dùng được mà không kéo theo `node:sqlite`.
 */

/** Một kiểu đầu vào model nhận; trùng tên với `input` của pi-ai trong harness. */
export type InputModality = "text" | "image";

/** Các kiểu đầu vào hợp lệ, theo thứ tự hiển thị. */
export const INPUT_MODALITIES: readonly InputModality[] = ["text", "image"];

/** Bảng mức suy luận: khoá là mức harness hiển thị, giá trị là chuỗi gửi lên API. */
export type ReasoningEfforts = Record<string, string | null>;

/**
 * Mức suy luận mặc định khi bật suy luận cho một model: bốn mức quen thuộc, mỗi
 * mức gửi đúng tên của nó, riêng `off` không gửi giá trị nào.
 */
export const DEFAULT_REASONING_EFFORTS: ReasoningEfforts = {
  off: null,
  low: "low",
  medium: "medium",
  high: "high",
};

/** Mức suy luận hợp lệ, dùng để kiểm tra dữ liệu quản trị gửi lên. */
export const REASONING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;

/** Một mức suy luận hợp lệ. */
export type ReasoningLevel = (typeof REASONING_LEVELS)[number];

/** Kiểu đầu vào mặc định của một model chưa khai báo gì. */
const DEFAULT_INPUT_TYPES: InputModality[] = ["text"];

function isModality(value: unknown): value is InputModality {
  return typeof value === "string" && (INPUT_MODALITIES as readonly string[]).includes(value);
}

/**
 * Chuẩn hoá danh sách kiểu đầu vào: bỏ giá trị lạ, bỏ trùng, giữ thứ tự khai
 * báo, và luôn còn ít nhất `text` vì model không nhận gì thì không phục vụ được.
 *
 * @param value Mảng kiểu đầu vào từ body quản trị hoặc từ DB.
 * @returns Danh sách kiểu đầu vào dùng được.
 */
export function normalizeInputTypes(value: unknown): InputModality[] {
  const list = Array.isArray(value) ? value.filter(isModality) : [];
  const unique = [...new Set(list)];
  return unique.length > 0 ? unique : [...DEFAULT_INPUT_TYPES];
}

/**
 * Đọc cột `input_types` của DB.
 *
 * @param raw Giá trị JSON đã lưu.
 * @returns Danh sách kiểu đầu vào, mặc định `["text"]` khi cột trống hoặc hỏng.
 */
export function parseInputTypes(raw: string | null): InputModality[] {
  if (!raw) return [...DEFAULT_INPUT_TYPES];
  try {
    return normalizeInputTypes(JSON.parse(raw));
  } catch {
    return [...DEFAULT_INPUT_TYPES];
  }
}

/**
 * Chuẩn hoá bảng mức suy luận trước khi lưu: chỉ giữ khoá là mức hợp lệ, giá trị
 * là chuỗi không rỗng hoặc null; `false`/rỗng nghĩa là model không suy luận.
 *
 * @param value Object mức suy luận từ body quản trị, hoặc `null`/`false`.
 * @returns Bảng mức suy luận, hoặc null khi model không khai báo suy luận.
 */
export function normalizeReasoningEfforts(value: unknown): ReasoningEfforts | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value as Record<string, unknown>).filter(
    (entry): entry is [string, string | null] => {
      const [level, wire] = entry;
      if (!(REASONING_LEVELS as readonly string[]).includes(level)) return false;
      return wire === null || (typeof wire === "string" && wire.trim() !== "");
    },
  );
  if (entries.length === 0) return null;
  return Object.fromEntries(
    entries.map(([level, wire]) => [level, typeof wire === "string" ? wire.trim() : null]),
  );
}

/**
 * Đọc cột `reasoning_efforts` của DB.
 *
 * @param raw Giá trị JSON đã lưu.
 * @returns Bảng mức suy luận, hoặc null khi model không suy luận.
 */
export function parseReasoningEfforts(raw: string | null): ReasoningEfforts | null {
  if (!raw) return null;
  try {
    return normalizeReasoningEfforts(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Ghi bảng mức suy luận thành cột JSON, null khi model không suy luận. */
export function serializeReasoningEfforts(value: unknown): string | null {
  const normalized = normalizeReasoningEfforts(value);
  return normalized === null ? null : JSON.stringify(normalized);
}

/** Ghi danh sách kiểu đầu vào thành cột JSON. */
export function serializeInputTypes(value: unknown): string {
  return JSON.stringify(normalizeInputTypes(value));
}
