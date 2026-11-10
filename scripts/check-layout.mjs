#!/usr/bin/env node
/**
 * Kiểm tra bố cục ở nhiều bề rộng: báo tràn ngang, phần tử tràn khỏi khung nhìn,
 * và chụp ảnh từng trang để soi bằng mắt.
 *
 *   node scripts/check-layout.mjs [--base http://localhost:4310] [--widths 375,768,1280]
 *                                [--out .layout] [--pages /,/login,/dashboard]
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
const widths = readArg("widths", "375,768,1280").split(",").map(Number);
const outDir = path.resolve(readArg("out", ".layout"));
const pages = readArg(
  "pages",
  "/,/models,/downloads,/docs,/pricing,/login,/register,/device",
).split(",");

/** Đăng nhập sẵn ("email:mật khẩu") để soi được trang sau đăng nhập. */
const login = readArg("login", "");

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const problems = [];

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
    locale: "vi-VN",
    colorScheme: "light",
  });

  const page = await context.newPage();

  if (login) {
    const separator = login.indexOf(":");
    const credentials = { email: login.slice(0, separator), password: login.slice(separator + 1) };
    await page.goto(`${base}/login`, { waitUntil: "domcontentloaded" });
    const ok = await page.evaluate(async (body) => {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return response.ok;
    }, credentials);
    if (!ok) throw new Error(`Đăng nhập thất bại cho ${credentials.email}`);
  }
  for (const route of pages) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(250);

    const report = await page.evaluate(() => {
      const doc = document.documentElement;
      const viewport = doc.clientWidth;
      const offenders = [];
      const insideScroller = (el) => {
        for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
          const overflowX = getComputedStyle(node).overflowX;
          if (overflowX === "auto" || overflowX === "scroll") return true;
        }
        return false;
      };
      for (const el of document.querySelectorAll("body *")) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const style = getComputedStyle(el);
        if (style.position === "fixed" || style.overflowX === "auto" || style.overflowX === "scroll") continue;
        if (insideScroller(el)) continue;
        const overflow = Math.round(rect.right - viewport);
        if (overflow > 1) {
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || "").toString().slice(0, 90),
            text: (el.textContent || "").trim().slice(0, 50),
            overflow,
          });
        }
      }
      return {
        scrollWidth: doc.scrollWidth,
        viewport,
        horizontalScroll: doc.scrollWidth - viewport > 1,
        offenders: offenders.slice(0, 6),
      };
    });

    const name = route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-");
    const file = path.join(outDir, `${name}-${width}.png`);
    await page.screenshot({ path: file, fullPage: true });

    if (report.horizontalScroll || report.offenders.length > 0) {
      problems.push({ route, width, ...report });
    }
    console.log(
      `${width}px ${route.padEnd(14)} ${report.horizontalScroll ? "TRÀN NGANG" : "ok"}  → ${path.relative(process.cwd(), file)}`,
    );
  }

  await context.close();
}

await browser.close();

if (problems.length > 0) {
  console.log("\nChi tiết tràn:");
  console.log(JSON.stringify(problems, null, 2));
  process.exitCode = 1;
} else {
  console.log("\nKhông có tràn ngang.");
}
