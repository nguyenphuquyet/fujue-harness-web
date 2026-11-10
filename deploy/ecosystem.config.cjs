/**
 * Cấu hình pm2 cho bản chạy thật trên VPS. Máy chủ chỉ giải nén
 * `dist/fujue-web.tgz` (bản `.next/standalone` đã gói) vào thư mục `cwd` rồi
 * `pm2 start ecosystem.config.cjs`; không cần `npm install` hay `next build`.
 *
 * Giá trị riêng của từng máy chủ — tài khoản quản trị đầu tiên, đường dẫn dữ
 * liệu — đặt trong `deploy/ecosystem.local.cjs` cạnh file này:
 *
 *   module.exports = {
 *     env: { FUJUE_ADMIN_EMAIL: "…", FUJUE_ADMIN_PASSWORD: "…" },
 *   };
 *
 * File đó bị `.gitignore` chặn nên không lên git. Thiếu nó thì app chạy với giá
 * trị mặc định bên dưới, tức tài khoản quản trị mẫu của môi trường phát triển.
 */
const local = (() => {
  try {
    return require("./ecosystem.local.cjs");
  } catch {
    return {};
  }
})();

module.exports = {
  apps: [
    {
      name: "fujue-web",
      script: "server.js",
      cwd: "/home/ubuntu/fujue-harness-web",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "700M",
      env: {
        NODE_ENV: "production",
        PORT: 3145,
        HOSTNAME: "0.0.0.0",
        FUJUE_DB_PATH: "/home/ubuntu/fujue-harness-web/data/fujue.db",
        NEXT_PUBLIC_SITE_URL: "https://harness.nguyenphuquyet.online",
        FUJUE_SEED_DEMO: "0",
        ...(local.env ?? {}),
      },
    },
  ],
};
