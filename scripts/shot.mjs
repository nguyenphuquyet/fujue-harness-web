#!/usr/bin/env node
/**
 * Chụp một trang ở bề rộng cho trước, có thể đăng nhập sẵn và bấm một phần tử
 * trước khi chụp (dùng để xem hộp thoại).
 *
 *   node scripts/shot.mjs --url /dashboard --width 1440 [--login email:mk] [--out a.png] [--full]
 *   node scripts/shot.mjs --url /admin/models --login ... --click "text=Thêm model"
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const readArg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};

const base = readArg("base", "http://localhost:4310").replace(/\/$/, "");
const url = readArg("url", "/");
const width = Number(readArg("width", "1440"));
const height = Number(readArg("height", "900"));
const login = readArg("login", "");
const click = readArg("click", "");
const full = !args.includes("--viewport");
const out = path.resolve(readArg("out", ".layout/shot.png"));

mkdirSync(path.dirname(out), { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width, height },
  locale: "vi-VN",
  colorScheme: "light",
});
const page = await context.newPage();

if (login) {
  const separator = login.indexOf(":");
  await page.goto(`${base}/login`, { waitUntil: "domcontentloaded" });
  const ok = await page.evaluate(async (body) => {
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return response.ok;
  }, { email: login.slice(0, separator), password: login.slice(separator + 1) });
  if (!ok) throw new Error("Đăng nhập thất bại");
}

await page.goto(`${base}${url}`, { waitUntil: "networkidle" });
if (click) {
  await page.locator(click).first().click();
  await page.waitForTimeout(300);
}
await page.waitForTimeout(400);
await page.screenshot({ path: out, fullPage: full });
console.log(path.relative(process.cwd(), out));
await browser.close();
