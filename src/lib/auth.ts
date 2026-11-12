import { cookies } from "next/headers";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { all, hashPassword, newId, now, one, run, verifyPassword } from "./db";
import { ApiError } from "./errors";

export const SESSION_COOKIE = "fujue_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export type Role = "user" | "admin";

export type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: Role;
  plan: string;
  status: string;
  created_at: number;
  last_login_at: number | null;
};

export type PublicUser = Omit<UserRow, "password_hash">;

export function toPublicUser(user: UserRow): PublicUser {
  const { password_hash: _ignored, ...rest } = user;
  return rest;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function findUserByEmail(email: string): UserRow | undefined {
  return one<UserRow>("SELECT * FROM users WHERE lower(email) = lower(?)", email);
}

export function findUserById(id: string): UserRow | undefined {
  return one<UserRow>("SELECT * FROM users WHERE id = ?", id);
}

export function createSession(
  userId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {},
): { token: string; expiresAt: number } {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = now() + SESSION_TTL_SECONDS * 1000;
  run(
    `INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at, user_agent, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    randomUUID(),
    userId,
    sha256(token),
    now(),
    expiresAt,
    meta.userAgent ?? null,
    meta.ip ?? null,
  );
  run("UPDATE users SET last_login_at = ? WHERE id = ?", now(), userId);
  return { token, expiresAt };
}

export function sessionCookie(token: string): {
  name: string;
  value: string;
  httpOnly: true;
  sameSite: "lax";
  path: "/";
  maxAge: number;
  secure: boolean;
} {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    secure: process.env.NODE_ENV === "production",
  };
}

export function revokedSessionCookie() {
  return { ...sessionCookie(""), maxAge: 0 };
}

export async function currentUser(): Promise<PublicUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = one<{ user_id: string; expires_at: number }>(
    "SELECT user_id, expires_at FROM sessions WHERE token_hash = ?",
    sha256(token),
  );
  if (!row) return null;
  if (row.expires_at < now()) {
    run("DELETE FROM sessions WHERE token_hash = ?", sha256(token));
    return null;
  }
  const user = findUserById(row.user_id);
  if (!user || user.status !== "active") return null;
  return toPublicUser(user);
}

export async function requireUser(): Promise<PublicUser> {
  const user = await currentUser();
  if (!user) throw new AuthError(401, "Cần đăng nhập để tiếp tục.");
  return user;
}

export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new AuthError(403, "Chỉ quản trị viên mới được thao tác.");
  return user;
}

export class AuthError extends ApiError {}

export type AuthResult =
  | { ok: true; user: PublicUser; token: string }
  | { ok: false; status: number; message: string; field?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function registerUser(input: {
  name: string;
  email: string;
  password: string;
  userAgent?: string | null;
  ip?: string | null;
}): AuthResult {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (name.length < 2) return { ok: false, status: 422, message: "Tên cần ít nhất 2 ký tự.", field: "name" };
  if (!EMAIL_RE.test(email)) return { ok: false, status: 422, message: "Email chưa đúng định dạng.", field: "email" };
  if (input.password.length < 8)
    return { ok: false, status: 422, message: "Mật khẩu cần ít nhất 8 ký tự.", field: "password" };
  if (findUserByEmail(email))
    return { ok: false, status: 409, message: "Email này đã có tài khoản. Đăng nhập thay vì tạo mới.", field: "email" };

  const id = newId("usr");
  run(
    `INSERT INTO users (id, email, name, password_hash, role, plan, status, created_at, last_login_at)
     VALUES (?, ?, ?, ?, 'user', 'free', 'active', ?, ?)`,
    id,
    email,
    name,
    hashPassword(input.password),
    now(),
    now(),
  );

  const user = findUserById(id);
  if (!user) return { ok: false, status: 500, message: "Không tạo được tài khoản." };
  const { token } = createSession(id, input);
  run(
    `INSERT INTO audit_log (id, actor_id, actor_email, action, target, detail, created_at)
     VALUES (?, ?, ?, 'Tạo tài khoản', ?, ?, ?)`,
    newId("log"),
    id,
    email,
    "Đăng ký web",
    input.userAgent ?? null,
    now(),
  );
  return { ok: true, user: toPublicUser(user), token };
}

export function loginUser(input: {
  email: string;
  password: string;
  userAgent?: string | null;
  ip?: string | null;
}): AuthResult {
  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, status: 422, message: "Chưa nhập email.", field: "email" };
  if (!input.password) return { ok: false, status: 422, message: "Chưa nhập mật khẩu.", field: "password" };

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(input.password, user.password_hash))
    return { ok: false, status: 401, message: "Email hoặc mật khẩu không đúng." };
  if (user.status !== "active")
    return {
      ok: false,
      status: 403,
      message: "Tài khoản đang bị tạm khoá. Liên hệ quản trị viên để mở lại.",
    };

  const { token } = createSession(user.id, input);
  run(
    `INSERT INTO audit_log (id, actor_id, actor_email, action, target, detail, created_at)
     VALUES (?, ?, ?, 'Đăng nhập', ?, ?, ?)`,
    newId("log"),
    user.id,
    user.email,
    "Phiên web",
    input.userAgent ?? null,
    now(),
  );
  return { ok: true, user: toPublicUser(user), token };
}

export function listSessions(userId: string) {
  return all<{
    id: string;
    created_at: number;
    expires_at: number;
    user_agent: string | null;
    ip: string | null;
  }>(
    "SELECT id, created_at, expires_at, user_agent, ip FROM sessions WHERE user_id = ? ORDER BY created_at DESC",
    userId,
  );
}
