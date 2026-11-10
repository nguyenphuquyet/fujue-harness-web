import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * SQLite là nguồn dữ liệu duy nhất của site: tài khoản, phiên, khoá API,
 * danh mục model, nhật ký thao tác. File nằm ở `data/fujue.db`, đổi bằng
 * biến môi trường FUJUE_DB_PATH.
 */
const DB_PATH =
  process.env.FUJUE_DB_PATH ?? path.join(process.cwd(), "data", "fujue.db");

type Statement = ReturnType<DatabaseSync["prepare"]>;

function open(): DatabaseSync {
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  migrate(db);
  seed(db);
  return db;
}

declare global {
  // eslint-disable-next-line no-var
  var __fujueDb: DatabaseSync | undefined;
}

export function getDb(): DatabaseSync {
  if (!globalThis.__fujueDb) globalThis.__fujueDb = open();
  return globalThis.__fujueDb;
}

export function all<T>(sql: string, ...params: Array<string | number | null>): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}

export function one<T>(sql: string, ...params: Array<string | number | null>): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined;
}

export function run(
  sql: string,
  ...params: Array<string | number | null>
): { changes: number; lastInsertRowid: number | bigint } {
  const stmt: Statement = getDb().prepare(sql);
  return stmt.run(...params) as { changes: number; lastInsertRowid: number | bigint };
}

export function now(): number {
  return Date.now();
}

/** Cấu hình đơn giản một giá trị, ví dụ model mặc định cho harness. */
export function getSetting(key: string): string | null {
  const row = one<{ value: string }>("SELECT value FROM settings WHERE key = ?", key);
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  run(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value,
  );
}

export function deleteSetting(key: string): void {
  run("DELETE FROM settings WHERE key = ?", key);
}

function migrate(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'user',
      plan          TEXT NOT NULL DEFAULT 'free',
      status        TEXT NOT NULL DEFAULT 'active',
      created_at    INTEGER NOT NULL,
      last_login_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      user_agent TEXT,
      ip         TEXT
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name         TEXT NOT NULL,
      prefix       TEXT NOT NULL,
      key_hash     TEXT NOT NULL UNIQUE,
      created_at   INTEGER NOT NULL,
      last_used_at INTEGER,
      revoked_at   INTEGER,
      requests     INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS models (
      id             TEXT PRIMARY KEY,
      slug           TEXT NOT NULL UNIQUE,
      name           TEXT NOT NULL,
      family         TEXT NOT NULL,
      vendor         TEXT NOT NULL,
      context_window INTEGER NOT NULL,
      max_output     INTEGER NOT NULL,
      input_price    REAL NOT NULL,
      output_price   REAL NOT NULL,
      speed          TEXT NOT NULL,
      status         TEXT NOT NULL DEFAULT 'stable',
      description    TEXT NOT NULL,
      featured       INTEGER NOT NULL DEFAULT 0,
      released_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS providers (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      base_url       TEXT NOT NULL,
      api_key        TEXT NOT NULL DEFAULT '',
      enabled        INTEGER NOT NULL DEFAULT 1,
      created_at     INTEGER NOT NULL,
      last_synced_at INTEGER,
      last_error     TEXT,
      last_summary   TEXT
    );

    CREATE TABLE IF NOT EXISTS usage_daily (
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day        TEXT NOT NULL,
      requests   INTEGER NOT NULL DEFAULT 0,
      tokens_in  INTEGER NOT NULL DEFAULT 0,
      tokens_out INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, day)
    );

    CREATE TABLE IF NOT EXISTS devices (
      id               TEXT PRIMARY KEY,
      device_code_hash TEXT NOT NULL UNIQUE,
      user_code        TEXT NOT NULL UNIQUE,
      status           TEXT NOT NULL DEFAULT 'pending',
      user_id          TEXT REFERENCES users(id) ON DELETE CASCADE,
      label            TEXT,
      created_at       INTEGER NOT NULL,
      expires_at       INTEGER NOT NULL,
      approved_at      INTEGER,
      token_issued_at  INTEGER
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id          TEXT PRIMARY KEY,
      actor_id    TEXT,
      actor_email TEXT,
      action      TEXT NOT NULL,
      target      TEXT,
      detail      TEXT,
      created_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_keys_user ON api_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_daily(user_id);
  `);

  // Model nhập từ API bên ngoài: giữ nguồn và mã gốc để lần đồng bộ sau cập nhật
  // đúng dòng thay vì tạo bản trùng.
  const columns = new Set(
    (db.prepare("PRAGMA table_info(models)").all() as Array<{ name: string }>).map((row) => row.name),
  );
  const additions = [
    ["provider_id", "TEXT"],
    ["external_id", "TEXT"],
    ["synced_at", "INTEGER"],
  ] as const;
  for (const [name, definition] of additions) {
    if (!columns.has(name)) db.exec(`ALTER TABLE models ADD COLUMN ${name} ${definition}`);
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const derived = scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(hashHex, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString("base64url")}`;
}

const SEED_MODELS = [
  {
    slug: "deepseek-v4",
    name: "DeepSeek V4",
    family: "DeepSeek",
    vendor: "DeepSeek",
    context: 262144,
    maxOutput: 32768,
    input: 0.28,
    output: 1.12,
    speed: "fast",
    status: "stable",
    featured: 1,
    description:
      "Model chủ lực cho lập trình, suy luận dài và điều khiển công cụ. Cân bằng tốt nhất giữa chất lượng và chi phí.",
  },
  {
    slug: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    family: "DeepSeek",
    vendor: "DeepSeek",
    context: 524288,
    maxOutput: 65536,
    input: 0.55,
    output: 2.19,
    speed: "balanced",
    status: "stable",
    featured: 1,
    description:
      "Bản mở rộng ngữ cảnh cho refactor nhiều tệp, đọc cả monorepo và chạy tác vụ nhiều bước.",
  },
  {
    slug: "deepseek-coder-lite",
    name: "DeepSeek Coder Lite",
    family: "DeepSeek",
    vendor: "DeepSeek",
    context: 131072,
    maxOutput: 16384,
    input: 0.1,
    output: 0.4,
    speed: "fast",
    status: "stable",
    featured: 0,
    description:
      "Model nhẹ cho autocomplete, sửa lỗi nhỏ và tác vụ tốn nhiều lượt gọi. Độ trễ thấp nhất trong danh mục.",
  },
  {
    slug: "qwen3-max",
    name: "Qwen3 Max",
    family: "Qwen",
    vendor: "Alibaba",
    context: 262144,
    maxOutput: 32768,
    input: 0.4,
    output: 1.6,
    speed: "balanced",
    status: "stable",
    featured: 0,
    description:
      "Đa ngôn ngữ tốt, mạnh về đọc hiểu tài liệu dài và sinh nội dung tiếng Việt.",
  },
  {
    slug: "kimi-k2",
    name: "Kimi K2",
    family: "Kimi",
    vendor: "Moonshot",
    context: 262144,
    maxOutput: 32768,
    input: 0.32,
    output: 1.28,
    speed: "balanced",
    status: "beta",
    featured: 0,
    description:
      "Suy luận agent dài hơi với khả năng gọi công cụ song song. Đang ở giai đoạn beta công khai.",
  },
  {
    slug: "gpt-oss-120b",
    name: "GPT-OSS 120B",
    family: "OSS",
    vendor: "OpenAI",
    context: 131072,
    maxOutput: 16384,
    input: 0.18,
    output: 0.72,
    speed: "fast",
    status: "stable",
    featured: 0,
    description:
      "Trọng số mở, chạy được trên hạ tầng riêng. Hợp với tổ chức cần giữ dữ liệu trong mạng nội bộ.",
  },
];

function seed(db: DatabaseSync): void {
  const users = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (users.n === 0) {
    const createdAt = now() - 1000 * 60 * 60 * 24 * 62;
    // Tài khoản quản trị đầu tiên lấy từ biến môi trường để triển khai thật không
    // phải chạy bằng mật khẩu mẫu. Đổi mật khẩu ngay sau lần đăng nhập đầu.
    const adminEmail = process.env.FUJUE_ADMIN_EMAIL?.trim() || "admin@fujue.dev";
    const adminPassword = process.env.FUJUE_ADMIN_PASSWORD || "Admin@12345";
    // Dữ liệu mẫu (người dùng demo, khoá giả, thống kê, nhật ký) chỉ dành cho máy
    // phát triển; đặt FUJUE_SEED_DEMO=0 khi chạy công khai.
    const withDemo = process.env.FUJUE_SEED_DEMO !== "0";
    const insert = db.prepare(
      `INSERT INTO users (id, email, name, password_hash, role, plan, status, created_at, last_login_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    insert.run(
      newId("usr"),
      adminEmail,
      "Quyết Guic",
      hashPassword(adminPassword),
      "admin",
      "team",
      "active",
      createdAt,
      now() - 1000 * 60 * 12,
    );
    if (withDemo) {
      insert.run(
        newId("usr"),
        "linh@fujue.dev",
        "Nguyễn Thị Phương Thảo Linh",
        hashPassword("Demo@12345"),
        "user",
        "pro",
        "active",
        now() - 1000 * 60 * 60 * 24 * 24,
        now() - 1000 * 60 * 60 * 27,
      );
      insert.run(
        newId("usr"),
        "bao@fujue.dev",
        "Trần Bảo",
        hashPassword("Demo@12345"),
        "user",
        "free",
        "suspended",
        now() - 1000 * 60 * 60 * 24 * 9,
        now() - 1000 * 60 * 60 * 24 * 9,
      );
    }

    const admin = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(adminEmail) as { id: string };

    const keyStmt = db.prepare(
      `INSERT INTO api_keys (id, user_id, name, prefix, key_hash, created_at, last_used_at, requests)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    if (withDemo) {
      keyStmt.run(
        newId("key"),
        admin.id,
        "Máy văn phòng",
        "fj_live_7C2A",
        "seed-disabled-" + randomBytes(8).toString("hex"),
        now() - 1000 * 60 * 60 * 24 * 30,
        now() - 1000 * 60 * 42,
        18422,
      );
    }

    const demo = withDemo
      ? (db.prepare("SELECT id FROM users WHERE email = ?").get("linh@fujue.dev") as { id: string })
      : null;

    if (demo) {
      keyStmt.run(
        newId("key"),
        demo.id,
        "CI pipeline",
        "fj_live_A91D",
        "seed-disabled-" + randomBytes(8).toString("hex"),
        now() - 1000 * 60 * 60 * 24 * 12,
        now() - 1000 * 60 * 60 * 5,
        2310,
      );

      const usage = db.prepare(
        `INSERT INTO usage_daily (user_id, day, requests, tokens_in, tokens_out) VALUES (?, ?, ?, ?, ?)`,
      );
      for (let i = 13; i >= 0; i -= 1) {
        const day = new Date(now() - i * 86400000).toISOString().slice(0, 10);
        const base = 120 + Math.round(Math.sin(i / 1.7) * 46) + (13 - i) * 9;
        usage.run(admin.id, day, base, base * 1420, base * 380);
        usage.run(demo.id, day, Math.round(base * 0.42), Math.round(base * 640), Math.round(base * 190));
      }
    }

    const audit = db.prepare(
      `INSERT INTO audit_log (id, actor_id, actor_email, action, target, detail, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    audit.run(
      newId("log"),
      admin.id,
      adminEmail,
      "Đăng nhập",
      "Phiên web",
      "Chrome · Windows",
      now() - 1000 * 60 * 12,
    );
    if (demo) {
      audit.run(
        newId("log"),
        admin.id,
        adminEmail,
        "Tạo khoá API",
        "Máy văn phòng",
        "fj_live_7C2A••••",
        now() - 1000 * 60 * 42,
      );
      audit.run(
        newId("log"),
        admin.id,
        adminEmail,
        "Tạm khoá người dùng",
        "bao@fujue.dev",
        "Vi phạm chính sách sử dụng",
        now() - 1000 * 60 * 60 * 30,
      );
    }
    audit.run(
      newId("log"),
      admin.id,
      adminEmail,
      "Cập nhật model",
      "DeepSeek V4 Pro",
      "Ngữ cảnh 524.288 token",
      now() - 1000 * 60 * 60 * 52,
    );
  }

  const models = db.prepare("SELECT COUNT(*) AS n FROM models").get() as { n: number };
  if (models.n === 0) {
    // Mọi model đều thuộc một nguồn. Nguồn khởi tạo trỏ thẳng tới API của nhà cung
    // cấp model: cổng `/api/v1/chat/completions` của site chuyển tiếp sang đó, nên
    // nguồn không bao giờ được trỏ về chính site. Quản trị viên thay URL và dán
    // khoá của nguồn ở trang quản trị.
    const seedBaseUrl = process.env.FUJUE_SEED_PROVIDER_URL?.trim() || "https://api.deepseek.com/v1";
    const providers = db.prepare("SELECT COUNT(*) AS n FROM providers").get() as { n: number };
    const providerId = newId("prv");
    if (providers.n === 0) {
      db.prepare(
        `INSERT INTO providers (id, name, base_url, api_key, enabled, created_at, last_synced_at, last_summary)
         VALUES (?, ?, ?, '', 1, ?, NULL, ?)`,
      ).run(providerId, "DeepSeek", seedBaseUrl.replace(/\/+$/, ""), now(), "Danh mục khởi tạo của site");
    }

    const boundProvider =
      providers.n === 0
        ? providerId
        : (db.prepare("SELECT id FROM providers ORDER BY created_at ASC LIMIT 1").get() as {
            id: string;
          }).id;

    const insert = db.prepare(
      `INSERT INTO models (id, slug, name, family, vendor, context_window, max_output, input_price,
        output_price, speed, status, description, featured, released_at, provider_id, external_id, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    SEED_MODELS.forEach((m, index) => {
      insert.run(
        newId("mdl"),
        m.slug,
        m.name,
        m.family,
        m.vendor,
        m.context,
        m.maxOutput,
        m.input,
        m.output,
        m.speed,
        m.status,
        m.description,
        m.featured,
        now() - 1000 * 60 * 60 * 24 * (30 + index * 19),
        boundProvider,
        m.slug,
        now(),
      );
    });

    const defaultSlug = SEED_MODELS.find((m) => m.featured === 1)?.slug ?? SEED_MODELS[0]?.slug;
    if (defaultSlug) {
      db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('default_model_slug', ?)").run(
        defaultSlug,
      );
    }
  }
}

export function logAudit(entry: {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  target?: string | null;
  detail?: string | null;
}): void {
  run(
    `INSERT INTO audit_log (id, actor_id, actor_email, action, target, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    newId("log"),
    entry.actorId ?? null,
    entry.actorEmail ?? null,
    entry.action,
    entry.target ?? null,
    entry.detail ?? null,
    now(),
  );
}
