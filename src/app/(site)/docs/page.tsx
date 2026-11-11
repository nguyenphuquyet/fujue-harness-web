import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  FolderOpen,
  Layers,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Hướng dẫn",
  description: "Bắt đầu với FuJue Harness trên desktop: cài đặt, giao diện, phiên làm việc, API và plugin.",
};

const TOC = [
  { id: "bat-dau", label: "Bắt đầu nhanh" },
  { id: "cai-dat", label: "Cài đặt" },
  { id: "giao-dien", label: "Giao diện" },
  { id: "phien", label: "Phiên làm việc" },
  { id: "cong-cu", label: "Công cụ và quyền" },
  { id: "thiet-bi", label: "Kết nối thiết bị" },
  { id: "api", label: "Tham chiếu API" },
  { id: "plugin", label: "Viết plugin" },
  { id: "faq", label: "Câu hỏi thường gặp" },
  { id: "lien-he", label: "Liên hệ" },
];

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface-subtle p-4 font-mono text-[12.5px] leading-6 text-muted">
      <code>{children}</code>
    </pre>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold tracking-tight">{children}</h2>;
}

function TocLinks() {
  return (
    <>
      {TOC.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="block truncate rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-item-hover hover:text-foreground"
        >
          {item.label}
        </a>
      ))}
    </>
  );
}

export default function DocsPage() {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[220px_1fr]">
      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <details className="group rounded-xl border border-border bg-surface px-3 py-2 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 text-sm font-medium [&_summary::-webkit-details-marker]:hidden">
            Mục lục
            <ChevronRight className="size-4 text-muted transition-transform group-open:rotate-90" />
          </summary>
          <nav className="mt-2 space-y-0.5 border-t border-border pt-2" aria-label="Mục lục tài liệu">
            <TocLinks />
          </nav>
          <ButtonLink href="/downloads" variant="primary" size="sm" className="mt-3 w-full">
            <Download className="size-3.5" />
            Tải bản cài
          </ButtonLink>
        </details>

        <div className="hidden lg:block">
          <p className="px-3 text-xs font-medium tracking-wide text-muted uppercase">Mục lục</p>
          <nav className="mt-2 space-y-0.5" aria-label="Mục lục tài liệu">
            <TocLinks />
          </nav>
          <div className="mt-6 rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-muted">Chưa cài app?</p>
            <ButtonLink href="/downloads" variant="primary" size="sm" className="mt-3 w-full">
              <Download className="size-3.5" />
              Tải bản cài
            </ButtonLink>
          </div>
        </div>
      </aside>

      <article className="min-w-0 max-w-[78ch] space-y-12">
        <header>
          <nav className="flex items-center gap-1.5 text-xs text-muted" aria-label="Đường dẫn">
            <Link href="/" className="hover:text-foreground">
              Trang chủ
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">Hướng dẫn</span>
          </nav>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Hướng dẫn sử dụng FuJue Harness
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Dành cho người vừa tải app lần đầu và người muốn nối API vào quy trình nội bộ. Mọi
            bước dưới đây chạy trên bản 0.9.2, hoàn toàn trong app desktop.
          </p>
        </header>

        <section id="bat-dau" className="scroll-mt-24">
          <SectionTitle>Bắt đầu nhanh</SectionTitle>
          <p className="mt-2 text-sm leading-6 text-muted">
            Ba bước để có phiên làm việc đầu tiên. Không cần cấu hình tệp hay dán khoá thủ công.
          </p>
          <ol className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: Download,
                title: "Tải và cài app",
                body: "Chọn bản cho Windows, macOS hoặc Linux.",
                href: "/downloads",
                cta: "Tải về",
              },
              {
                icon: MonitorSmartphone,
                title: "Đăng nhập bằng trình duyệt",
                body: "Nhập mã 8 ký tự để nối app với tài khoản.",
                href: "/device",
                cta: "Trang thiết bị",
              },
              {
                icon: FolderOpen,
                title: "Mở dự án và giao việc",
                body: "Chọn thư mục, chọn model, viết việc cần làm.",
                href: "/downloads",
                cta: "Bắt đầu",
              },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary-light text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span className="font-mono text-xs text-muted">0{index + 1}</span>
                  </div>
                  <p className="mt-3 text-sm font-medium">{step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{step.body}</p>
                  <Link
                    href={step.href}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {step.cta}
                    <ArrowRight className="size-3" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <section id="cai-dat" className="scroll-mt-24">
          <SectionTitle>Cài đặt</SectionTitle>
          <p className="mt-2 text-sm leading-6 text-muted">
            App được ký số trên cả ba nền tảng và tự kiểm tra bản cập nhật khi khởi động. Bạn có
            thể tắt tự cập nhật trong Cài đặt → Cập nhật.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left">
              <thead className="bg-surface-subtle text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Nền tảng</th>
                  <th className="px-4 py-3 font-medium">Yêu cầu</th>
                  <th className="px-4 py-3 font-medium">Định dạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface text-sm">
                {[
                  ["Windows", "Windows 10 trở lên · x64 / ARM64", "Trình cài .exe"],
                  ["macOS", "macOS 13 trở lên · Apple Silicon / Intel", "DMG universal"],
                  ["Linux", "Ubuntu 22.04+, Fedora 40+, Debian 12+", "AppImage, .deb"],
                ].map((row) => (
                  <tr key={row[0]}>
                    <td className="px-4 py-3 font-medium">{row[0]}</td>
                    <td className="px-4 py-3 text-muted">{row[1]}</td>
                    <td className="px-4 py-3 text-muted">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-4 space-y-2.5">
            {[
              "Lần đầu mở app, hệ điều hành có thể hỏi xác nhận — bấm mở để tiếp tục.",
              "App không cần quyền quản trị. Mọi dữ liệu nằm trong thư mục người dùng.",
              "Đăng nhập bằng trình duyệt; app không lưu mật khẩu, chỉ giữ khoá thiết bị.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm leading-6 text-muted">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section id="giao-dien" className="scroll-mt-24">
          <SectionTitle>Giao diện</SectionTitle>
          <p className="mt-2 text-sm leading-6 text-muted">
            Cửa sổ app chia làm ba vùng quen thuộc. Mọi thứ bạn cần đều nằm trong một cửa sổ,
            không phải chuyển qua lại giữa trình duyệt và trình soạn thảo.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: Layers,
                title: "Cột bên trái",
                body: "Không gian làm việc, phiên gần đây, tác vụ nền, công cụ và quyền truy cập.",
              },
              {
                icon: Sparkles,
                title: "Vùng giữa",
                body: "Cuộc trao đổi với agent. Mỗi bước dùng công cụ hiện thành thẻ riêng, kèm kết quả.",
              },
              {
                icon: Wrench,
                title: "Ô soạn tin",
                body: "Chọn model, đính kèm tệp, giao việc tiếp theo. Phím tắt ⌘ ↵ để gửi nhanh.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-xl border border-border bg-surface p-4">
                  <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <Icon className="size-4" />
                  </span>
                  <p className="mt-3 text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{item.body}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">
            Cần xem nhanh trạng thái? Thanh trên cùng hiển thị thư mục đang mở, model đang dùng và
            tình trạng lưu phiên. Bấm vào tên thư mục để đổi dự án.
          </p>
        </section>

        <section id="phien" className="scroll-mt-24">
          <SectionTitle>Phiên làm việc</SectionTitle>
          <p className="mt-2 text-sm leading-6 text-muted">
            Mỗi lượt chạy được ghi xuống đĩa ngay khi phát sinh. Bạn có thể đóng app, khởi động
            lại máy, rồi mở lại đúng phiên cũ mà không mất ngữ cảnh.
          </p>
          <ul className="mt-4 space-y-3">
            {[
              "Mở lại phiên từ danh sách Gần đây ở cột bên trái; thời gian mở lại thường dưới 2 giây.",
              "Tác vụ dài tiếp tục chạy nền khi đóng cửa sổ. Mở lại app để xem tiến độ hoặc kết quả.",
              "Mỗi bước có checkpoint: bạn xem lại tệp đã sửa và khôi phục về trước một bước nếu cần.",
              "Đổi model giữa phiên không làm mất ngữ cảnh; giá của model mới hiện ngay trong ô soạn tin.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm leading-6 text-muted">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section id="cong-cu" className="scroll-mt-24">
          <SectionTitle>Công cụ và quyền</SectionTitle>
          <p className="mt-2 text-sm leading-6 text-muted">
            Agent chỉ chạm được vào thứ bạn cho phép. Lần đầu mở một thư mục, app hỏi phạm vi truy
            cập; bạn có thể đổi lại bất cứ lúc nào trong Cài đặt → Quyền truy cập.
          </p>
          <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
            {[
              ["Tệp", "Đọc, sửa, tạo và xoá trong thư mục dự án đã cấp quyền."],
              ["Lệnh", "Chạy lệnh trong workspace; thao tác nguy hiểm cần bạn duyệt."],
              ["Tìm kiếm", "Tìm trong mã nguồn và tra web khi tác vụ cần thông tin bên ngoài."],
              ["MCP", "Gọi MCP server bạn cấu hình, dùng chung cơ chế duyệt quyền."],
            ].map(([name, desc]) => (
              <div key={name} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
                <p className="w-24 shrink-0 text-sm font-medium">{name}</p>
                <p className="text-xs leading-5 text-muted">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
            <p className="text-xs leading-5 text-muted">
              Mặc định, mọi lệnh ghi ra ngoài thư mục dự án đều bị chặn cho tới khi bạn duyệt.
              Nhật ký phiên ghi lại từng thao tác để bạn kiểm tra lại.
            </p>
          </div>
        </section>

        <section id="thiet-bi" className="scroll-mt-24">
          <SectionTitle>Kết nối thiết bị</SectionTitle>
          <p className="mt-2 text-sm leading-6 text-muted">
            App không lưu mật khẩu. Nó xin một mã thiết bị, bạn duyệt mã đó khi đã đăng nhập trên
            web, rồi app nhận một khoá API riêng cho máy đó.
          </p>
          <ol className="mt-4 space-y-3">
            {[
              "Trong app, chọn Đăng nhập bằng trình duyệt. App hiện mã 8 ký tự và mở sẵn trang kết nối.",
              "Đăng nhập tài khoản FuJue, nhập mã đang hiện trong app và xác nhận.",
              "Quay lại app — khoá thiết bị được lưu trong keychain và xuất hiện trong bảng điều khiển.",
            ].map((line, index) => (
              <li key={line} className="flex gap-3 text-sm leading-6 text-muted">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-light font-mono text-[11px] text-primary">
                  {index + 1}
                </span>
                {line}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm leading-6 text-muted">
            Mã hết hạn sau 10 phút. Mỗi lần cấp khoá sẽ ghi một dòng vào nhật ký thao tác và khoá
            xuất hiện trong bảng điều khiển với tên thiết bị.
          </p>
        </section>

        <section id="api" className="scroll-mt-24">
          <SectionTitle>Tham chiếu API</SectionTitle>
          <p className="mt-2 text-sm leading-6 text-muted">
            Cổng API tương thích OpenAI. Base URL{" "}
            <span className="font-mono text-foreground">https://api.fujue.dev/v1</span>, xác thực
            bằng <span className="font-mono text-foreground">Authorization: Bearer fj_live_…</span>.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left">
              <thead className="bg-surface-subtle text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Endpoint</th>
                  <th className="px-4 py-3 font-medium">Mục đích</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface text-sm">
                {[
                  ["GET /v1/models", "Danh mục model, ngữ cảnh và giá hiện hành"],
                  ["POST /v1/chat/completions", "Gọi model, hỗ trợ stream và tools"],
                  ["GET /v1/harness/config", "Cấu hình app nhận sau khi đăng nhập thiết bị"],
                ].map(([endpoint, desc]) => (
                  <tr key={endpoint}>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{endpoint}</td>
                    <td className="px-4 py-3 text-muted">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm leading-6 text-muted">Ví dụ một lượt gọi:</p>
          <Code>{`POST /v1/chat/completions
{
  "model": "deepseek-v4",
  "messages": [{ "role": "user", "content": "Giải thích lỗi này" }],
  "stream": true,
  "tools": []
}`}</Code>

          <p className="mt-4 text-sm leading-6 text-muted">
            Cấu hình model mặc định cho app nằm ở cùng một nơi. Sau khi đăng nhập, app gọi{" "}
            <span className="font-mono text-foreground">GET /v1/harness/config</span> để nhận base
            URL, model mặc định và danh mục kèm nguồn của từng model — không phải chép tay.
          </p>
          <Code>{`{
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

        <section id="plugin" className="scroll-mt-24">
          <SectionTitle>Viết plugin</SectionTitle>
          <p className="mt-2 text-sm leading-6 text-muted">
            Plugin là một gói Cordis: khai báo service, đăng ký công cụ, thêm màn hình. App nạp
            plugin từ thư mục cấu hình người dùng hoặc từ cấu hình dự án.
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

        <section id="faq" className="scroll-mt-24">
          <SectionTitle>Câu hỏi thường gặp</SectionTitle>
          <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
            {[
              {
                q: "Có bản dòng lệnh không?",
                a: "Không. FuJue Harness là app desktop. Mọi thao tác — chọn dự án, giao việc, duyệt công cụ — đều thực hiện trong app.",
              },
              {
                q: "Dữ liệu phiên nằm ở đâu?",
                a: "Trên máy bạn, trong thư mục dữ liệu của app. Site chỉ giữ tài khoản, khoá API và số liệu sử dụng tổng hợp.",
              },
              {
                q: "Có dùng khoá DeepSeek của riêng tôi được không?",
                a: "Được. Trong Cài đặt → Nhà cung cấp, dán khoá của bạn hoặc trỏ tới API tương thích OpenAI. App vẫn giữ nguyên luồng duyệt quyền và nhật ký.",
              },
              {
                q: "Gỡ app có mất phiên không?",
                a: "Không. Phiên nằm trong thư mục dữ liệu riêng. Xoá thêm thư mục đó nếu muốn dọn sạch hoàn toàn.",
              },
            ].map((item) => (
              <details key={item.q} className="group px-4 py-3.5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                  {item.q}
                  <ChevronRight className="size-4 shrink-0 text-muted transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-2.5 text-sm leading-6 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="lien-he" className="scroll-mt-24">
          <SectionTitle>Liên hệ</SectionTitle>
          <p className="mt-2 text-sm leading-6 text-muted">
            Câu hỏi về gói Đội nhóm, hoá đơn hoặc triển khai trong mạng nội bộ: gửi tới{" "}
            <span className="font-mono text-foreground">team@fujue.dev</span>. Đội ngũ trả lời trong
            ngày làm việc.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href="/pricing" variant="outline" size="sm">
              Xem bảng giá
            </ButtonLink>
            <ButtonLink href="/downloads" variant="outline" size="sm">
              Tải app
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
