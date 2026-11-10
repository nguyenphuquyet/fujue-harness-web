import Link from "next/link";
import {
  Apple,
  ArrowRight,
  Blocks,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Download,
  History,
  KeyRound,
  Layers,
  Monitor,
  Play,
  ShieldCheck,
  Sparkles,
  Terminal as TerminalIcon,
  Users,
} from "lucide-react";
import { Badge, Dot } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { listModels, formatTokens, formatPricePerMillion, STATUS_LABELS } from "@/lib/models";
import { currentUser } from "@/lib/auth";

const FEATURES = [
  {
    icon: History,
    title: "Phiên bền vững",
    body: "Mỗi lượt chạy ghi xuống đĩa. Đóng app, mở lại, phiên vẫn ở đúng chỗ đã dừng — kể cả khi máy khởi động lại giữa lúc agent đang chạy.",
  },
  {
    icon: Layers,
    title: "Đổi model giữa phiên",
    body: "Cùng một tác vụ, đổi từ model nhanh sang model suy luận sâu mà không mất ngữ cảnh. Giá hiển thị ngay khi chọn.",
  },
  {
    icon: TerminalIcon,
    title: "Terminal và công cụ",
    body: "Chạy lệnh, đọc và sửa tệp, tìm web, gọi MCP server. 42 công cụ có sẵn, mỗi công cụ đều có giao diện riêng khi hiển thị kết quả.",
  },
  {
    icon: Users,
    title: "Phân quyền và nhật ký",
    body: "Tách vai trò quản trị và thành viên. Mỗi lần đăng nhập, mỗi khoá API, mỗi thay đổi model đều nằm trong nhật ký thao tác.",
  },
  {
    icon: Clock,
    title: "Chạy nền",
    body: "Tác vụ dài chạy ngoài phiên chat. Đóng cửa sổ vẫn chạy, quay lại lấy kết quả khi xong.",
  },
  {
    icon: Blocks,
    title: "Mở bằng plugin",
    body: "Thêm công cụ, prompt và cả màn hình bằng plugin Cordis. Không cần sửa lõi, không cần fork.",
  },
];

const FAQ = [
  {
    q: "FuJue Harness khác gì khi dùng trực tiếp web của DeepSeek?",
    a: "Harness là lớp chạy trên máy bạn: nó giữ phiên, chạy lệnh trong workspace, đọc và sửa tệp, và gọi model qua khoá API của bạn. Web chat không có quyền chạm vào mã nguồn hay terminal của bạn.",
  },
  {
    q: "Tôi cần khoá API riêng hay dùng khoá của FuJue?",
    a: "Cả hai đều được. Tạo khoá API ngay trên trang này để dùng hạn mức của FuJue, hoặc trỏ cấu hình về khoá DeepSeek bạn đã có. Khoá của FuJue có tiền tố fj_live_ và thu hồi được bất cứ lúc nào.",
  },
  {
    q: "Bản miễn phí có giới hạn gì?",
    a: "Bản miễn phí không giới hạn số phiên trên máy, nhưng giới hạn 500.000 token mỗi tháng khi gọi qua khoá của FuJue và chỉ dùng model nhanh. Nâng lên Pro để mở toàn bộ danh mục model.",
  },
  {
    q: "Dữ liệu phiên của tôi nằm ở đâu?",
    a: "Toàn bộ phiên, tệp và nhật ký nằm trên máy bạn. Site này chỉ giữ tài khoản, khoá API và số liệu sử dụng tổng hợp; nội dung hội thoại không được gửi lên đây.",
  },
];

export default async function HomePage() {
  const models = listModels();
  const featured = models.filter((m) => m.featured === 1).slice(0, 3);
  const user = await currentUser();

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden />

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Link
              href="/downloads"
              className="fj-rise inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface/80 px-3 py-1.5 text-xs text-muted backdrop-blur transition-colors hover:text-foreground"
            >
              <Dot tone="brand" />
              Bản xem trước 0.9.2 đã có cho Windows, macOS, Linux
              <ArrowRight className="size-3" />
            </Link>

            <h1 className="fj-rise mt-6 text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-6xl">
              Harness agent cho đội ngũ
              <br className="hidden sm:block" /> dùng DeepSeek mỗi ngày
            </h1>

            <p className="fj-rise mx-auto mt-5 max-w-2xl text-base leading-7 text-muted text-pretty sm:text-lg">
              FuJue Harness gom model, công cụ, terminal và phiên làm việc vào một chỗ. Cắm khoá
              API, mở terminal, giao việc cho agent — phần còn lại nó tự chạy.
            </p>

            <div className="fj-rise mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href={user ? "/dashboard" : "/register"} variant="primary" size="lg" className="w-full sm:w-auto">
                {user ? "Vào bảng điều khiển" : "Bắt đầu miễn phí"}
                <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="/downloads" variant="outline" size="lg" className="w-full sm:w-auto">
                <Download className="size-4" />
                Tải về máy
              </ButtonLink>
            </div>

            <p className="mt-4 text-xs text-muted">
              Miễn phí cho cá nhân · Không cần thẻ · Windows, macOS, Linux
            </p>
          </div>

          {/* Terminal */}
          <div className="fj-rise mx-auto mt-12 max-w-3xl sm:mt-14">
            <div className="terminal-card overflow-hidden rounded-2xl border border-border-strong shadow-popover">
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <div className="flex gap-1.5" aria-hidden>
                  <span className="size-2.5 rounded-full bg-[#ff5f57]/70" />
                  <span className="size-2.5 rounded-full bg-[#febc2e]/70" />
                  <span className="size-2.5 rounded-full bg-[#28c840]/70" />
                </div>
                <p className="font-mono text-xs text-muted">fujue — workspace: apps/web</p>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2 py-0.5 text-[11px] text-success">
                  <Dot tone="success" /> Phiên đang chạy
                </span>
              </div>

              <div className="space-y-3 p-4 font-mono text-[13px] leading-6 sm:p-5">
                <p className="text-foreground">
                  <span className="text-primary">❯</span> fujue &quot;sửa lỗi build của gói web&quot;
                </p>
                <div className="space-y-1 text-muted">
                  <p>
                    <span className="text-foreground">›</span> Đọc 42 tệp trong apps/web, packages/ui
                  </p>
                  <p>
                    <span className="text-foreground">›</span> Chạy{" "}
                    <span className="text-foreground">pnpm --filter web build</span>
                  </p>
                  <p className="text-danger">
                    ✗ TS2305: Module &apos;@/lib/env&apos; has no exported member &apos;publicEnv&apos;
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted">
                    <span className="text-foreground">›</span> Sửa 2 tệp: apps/web/src/lib/env.ts,
                    apps/web/.env.example
                  </p>
                  <p className="text-success">✓ Build lại xong trong 14,2 giây</p>
                  <p className="text-muted">
                    <span className="text-foreground">›</span> Tổng: 38.412 token vào · 4.109 token ra ·{" "}
                    <span className="text-foreground">$0,015</span>
                  </p>
                </div>
                <p className="text-foreground">
                  <span className="text-primary">❯</span>
                  <span className="ml-2 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-foreground/70" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 divide-x divide-border px-0 sm:grid-cols-4">
          {[
            { value: "6", label: "model trong danh mục" },
            { value: "42", label: "công cụ dựng sẵn" },
            { value: "3", label: "nền tảng máy tính" },
            { value: "< 2s", label: "mở lại phiên cũ" },
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-6 sm:px-6">
              <p className="text-xl font-semibold tracking-tight sm:text-2xl">{stat.value}</p>
              <p className="mt-1 text-xs text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="tinh-nang" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">Tính năng</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Không phải một ô chat. Một môi trường làm việc.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Harness lo phần khó: giữ phiên, gọi công cụ, quản lý quyền và chi phí. Bạn lo phần
              việc.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <Icon className="size-4" />
                  </span>
                  <h3 className="mt-4 text-base font-medium">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{feature.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ MODELS ============ */}
      <section id="model" className="scroll-mt-20 border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-wide text-primary uppercase">Danh mục model</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Chọn model theo việc, không theo bảng xếp hạng
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Giá tính theo 1 triệu token. Đổi model giữa phiên không mất ngữ cảnh.
              </p>
            </div>
            <Link
              href="/models"
              className="inline-flex h-8 items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
            >
              Xem tất cả model
              <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left">
              <thead className="bg-background text-xs text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Ngữ cảnh</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Vào / ra</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Tốc độ</th>
                  <th className="px-5 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {featured.map((model) => (
                  <tr key={model.slug} className="transition-colors hover:bg-surface-hover">
                    <td className="px-5 py-4">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {model.name}
                        {model.featured === 1 ? <Badge tone="brand">Nổi bật</Badge> : null}
                      </p>
                      <p className="mt-0.5 max-w-md text-xs text-muted">{model.description}</p>
                    </td>
                    <td className="px-4 py-4 font-mono text-sm text-muted">
                      {formatTokens(model.context_window)}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-4 font-mono text-sm text-muted sm:table-cell">
                      {formatPricePerMillion(model.input_price)} / {formatPricePerMillion(model.output_price)}
                    </td>
                    <td className="hidden px-4 py-4 text-sm text-muted md:table-cell">
                      {model.speed === "fast" ? "Nhanh" : "Cân bằng"}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={model.status === "stable" ? "success" : "warning"}>
                        {STATUS_LABELS[model.status] ?? model.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ============ DOWNLOADS ============ */}
      <section id="tai-ve" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">Tải về</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Cài trong một lần bấm
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Bản xem trước 0.9.2, ký số đầy đủ. Cài xong, bấm “Đăng nhập bằng trình duyệt” trong
              app để nối với tài khoản trên trang này.
            </p>
          </div>

          <div className="mt-8 grid gap-3 lg:grid-cols-3">
            {[
              {
                icon: Monitor,
                os: "Windows",
                detail: "Windows 10 trở lên · 64-bit",
                file: "FuJueHarness-0.9.2-win-x64.exe",
                size: "128 MB",
                primary: true,
              },
              {
                icon: Apple,
                os: "macOS",
                detail: "macOS 13 trở lên · Apple Silicon và Intel",
                file: "FuJueHarness-0.9.2-universal.dmg",
                size: "142 MB",
                primary: false,
              },
              {
                icon: TerminalIcon,
                os: "Linux",
                detail: "Ubuntu 22.04, Fedora 40, Debian 12",
                file: "FuJueHarness-0.9.2-x86_64.AppImage",
                size: "134 MB",
                primary: false,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.os} className="flex flex-col rounded-2xl border border-border bg-surface p-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-background text-foreground">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-base font-medium">{item.os}</p>
                      <p className="text-xs text-muted">{item.detail}</p>
                    </div>
                  </div>

                  <dl className="mt-5 space-y-2 border-t border-border pt-4 text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Tệp</dt>
                      <dd className="truncate font-mono text-foreground">{item.file}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Dung lượng</dt>
                      <dd className="text-foreground">{item.size}</dd>
                    </div>
                  </dl>

                  <div className="mt-5">
                    <ButtonLink
                      href="/downloads"
                      variant={item.primary ? "primary" : "outline"}
                      className="w-full"
                    >
                      <Download className="size-4" />
                      Tải cho {item.os}
                    </ButtonLink>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                <Code2 className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">Dùng dòng lệnh</p>
                <p className="text-xs text-muted">Cho CI, máy chủ và người quen terminal</p>
              </div>
            </div>
            <code className="flex-1 overflow-x-auto rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-xs text-foreground sm:ml-6">
              npm i -g @fujue/harness && fujue login
            </code>
          </div>
        </div>
      </section>

      {/* ============ API ============ */}
      <section id="api" className="scroll-mt-20 border-b border-border bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-medium tracking-wide text-primary uppercase">API và khoá</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Một khoá API, dùng cho mọi thứ
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Tạo khoá trong bảng điều khiển rồi gọi model qua cổng tương thích OpenAI. Khoá có
              tiền tố <span className="font-mono text-foreground">fj_live_</span>, chỉ hiện một lần
              khi tạo, thu hồi được tức thì.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                "Gọi đúng chuẩn /v1/chat/completions, đổi base URL là chạy",
                "Mỗi khoá có hạn mức riêng và nhật ký sử dụng",
                "Đăng nhập thiết bị bằng mã 8 ký tự, không dán khoá thủ công",
                "Thu hồi một khoá không ảnh hưởng các khoá khác",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-muted">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  {line}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href={user ? "/dashboard/keys" : "/register"} variant="primary">
                <KeyRound className="size-4" />
                {user ? "Quản lý khoá API" : "Tạo khoá đầu tiên"}
              </ButtonLink>
              <ButtonLink href="/docs#api" variant="outline">
                <BookOpen className="size-4" />
                Đọc tham chiếu API
              </ButtonLink>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border-strong bg-background">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <span className="rounded-md bg-surface px-2 py-1 font-mono text-[11px] text-foreground">
                cURL
              </span>
              <span className="font-mono text-[11px] text-muted">POST /v1/chat/completions</span>
              <Copy className="ml-auto size-3.5 text-muted" aria-hidden />
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-6 text-muted">
              <code>{`curl https://api.fujue.dev/v1/chat/completions \\
  -H "Authorization: Bearer fj_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-v4",
    "messages": [
      { "role": "user", "content": "Giải thích lỗi này" }
    ],
    "stream": true
  }'`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="text-center">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">Hỏi đáp</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Câu hỏi thường gặp
            </h2>
          </div>

          <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-surface">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                  {item.q}
                  <ChevronRight className="size-4 shrink-0 text-muted transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 max-w-[70ch] text-sm leading-6 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="relative mx-auto w-full max-w-3xl px-4 py-20 text-center sm:px-6">
          <Sparkles className="mx-auto size-6 text-primary" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Mở terminal và giao việc đầu tiên
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
            Tạo tài khoản, lấy khoá API, tải app. Cả quá trình mất chưa tới hai phút.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={user ? "/dashboard" : "/register"} variant="primary" size="lg">
              {user ? "Vào bảng điều khiển" : "Tạo tài khoản miễn phí"}
              <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href="/docs" variant="outline" size="lg">
              <Play className="size-4" />
              Xem hướng dẫn
            </ButtonLink>
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
            <ShieldCheck className="size-3.5" />
            Không cần thẻ · Huỷ bất cứ lúc nào
          </p>
        </div>
      </section>
    </>
  );
}
