#!/usr/bin/env node
/**
 * Kiểm tra cổng model `POST /api/v1/chat/completions` trên một máy chủ đang chạy:
 * dựng một API nguồn giả, cắm người dùng + nguồn + model vào SQLite, gọi cổng và
 * đối chiếu những gì nguồn nhận được cùng số token ghi vào `usage_daily`.
 *
 *   node .next/standalone/server.js &          # hoặc npm run start
 *   FUJUE_DB_PATH=data/fujue.db node scripts/smoke-gateway.mjs --base http://127.0.0.1:4310
 *
 * Script dọn sạch mọi dòng nó tạo ra, nên chạy lại được nhiều lần.
 */
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const args = process.argv.slice(2);
const readArg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};

const target = readArg("base", "http://127.0.0.1:4310");
const upstreamPort = Number(readArg("upstream-port", "4398"));
const dbPath = process.env.FUJUE_DB_PATH ?? path.join(process.cwd(), "data", "fujue.db");

const KEY = `fj_live_smoke_${randomBytes(6).toString("hex")}`;
const UPSTREAM_KEY = "sk-upstream-smoke";
const SLUG = "smoke-gateway-model";
const UPSTREAM_ID = "upstream/gateway-check";
const USER_ID = "usr_smoke_gateway";
const PROVIDER_ID = "prv_smoke_gateway";
const MODEL_ID = "mdl_smoke_gateway";

const seen = { model: "", authorization: "", stream: false };

const sse = (payload) => `data: ${JSON.stringify(payload)}\n\n`;

const upstream = createServer((request, response) => {
  if (request.method !== "POST" || !request.url.endsWith("/chat/completions")) {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: { message: "Không có endpoint này." } }));
    return;
  }

  let body = "";
  request.on("data", (chunk) => {
    body += chunk;
  });
  request.on("end", () => {
    const parsed = JSON.parse(body);
    seen.model = parsed.model;
    seen.authorization = request.headers.authorization ?? "";
    seen.stream = parsed.stream === true;

    response.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store" });
    response.write(
      sse({ id: "chatcmpl-smoke", object: "chat.completion.chunk", choices: [{ delta: { content: "ok" }, index: 0 }] }),
    );
    response.write(
      sse({
        id: "chatcmpl-smoke",
        object: "chat.completion.chunk",
        choices: [],
        usage: { prompt_tokens: 17, completion_tokens: 5, total_tokens: 22 },
      }),
    );
    response.end("data: [DONE]\n\n");
  });
});

await new Promise((resolve) => upstream.listen(upstreamPort, "127.0.0.1", resolve));

// Máy chủ tạo schema ở request đầu tiên, nên gọi một endpoint công khai trước khi
// mở file SQLite.
const warmed = await fetch(`${target}/api/v1/models`).catch((error) => {
  upstream.close();
  console.error(`✗ không gọi được ${target}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
if (!warmed.ok) {
  upstream.close();
  console.error(`✗ ${target}/api/v1/models trả ${warmed.status}`);
  process.exit(1);
}

const db = new DatabaseSync(dbPath);
const cleanup = () => {
  db.prepare("DELETE FROM usage_daily WHERE user_id = ?").run(USER_ID);
  db.prepare("DELETE FROM api_keys WHERE user_id = ?").run(USER_ID);
  db.prepare("DELETE FROM models WHERE id = ?").run(MODEL_ID);
  db.prepare("DELETE FROM providers WHERE id = ?").run(PROVIDER_ID);
  db.prepare("DELETE FROM users WHERE id = ?").run(USER_ID);
};

const fail = (message) => {
  cleanup();
  upstream.close();
  console.error(`✗ ${message}`);
  process.exit(1);
};

cleanup();
const now = Date.now();

db.prepare(
  `INSERT INTO users (id, email, name, password_hash, role, plan, status, created_at, last_login_at)
   VALUES (?, ?, ?, ?, 'user', 'pro', 'active', ?, NULL)`,
).run(USER_ID, "smoke@fujue.test", "Smoke", "smoke-not-a-real-hash", now);
db.prepare(
  `INSERT INTO providers (id, name, base_url, api_key, enabled, created_at)
   VALUES (?, 'Nguồn kiểm tra', ?, ?, 1, ?)`,
).run(PROVIDER_ID, `http://127.0.0.1:${upstreamPort}/v1`, UPSTREAM_KEY, now);
db.prepare(
  `INSERT INTO models (id, slug, name, family, vendor, context_window, max_output, input_price,
                       output_price, speed, status, description, featured, released_at,
                       provider_id, external_id, synced_at)
   VALUES (?, ?, 'Smoke', 'smoke', 'smoke', 1024, 256, 0, 0, 'fast', 'stable', '', 0, ?, ?, ?, ?)`,
).run(MODEL_ID, SLUG, now, PROVIDER_ID, UPSTREAM_ID, now);
db.prepare(
  `INSERT INTO api_keys (id, user_id, name, prefix, key_hash, created_at, last_used_at, requests)
   VALUES ('key_smoke_gateway', ?, 'Smoke', ?, ?, ?, NULL, 0)`,
).run(USER_ID, KEY.slice(0, 12), createHash("sha256").update(KEY).digest("hex"), now);

let response;
try {
  response = await fetch(`${target}/api/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: SLUG,
      stream: true,
      messages: [{ role: "user", content: "ping" }],
      stream_options: { include_usage: true },
    }),
  });
} catch (error) {
  fail(`không gọi được ${target}: ${error instanceof Error ? error.message : String(error)}`);
}

const text = await response.text();
if (response.status !== 200) fail(`cổng trả ${response.status}: ${text.slice(0, 300)}`);
if (!text.includes("[DONE]")) fail("luồng trả về thiếu [DONE]");
if (seen.model !== UPSTREAM_ID) fail(`nguồn nhận model "${seen.model}", mong đợi "${UPSTREAM_ID}"`);
if (seen.authorization !== `Bearer ${UPSTREAM_KEY}`) fail("nguồn không nhận đúng khoá của nguồn");
if (!seen.stream) fail("cổng không chuyển tiếp stream");

const usage = db
  .prepare("SELECT requests, tokens_in, tokens_out FROM usage_daily WHERE user_id = ?")
  .get(USER_ID);
if (!usage) fail("không ghi được dòng usage_daily");
if (usage.requests !== 1) fail(`usage_daily.requests = ${usage.requests}, mong đợi 1`);
if (usage.tokens_in !== 17 || usage.tokens_out !== 5) {
  fail(`usage_daily token = ${usage.tokens_in}/${usage.tokens_out}, mong đợi 17/5`);
}

const revoked = await fetch(`${target}/api/v1/chat/completions`, {
  method: "POST",
  headers: { "content-type": "application/json", authorization: "Bearer fj_live_khong_ton_tai" },
  body: JSON.stringify({ model: SLUG, messages: [] }),
});
if (revoked.status !== 401) fail(`khoá sai trả ${revoked.status}, mong đợi 401`);

const missing = await fetch(`${target}/api/v1/chat/completions`, {
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
  body: JSON.stringify({ model: "khong-co-model-nay", messages: [] }),
});
if (missing.status !== 404) fail(`model lạ trả ${missing.status}, mong đợi 404`);
const afterFailure = db
  .prepare("SELECT requests FROM usage_daily WHERE user_id = ?")
  .get(USER_ID);
if (afterFailure.requests !== 1) {
  fail(`lời gọi hỏng bị tính vào usage_daily.requests (${afterFailure.requests})`);
}

cleanup();
db.close();
upstream.close();
console.log("✓ Cổng model chuyển tiếp đúng nguồn, đổi slug sang mã nguồn và ghi đủ token.");
