import { cp, rm, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Gom bản dựng `output: "standalone"` thành một thư mục chạy được: Next chỉ đặt
 * server + node_modules vào `.next/standalone`, còn file tĩnh và `public` phải
 * chép tay theo đúng vị trí mà server mong đợi.
 *
 * Kết quả ở `.next/standalone`, chép nguyên thư mục đó lên máy chủ là chạy được
 * bằng `node server.js`, không cần `npm install` hay `next build` ở đó.
 */
const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

try {
  await stat(path.join(standalone, "server.js"));
} catch {
  console.error("Chưa có .next/standalone. Chạy `npm run build` trước.");
  process.exit(1);
}

const staticDir = path.join(standalone, ".next", "static");
await rm(staticDir, { recursive: true, force: true });
await cp(path.join(root, ".next", "static"), staticDir, { recursive: true });

try {
  await stat(path.join(root, "public"));
  await cp(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
} catch {
  // Không có `public`: site chỉ dùng route và file trong .next, không cần chép gì.
}

console.log(`Bản chạy được: ${standalone}`);
console.log("Chạy thử: PORT=3145 HOSTNAME=0.0.0.0 node .next/standalone/server.js");
