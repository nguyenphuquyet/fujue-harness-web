#!/usr/bin/env node
/**
 * Chụp từng khung nhìn của một trang ở bề rộng cho trước để soi bằng mắt.
 *
 *   node scripts/shots.mjs --url / --width 375 [--out .layout/shots] [--count 12] [--login email:mk]
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
const width = Number(readArg("width", "375"));
const height = Number(readArg("height", "812"));
const count = Number(readArg("count", "10"));
const outDir = path.resolve(readArg("out", ".layout/shots"));
const login = readArg("login", "");

mkdirSync(outDir, { recursive: true });

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
  await page.evaluate(async (body) => {
    await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }, { email: login.slice(0, separator), password: login.slice(separator + 1) });
}

await page.goto(`${base}${url}`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);

const total = await page.evaluate(() => document.documentElement.scrollHeight);
const step = Math.round(height * 0.92);
const frames = Math.min(count, Math.ceil(total / step));

for (let index = 0; index < frames; index += 1) {
  await page.evaluate((y) => window.scrollTo(0, y), index * step);
  await page.waitForTimeout(220);
  const file = path.join(outDir, `${index}-${width}.png`);
  await page.screenshot({ path: file });
}

console.log(`${frames} khung, cao ${total}px → ${path.relative(process.cwd(), outDir)}`);
await browser.close();
