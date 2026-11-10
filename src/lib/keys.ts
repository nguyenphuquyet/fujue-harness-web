import { createHash, randomBytes } from "node:crypto";
import { all, newId, now, one, run } from "./db";

export type ApiKeyRow = {
  id: string;
  user_id: string;
  name: string;
  prefix: string;
  key_hash: string;
  created_at: number;
  last_used_at: number | null;
  revoked_at: number | null;
  requests: number;
};

export const KEY_LIMITS: Record<string, number> = {
  free: 2,
  pro: 10,
  team: 50,
};

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function listKeys(userId: string): ApiKeyRow[] {
  return all<ApiKeyRow>(
    "SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC",
    userId,
  );
}

export function activeKeyCount(userId: string): number {
  const row = one<{ n: number }>(
    "SELECT COUNT(*) AS n FROM api_keys WHERE user_id = ? AND revoked_at IS NULL",
    userId,
  );
  return row?.n ?? 0;
}

export type CreatedKey = { id: string; name: string; prefix: string; key: string; created_at: number };

/**
 * Tạo khoá mới. Chuỗi khoá đầy đủ chỉ trả về đúng một lần ở đây; cơ sở dữ liệu
 * chỉ giữ bản băm SHA-256 nên không xem lại được.
 */
export function createKey(userId: string, name: string): CreatedKey | { error: string; status: number } {
  const clean = name.trim();
  if (clean.length < 2) return { error: "Tên khoá cần ít nhất 2 ký tự.", status: 422 };
  if (clean.length > 60) return { error: "Tên khoá dài quá 60 ký tự.", status: 422 };

  const user = one<{ plan: string }>("SELECT plan FROM users WHERE id = ?", userId);
  const limit = KEY_LIMITS[user?.plan ?? "free"] ?? 2;
  if (activeKeyCount(userId) >= limit)
    return {
      error: `Gói hiện tại cho phép ${limit} khoá đang hoạt động. Thu hồi bớt hoặc nâng gói.`,
      status: 409,
    };

  const secret = randomBytes(24).toString("base64url");
  const key = `fj_live_${secret}`;
  const prefix = key.slice(0, 14);
  const id = newId("key");
  const createdAt = now();
  run(
    `INSERT INTO api_keys (id, user_id, name, prefix, key_hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    userId,
    clean,
    prefix,
    hashKey(key),
    createdAt,
  );
  return { id, name: clean, prefix, key, created_at: createdAt };
}

export function revokeKey(userId: string, keyId: string, isAdmin: boolean): boolean {
  const result = isAdmin
    ? run(
        "UPDATE api_keys SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL",
        now(),
        keyId,
      )
    : run(
        "UPDATE api_keys SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL",
        now(),
        keyId,
        userId,
      );
  return result.changes > 0;
}

export type KeyOwner = {
  keyId: string;
  userId: string;
  email: string;
  name: string;
  plan: string;
};

/**
 * Xác thực khoá API dạng `fj_live_…` ở header Authorization. Ghi nhận lần dùng
 * để trang quản trị thấy khoá nào còn sống.
 *
 * @param raw Chuỗi khoá nhận từ header, chưa bóc tiền tố Bearer.
 * @returns Chủ khoá còn hiệu lực, hoặc null khi khoá sai, đã thu hồi hoặc tài khoản bị tạm ngưng.
 */
export function authenticateKey(raw: string): KeyOwner | null {
  const key = raw.trim();
  if (!key.startsWith("fj_live_")) return null;

  const row = one<{
    id: string;
    user_id: string;
    email: string;
    name: string;
    plan: string;
    revoked_at: number | null;
    status: string;
  }>(
    `SELECT k.id, k.user_id, k.revoked_at, u.email, u.name, u.plan, u.status
       FROM api_keys k
       JOIN users u ON u.id = k.user_id
      WHERE k.key_hash = ?`,
    hashKey(key),
  );
  if (!row || row.revoked_at !== null || row.status !== "active") return null;

  run("UPDATE api_keys SET last_used_at = ?, requests = requests + 1 WHERE id = ?", now(), row.id);
  return {
    keyId: row.id,
    userId: row.user_id,
    email: row.email,
    name: row.name,
    plan: row.plan,
  };
}
