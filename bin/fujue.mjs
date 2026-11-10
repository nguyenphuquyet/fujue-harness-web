#!/usr/bin/env node
/**
 * `fujue` — công cụ dòng lệnh nối máy này với tài khoản FuJue trên web.
 *
 * Luồng đăng nhập theo mô hình thiết bị: CLI xin mã, mở trình duyệt để người
 * dùng duyệt, rồi nhận khoá API. Mật khẩu không bao giờ đi qua terminal.
 *
 *   fujue login [--label "MacBook của Linh"]
 *   fujue status
 *   fujue models
 *   fujue logout
 *
 * Biến môi trường: FUJUE_WEB_URL (mặc định http://localhost:4310),
 * FUJUE_CONFIG (mặc định ~/.fujue/harness-web.json).
 */
import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const BASE = (process.env.FUJUE_WEB_URL ?? "http://localhost:4310").replace(/\/$/, "");
const CONFIG = process.env.FUJUE_CONFIG ?? path.join(homedir(), ".fujue", "harness-web.json");
const POLL_INTERVAL_MS = 3000;
const DEVICE_TTL_MS = 10 * 60 * 1000;

const COLORS = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, text) => (COLORS ? `\u001b[${code}m${text}\u001b[0m` : text);
const dim = (text) => paint("2", text);
const bold = (text) => paint("1", text);
const cyan = (text) => paint("36", text);
const green = (text) => paint("32", text);
const red = (text) => paint("31", text);

class ApiError extends Error {
  /** @param {number} status @param {string} message */
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Gọi JSON, ném ApiError kèm thông điệp tiếng Việt do máy chủ trả về. */
async function call(pathname, init) {
  let response;
  try {
    response = await fetch(`${BASE}${pathname}`, init);
  } catch {
    throw new ApiError(0, `Không kết nối được ${BASE}. Kiểm tra mạng hoặc chạy máy chủ web.`);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data.error ?? `Máy chủ trả ${response.status}.`);
  return data;
}

const post = (pathname, body) =>
  call(pathname, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

async function readConfig() {
  try {
    // Một số trình soạn thảo trên Windows ghi kèm BOM; JSON.parse không nhận.
    return JSON.parse((await readFile(CONFIG, "utf8")).replace(/^\uFEFF/, ""));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw new Error(`Không đọc được ${CONFIG}: ${error.message}`);
  }
}

async function writeConfig(config) {
  await mkdir(path.dirname(CONFIG), { recursive: true });
  await writeFile(CONFIG, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
}

function openBrowser(url) {
  const command =
    process.platform === "win32" ? ["cmd", ["/c", "start", "", url]]
    : process.platform === "darwin" ? ["open", [url]]
    : ["xdg-open", [url]];

  return new Promise((resolve) => {
    // Không mở được trình duyệt không phải lỗi: URL đã in ra để tự mở.
    execFile(command[0], command[1], { windowsHide: true }, () => resolve());
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function login(label) {
  const start = await post("/api/v1/device/start", { label });
  const url = `${BASE}/device?code=${encodeURIComponent(start.user_code)}`;

  console.log("");
  console.log(`  ${bold("Mã thiết bị")}   ${cyan(start.user_code)}`);
  console.log(`  ${dim("Duyệt tại")}     ${url}`);
  console.log("");
  console.log(dim("  Đang chờ duyệt trên trình duyệt… (Ctrl+C để huỷ)"));
  console.log("");

  await openBrowser(url);

  const deadline = Date.now() + DEVICE_TTL_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    try {
      const token = await post("/api/v1/device/token", { device_code: start.device_code });
      await writeConfig({
        api_key: token.api_key,
        user: token.user,
        base_url: BASE,
        label: label ?? null,
        saved_at: new Date().toISOString(),
      });
      console.log(`  ${green("✔")} Đã nối ${bold(token.user.email)}`);
      console.log(dim(`    Khoá lưu tại ${CONFIG}`));
      console.log(dim("    Khoá chỉ hiện một lần — xem lại danh sách trong bảng điều khiển web."));
      console.log("");
      return 0;
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      if (error.status === 428) continue;
      console.error(`  ${red("✖")} ${error.message}`);
      return 1;
    }
  }

  console.error(`  ${red("✖")} Mã hết hạn sau 10 phút. Chạy lại \`fujue login\`.`);
  return 1;
}

async function status() {
  const config = await readConfig();
  if (!config?.api_key) {
    console.log(dim("  Chưa nối tài khoản. Chạy: fujue login"));
    return 1;
  }

  console.log("");
  console.log(`  ${bold(config.user?.email ?? "không rõ")}  ${dim(config.user?.name ?? "")}`);
  console.log(`  ${dim("Máy chủ")}   ${config.base_url}`);
  console.log(`  ${dim("Khoá")}      ${config.api_key.slice(0, 14)}••••`);
  console.log(`  ${dim("Nối lúc")}   ${new Date(config.saved_at).toLocaleString("vi-VN")}`);
  console.log(dim(`  ${CONFIG}`));
  console.log("");
  return 0;
}

async function models() {
  const data = await call("/api/v1/models");
  const rows = data.data ?? [];
  const width = Math.max(...rows.map((row) => row.id.length), 4);
  console.log("");
  console.log(`  ${dim("MODEL".padEnd(width))}  ${dim("NGỮ CẢNH".padStart(9))}  ${dim("VÀO".padStart(6))}  ${dim("RA".padStart(6))}  ${dim("NGUỒN".padEnd(12))}  ${dim("TRẠNG THÁI")}`);
  for (const row of rows) {
    const context = `${Math.round(row.context_window / 1000)}K`;
    const price = (value) => (value === 0 ? "—" : `$${value.toFixed(2)}`);
    const source = row.source?.provider ?? "chưa gắn";
    const marker = row.default ? "*" : " ";
    console.log(
      `  ${(row.id + marker).padEnd(width + 1)}  ${context.padStart(9)}  ${price(row.pricing.input_per_million_usd).padStart(6)}  ${price(row.pricing.output_per_million_usd).padStart(6)}  ${source.padEnd(12)}  ${dim(row.status)}`,
    );
  }
  console.log("");
  console.log(dim("  * model mặc định"));
  console.log("");
  return 0;
}

/**
 * In cấu hình model mà harness nhận từ site: base URL, model mặc định và danh
 * mục kèm nguồn. `--json` xuất nguyên văn để nạp vào công cụ khác.
 */
async function configCommand(asJson) {
  const config = await readConfig();
  if (!config?.api_key) {
    console.log(dim("  Chưa nối tài khoản. Chạy: fujue login"));
    return 1;
  }

  const data = await call("/api/v1/harness/config", {
    headers: { Authorization: `Bearer ${config.api_key}` },
  });
  if (asJson) {
    console.log(JSON.stringify(data, null, 2));
    return 0;
  }

  console.log("");
  console.log(`  ${dim("API base")}    ${data.api?.base_url ?? "?"}`);
  console.log(`  ${dim("Mặc định")}    ${bold(data.default_model ?? "chưa đặt")}`);
  console.log(`  ${dim("Tài khoản")}   ${data.account?.email ?? "?"} · gói ${data.account?.plan ?? "?"}`);
  console.log("");
  for (const model of data.models ?? []) {
    const marker = model.default ? cyan("*") : " ";
    const upstream = model.source?.upstream_id ?? "—";
    console.log(`  ${marker} ${model.id.padEnd(24)} ${dim(upstream)}`);
  }
  console.log("");
  return 0;
}

async function logout() {
  await rm(CONFIG, { force: true });
  console.log(dim(`  Đã xoá ${CONFIG}. Nhớ thu hồi khoá trong bảng điều khiển web.`));
  return 0;
}

function usage() {
  console.log(`
  ${bold("fujue")} — nối máy này với tài khoản FuJue Harness

  ${bold("Lệnh")}
    fujue login [--label <tên máy>]   Đăng nhập bằng trình duyệt, lưu khoá API
    fujue status                      Xem tài khoản đang nối
    fujue models                      Liệt kê model, giá và nguồn
    fujue config [--json]             In cấu hình model mà harness nhận từ site
    fujue logout                      Xoá khoá khỏi máy

  ${dim(`Máy chủ: ${BASE} (đổi bằng FUJUE_WEB_URL)`)}
  ${dim(`Cấu hình: ${CONFIG} (đổi bằng FUJUE_CONFIG)`)}
`);
  return 0;
}

const [command = "help", ...rest] = process.argv.slice(2);

try {
  if (command === "login") {
    const index = rest.indexOf("--label");
    const label = index >= 0 ? rest[index + 1] : undefined;
    process.exitCode = await login(label);
  } else if (command === "status") {
    process.exitCode = await status();
  } else if (command === "models") {
    process.exitCode = await models();
  } else if (command === "config") {
    process.exitCode = await configCommand(rest.includes("--json"));
  } else if (command === "logout") {
    process.exitCode = await logout();
  } else {
    process.exitCode = usage();
  }
} catch (error) {
  console.error(`  ${red("✖")} ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
