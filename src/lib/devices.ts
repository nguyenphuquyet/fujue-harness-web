import { createHash, randomBytes } from "node:crypto";
import { newId, now, one, run } from "./db";
import { createKey } from "./keys";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TTL_MS = 10 * 60 * 1000;

function hashDevice(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function normalizeUserCode(input: string): string {
  return input.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function randomUserCode(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

export type DeviceStart = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
};

/**
 * Bắt đầu luồng đăng nhập thiết bị: app nhận mã bí mật (device_code) và mã
 * người dùng đọc lên web. Mã sống 10 phút.
 */
export function startDevice(label: string | null): DeviceStart {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const userCode = randomUserCode();
    if (one<{ id: string }>("SELECT id FROM devices WHERE user_code = ?", userCode)) continue;

    const deviceCode = randomBytes(32).toString("base64url");
    run(
      `INSERT INTO devices (id, device_code_hash, user_code, status, label, created_at, expires_at)
       VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
      newId("dev"),
      hashDevice(deviceCode),
      userCode,
      label,
      now(),
      now() + TTL_MS,
    );
    return {
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: "/device",
      expires_in: Math.floor(TTL_MS / 1000),
      interval: 3,
    };
  }
  throw new Error("Không sinh được mã thiết bị không trùng.");
}

export function approveDevice(userCodeInput: string, userId: string): { ok: true } | { ok: false; message: string } {
  const userCode = normalizeUserCode(userCodeInput);
  const formatted = `${userCode.slice(0, 4)}-${userCode.slice(4)}`;
  const row = one<{ id: string; status: string; expires_at: number }>(
    "SELECT id, status, expires_at FROM devices WHERE user_code = ?",
    formatted,
  );
  if (!row) return { ok: false, message: "Mã không đúng hoặc đã hết hạn." };
  if (row.expires_at < now()) return { ok: false, message: "Mã đã hết hạn. Lấy mã mới trong app." };
  if (row.status === "approved") return { ok: false, message: "Mã này đã được duyệt rồi." };
  if (row.status !== "pending") return { ok: false, message: "Mã không còn dùng được." };

  run("UPDATE devices SET status = 'approved', user_id = ?, approved_at = ? WHERE id = ?", userId, now(), row.id);
  return { ok: true };
}

export type DeviceTokenResult =
  | { ok: true; api_key: string; user: { id: string; email: string; name: string } }
  | { ok: false; status: number; error: string };

/**
 * App đổi device_code lấy khoá API. Chỉ trả khoá đúng một lần, sau đó mã vô hiệu.
 */
export function exchangeDeviceToken(deviceCode: string): DeviceTokenResult {
  const row = one<{
    id: string;
    status: string;
    user_id: string | null;
    label: string | null;
    expires_at: number;
    token_issued_at: number | null;
  }>(
    "SELECT id, status, user_id, label, expires_at, token_issued_at FROM devices WHERE device_code_hash = ?",
    hashDevice(deviceCode),
  );

  if (!row) return { ok: false, status: 400, error: "device_code không hợp lệ." };
  if (row.expires_at < now()) return { ok: false, status: 400, error: "Mã thiết bị đã hết hạn." };
  if (row.token_issued_at) return { ok: false, status: 409, error: "Mã đã dùng để cấp khoá." };
  if (row.status !== "approved" || !row.user_id)
    return { ok: false, status: 428, error: "Chưa duyệt. Mở trang /device và nhập mã." };

  const user = one<{ id: string; email: string; name: string }>(
    "SELECT id, email, name FROM users WHERE id = ?",
    row.user_id,
  );
  if (!user) return { ok: false, status: 400, error: "Tài khoản không còn tồn tại." };

  const created = createKey(user.id, row.label?.trim() ? `Thiết bị · ${row.label}` : "Thiết bị");
  if ("error" in created) return { ok: false, status: created.status, error: created.error };

  run("UPDATE devices SET token_issued_at = ? WHERE id = ?", now(), row.id);
  return { ok: true, api_key: created.key, user };
}
