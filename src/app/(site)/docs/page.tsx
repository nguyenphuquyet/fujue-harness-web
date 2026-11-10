import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Tài liệu",
  description: "Bắt đầu với FuJue Harness: cài đặt, dòng lệnh, API và viết plugin.",
};

const TOC = [
  { id: "bat-dau", label: "Bắt đầu nhanh" },
  { id: "cli", label: "Dòng lệnh" },
  { id: "api", label: "Tham chiếu API" },
  { id: "thiet-bi", label: "Kết nối thiết bị" },
  { id: "plugin", label: "Viết plugin" },
  { id: "lien-he", label: "Liên hệ" },
];

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-background p-4 font-mono text-[12.5px] leading-6 text-muted">
      <code>{children}</code>
    </pre>
  );
}

export default function DocsPage() {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[220px_1fr]">
      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <nav className="space-y-1" aria-label="Mục lục tài liệu">
          {TOC.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="block truncate rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-item-hover hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-6 rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Cần khoá API để bắt đầu?</p>
          <ButtonLink href="/register" variant="primary" size="sm" className="mt-3 w-full">
            Tạo tài khoản
          </ButtonLink>
        </div>
      </aside>

      <article className="min-w-0 max-w-[75ch] space-y-12">
        <header>
          <nav className="flex items-center gap-1.5 text-xs text-muted" aria-label="Đường dẫn">
            <Link href="/" className="hover:text-foreground">
              Trang chủ
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">Tài liệu</span>
          </nav>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Tài liệu FuJue Harness</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Dành cho người vừa cài app lần đầu và người đang nối CI vào model. Mọi lệnh dưới đây
            chạy trên bản 0.9.2.
          </p>
        </header>

        <section id="bat-dau" className="scroll-mt-24">
          <h2 className="text-lg font-semibold tracking-tight">Bắt đầu nhanh</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Tải app ở trang Tải về, mở lên và đăng nhập. Nếu bạn dùng khoá DeepSeek có sẵn, bỏ qua
            bước đăng nhập và dán khoá vào Cài đặt → Nhà cung cấp.
          </p>
          <Code>{`# 1. Cài đặt
npm i -g @fujue/harness

# 2. Đăng nhập bằng trình duyệt (mã 8 ký tự)
fujue login

# 3. Chạy tác vụ đầu tiên trong thư mục dự án
cd ~/du-an && fujue "tóm tắt cấu trúc repo này"`}</Code>
        </section>

        <section id="cli" className="scroll-mt-24">
          <h2 className="text-lg font-semibold tracking-tight">Dòng lệnh</h2>
          <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
            {[
              { cmd: "fujue", desc: "Mở phiên tương tác trong thư mục hiện tại" },
              { cmd: "fujue \"<tác vụ>\"", desc: "Chạy một tác vụ rồi thoát" },
              { cmd: "fujue login / logout", desc: "Nối hoặc ngắt tài khoản trên máy này" },
              { cmd: "fujue models", desc: "Liệt kê model và giá hiện hành" },
              { cmd: "fujue session list", desc: "Xem các phiên đã lưu trên máy" },
              { cmd: "fujue session resume <id>", desc: "Mở lại một phiên cũ" },
              { cmd: "fujue jobs", desc: "Xem các tác vụ đang chạy nền" },
            ].map((row) => (
              <div key={row.cmd} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                <code className="w-full shrink-0 font-mono text-xs text-foreground sm:w-64">{row.cmd}</code>
                <span className="text-xs text-muted">{row.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="api" className="scroll-mt-24">
          <h2 className="text-lg font-semibold tracking-tight">Tham chiếu API</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Cổng API tương thích OpenAI. Base URL <span className="font-mono text-foreground">https://api.fujue.dev/v1</span>,
            xác thực bằng <span className="font-mono text-foreground">Authorization: Bearer fj_live_…</span>.
          </p>
          <Code>{`POST /v1/chat/completions
{
  "model": "deepseek-v4",
  "messages": [{ "role": "user", "content": "…" }],
  "stream": true,
  "tools": []
}`}</Code>
          <p className="mt-3 text-sm leading-6 text-muted">
            Model khả dụng lấy từ <span className="font-mono text-foreground">GET /v1/models</span>. Mã lỗi theo chuẩn
            HTTP; phần thân lỗi có dạng <span className="font-mono text-foreground">{`{ "error": "…", "field": "…" }`}</span>.
          </p>
          <Code>{`# Liệt kê model bằng khoá của bạn
curl https://api.fujue.dev/v1/models \\
  -H "Authorization: Bearer $FUJUE_KEY"`}</Code>
          <p className="mt-3 text-sm leading-6 text-muted">
            Cấu hình model mặc định cho harness nằm ở cùng một nơi: app gọi{" "}
            <span className="font-mono text-foreground">GET /v1/harness/config</span> sau khi đăng
            nhập để nhận base URL, model mặc định và danh mục kèm nguồn của từng model — không phải
            chép tay danh sách model.
          </p>
          <Code>{`curl https://api.fujue.dev/v1/harness/config \\
  -H "Authorization: Bearer $FUJUE_KEY"

{
  "api": { "base_url": "https://api.fujue.dev/v1" },
  "default_model": "deepseek-v4",
  "models": [
    {
      "id": "deepseek-v4",
      "context_window": 262144,
      "default": true,
      "source": {
        "provider": "FuJue",
        "base_url": "https://api.fujue.dev/v1",
        "upstream_id": "deepseek-v4"
      }
    }
  ]
}`}</Code>
        </section>

        <section id="thiet-bi" className="scroll-mt-24">
          <h2 className="text-lg font-semibold tracking-tight">Kết nối thiết bị</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            App không lưu mật khẩu. Nó xin một mã thiết bị, bạn duyệt mã đó khi đã đăng nhập trên
            web, rồi app nhận một khoá API riêng cho máy đó.
          </p>
          <Code>{`POST /api/v1/device/start    → { device_code, user_code, expires_in }
POST /api/v1/device/approve  → duyệt mã (cần phiên web)
POST /api/v1/device/token    → { api_key, user } khi mã đã duyệt`}</Code>
          <p className="mt-3 text-sm leading-6 text-muted">
            Mã hết hạn sau 10 phút. Mỗi lần cấp khoá sẽ ghi một dòng vào nhật ký thao tác và khoá
            xuất hiện trong bảng điều khiển với tên thiết bị.
          </p>
        </section>

        <section id="plugin" className="scroll-mt-24">
          <h2 className="text-lg font-semibold tracking-tight">Viết plugin</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Plugin là một gói Cordis: khai báo service, đăng ký công cụ, thêm lệnh. Harness nạp
            plugin từ <span className="font-mono text-foreground">~/.fujue/plugins</span> hoặc từ cấu hình dự án.
          </p>
          <Code>{`export const name = "plugin-ví-dụ";

export function apply(ctx) {
  ctx.tool({
    name: "deploy_staging",
    description: "Đẩy bản dựng hiện tại lên staging",
    async run() {
      return ctx.shell.run("pnpm deploy:staging");
    },
  });
}`}</Code>
        </section>

        <section id="lien-he" className="scroll-mt-24">
          <h2 className="text-lg font-semibold tracking-tight">Liên hệ</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Câu hỏi về gói Đội nhóm, hoá đơn hoặc triển khai trong mạng nội bộ: gửi tới{" "}
            <span className="font-mono text-foreground">team@fujue.dev</span>. Đội ngũ trả lời trong
            ngày làm việc.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href="/pricing" variant="outline" size="sm">
              Xem bảng giá
            </ButtonLink>
            <ButtonLink href="/device" variant="outline" size="sm">
              Kết nối thiết bị
            </ButtonLink>
          </div>
        </section>
      </article>
    </div>
  );
}
