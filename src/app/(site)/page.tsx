import Link from "next/link";
import {
  Apple,
  ArrowRight,
  Blocks,
  BookOpen,
  Check,
  ChevronRight,
  CircleDot,
  Clock,
  Download,
  FileCode2,
  FolderOpen,
  History,
  KeyRound,
  Laptop,
  Layers,
  Monitor,
  Play,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { AppPreview } from "@/components/site/app-preview";
import { CopyButton } from "@/components/site/landing/copy-button";
import { Faq } from "@/components/site/landing/faq";
import { ModelSwitcher } from "@/components/site/landing/model-switcher";
import { Parallax } from "@/components/site/landing/parallax";
import { Reveal } from "@/components/site/landing/reveal";
import { StatBand } from "@/components/site/landing/stat-band";
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
    icon: Wrench,
    title: "Công cụ ngay trong app",
    body: "Đọc và sửa tệp, chạy lệnh, tìm web, gọi MCP server. 42 công cụ có sẵn, mỗi công cụ có giao diện riêng khi hiển thị kết quả.",
  },
  {
    icon: ShieldCheck,
    title: "Bạn giữ quyền quyết định",
    body: "Duyệt từng thao tác nguy hiểm, giới hạn thư mục agent được chạm vào, và xem lại mọi việc nó đã làm trong nhật ký phiên.",
  },
  {
    icon: Clock,
    title: "Chạy nền",
    body: "Tác vụ dài chạy ngoài cửa sổ chat. Đóng app vẫn chạy, quay lại lấy kết quả khi xong.",
  },
  {
    icon: Blocks,
    title: "Mở rộng bằng plugin",
    body: "Thêm công cụ, prompt và cả màn hình bằng plugin Cordis. Không cần sửa lõi, không cần fork.",
  },
];

const SESSION_STEPS = [
  { icon: FileCode2, title: "Đọc src/app/globals.css", detail: "128 dòng · đã sửa 2 chỗ", state: "done" },
  { icon: Terminal, title: "npm run typecheck", detail: "0 lỗi · 4,2s", state: "done" },
  { icon: History, title: "Mở lại phiên sau khởi động", detail: "đang khôi phục ngữ cảnh…", state: "running" },
] as const;

const STEPS = [
  {
    title: "Tải app cho máy của bạn",
    body: "Bản cài ký số cho Windows, macOS và Linux. Không cần cài thêm môi trường nào.",
  },
  {
    title: "Đăng nhập bằng trình duyệt",
    body: "App mở trang kết nối thiết bị và hiện mã 8 ký tự. Nhập mã một lần, app tự nhận khoá riêng.",
  },
  {
    title: "Chọn thư mục và giao việc",
    body: "Mở dự án, chọn model, viết việc cần làm. Agent đọc tệp, chạy lệnh và báo lại từng bước.",
  },
];

const PLATFORMS = [
  { icon: Monitor, os: "Windows", detail: "Windows 10+ · 64-bit", size: "128 MB" },
  { icon: Apple, os: "macOS", detail: "macOS 13+ · Universal", size: "142 MB" },
  { icon: Laptop, os: "Linux", detail: "Ubuntu, Fedora, Debian", size: "134 MB" },
];

const FAQ = [
  {
    q: "Có bản dòng lệnh không?",
    a: "Không. FuJue Harness được thiết kế để dùng hoàn toàn qua app desktop: mở dự án, giao việc, duyệt thao tác và xem kết quả trong một cửa sổ. Toàn bộ công cụ đều nằm trong app.",
  },
  {
    q: "FuJue Harness khác gì khi dùng trực tiếp web của DeepSeek?",
    a: "Harness là app chạy trên máy bạn: nó giữ phiên, chạy lệnh trong workspace, đọc và sửa tệp, và gọi model qua khoá API của bạn. Web chat không có quyền chạm vào mã nguồn hay thư mục dự án của bạn.",
  },
  {
    q: "Tôi cần khoá API riêng hay dùng khoá của FuJue?",
    a: "Cả hai đều được. Tạo khoá API ngay trên trang này để dùng hạn mức của FuJue, hoặc trỏ cấu hình về khoá DeepSeek bạn đã có. Khoá của FuJue có tiền tố fj_live_ và thu hồi được bất cứ lúc nào.",
  },
  {
    q: "Chi phí gọi model tính thế nào?",
    a: "Model miễn phí gọi không trừ tiền. Model có giá trừ vào ví trả trước theo đúng lượng token nguồn báo về, giá niêm yết theo 1 triệu token; nạp thêm ví bất cứ lúc nào trong bảng điều khiển và xem lại từng lượt trừ ở tab Mức sử dụng.",
  },
  {
    q: "Dữ liệu phiên của tôi nằm ở đâu?",
    a: "Toàn bộ phiên, tệp và nhật ký nằm trên máy bạn. Site này chỉ giữ tài khoản, khoá API và số liệu sử dụng tổng hợp; nội dung hội thoại không được gửi lên đây.",
  },
];

const CONFIG_SNIPPET = `{
  "api": {
    "base_url": "https://api.fujue.dev/v1"
  },
  "default_model": "deepseek-v4",
  "models": [
    {
      "id": "deepseek-v4",
      "context_window": 262144,
      "pricing": {
        "input_per_million_usd": 0.28,
        "output_per_million_usd": 1.12
      },
      "source": {
        "provider": "DeepSeek"
      }
    }
  ]
}`;

function FeatureCard({
  feature,
  className,
  children,
}: {
  feature: (typeof FEATURES)[number];
  className?: string;
  children?: React.ReactNode;
}) {
  const Icon = feature.icon;
  return (
    <article
      className={
        "group rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-border-strong " +
        (className ?? "")
      }
    >
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary-light text-primary transition-transform group-hover:-translate-y-0.5">
        <Icon className="size-4" />
      </span>
      <h3 className="mt-4 text-base font-medium">{feature.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted text-pretty">{feature.body}</p>
      {children}
    </article>
  );
}

export default async function HomePage() {
  const models = listModels();
  const featured = models.filter((m) => m.featured === 1).slice(0, 3);
  const switcherModels = (featured.length > 0 ? featured : models.slice(0, 3)).map((model) => ({
    slug: model.slug,
    name: model.name,
    context: formatTokens(model.context_window),
    price: `${formatPricePerMillion(model.input_price)} / ${formatPricePerMillion(model.output_price)}`,
    speed: model.speed === "fast" ? "Nhanh" : "Cân bằng",
  }));
  const user = await currentUser();

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="landing-aurora pointer-events-none absolute inset-0" aria-hidden />
        <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden />
        <div className="landing-grain pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 pb-14 pt-14 sm:px-6 sm:pb-16 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-10">
          <div className="stagger max-w-2xl">
            <Link
              href="/downloads"
              className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface/80 px-3 py-1.5 text-xs text-muted backdrop-blur transition-colors hover:text-foreground"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-2 py-0.5 text-[10.5px] font-medium text-primary">
                Mới
              </span>
              Bản xem trước 0.9.2 cho Windows, macOS, Linux
              <ArrowRight className="size-3" />
            </Link>

            <h1 className="mt-6 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl lg:text-[4.1rem]">
              Giao việc cho agent{" "}
              <span className="ink-gradient">ngay trên máy bạn</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-muted text-pretty sm:text-lg">
              FuJue Harness là app desktop gom model, công cụ và phiên làm việc vào một cửa sổ.
              Chọn thư mục dự án, giao việc — agent đọc tệp, chạy lệnh và báo lại kết quả.
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-start gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/downloads" variant="primary" size="lg" className="w-full sm:w-auto">
                <Download className="size-4" />
                Tải app miễn phí
              </ButtonLink>
              <ButtonLink href="/docs#bat-dau" variant="outline" size="lg" className="w-full sm:w-auto">
                <Play className="size-4" />
                Xem cách hoạt động
              </ButtonLink>
            </div>

            <p className="mt-4 flex flex-wrap items-center justify-start gap-x-4 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-success" />
                Miễn phí cho cá nhân
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-success" />
                Không cần thẻ
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-success" />
                Cài trong một lần bấm
              </span>
            </p>
          </div>

          <Parallax className="relative pt-8">
            <div
              className="fj-drift absolute left-2 top-0 z-10 hidden items-center gap-2 rounded-xl border border-border bg-surface/90 px-3 py-2 shadow-popover backdrop-blur sm:inline-flex"
              style={{ animationDelay: "0.8s" }}
            >
              <Wrench className="size-3.5 text-primary" />
              <span className="text-xs font-medium">42 công cụ dựng sẵn</span>
            </div>
            <div
              className="fj-drift absolute right-2 top-2 z-10 hidden items-center gap-2 rounded-xl border border-border bg-surface/90 px-3 py-2 shadow-popover backdrop-blur sm:inline-flex"
              style={{ animationDelay: "2.2s" }}
            >
              <CircleDot className="fj-pulse size-3.5 text-success" />
              <span className="text-xs font-medium">3 tác vụ chạy nền</span>
            </div>
            <AppPreview />
          </Parallax>
        </div>

        <div className="relative mx-auto grid w-full max-w-6xl gap-2 px-4 pb-10 sm:grid-cols-3 sm:px-6">
          {PLATFORMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.os}
                href="/downloads"
                className="group flex items-center gap-3 rounded-xl border border-border bg-surface/80 px-3.5 py-2.5 backdrop-blur transition-colors hover:border-border-strong"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-surface-subtle text-muted transition-colors group-hover:text-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium">FuJue Harness cho {item.os}</p>
                  <p className="truncate text-[11px] text-muted">
                    {item.detail} · {item.size}
                  </p>
                </div>
                <Download className="ml-auto size-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============ STATS ============ */}
      <StatBand
        stats={[
          { value: 42, label: "công cụ dựng sẵn trong app" },
          { value: 6, label: "model trong danh mục" },
          { value: 3, label: "nền tảng máy tính" },
          { value: null, text: "< 2s", label: "mở lại phiên cũ" },
        ]}
      />

      {/* ============ FEATURES ============ */}
      <section id="tinh-nang" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">Tính năng</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Không phải một ô chat. Một môi trường làm việc.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted text-pretty">
              Harness lo phần khó: giữ phiên, gọi công cụ, quản lý quyền và chi phí. Bạn lo phần
              việc.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal className="sm:col-span-2">
              <FeatureCard feature={FEATURES[0]} className="h-full">
                <div className="mt-4 grid gap-1.5 rounded-xl border border-border bg-background/70 p-2.5">
                  {SESSION_STEPS.map((step) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={step.title}
                        className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-2.5 py-2"
                      >
                        <span
                          className={
                            step.state === "running"
                              ? "inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary"
                              : "inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-success-bg text-success"
                          }
                        >
                          {step.state === "running" ? (
                            <CircleDot className="fj-pulse size-3" />
                          ) : (
                            <Check className="size-3" />
                          )}
                        </span>
                        <Icon className="size-3.5 shrink-0 text-muted" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{step.title}</p>
                          <p className="truncate text-[11px] text-muted">{step.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </FeatureCard>
            </Reveal>
            <Reveal delay={80} className="sm:col-span-2">
              <FeatureCard feature={FEATURES[1]} className="h-full">
                <ModelSwitcher models={switcherModels} />
              </FeatureCard>
            </Reveal>
            {FEATURES.slice(2).map((feature, index) => (
              <Reveal key={feature.title} delay={index * 70}>
                <FeatureCard feature={feature} className="h-full" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BẮT ĐẦU + TẢI VỀ ============ */}
      <section id="tai-ve" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <Reveal>
              <p className="text-xs font-medium tracking-wide text-primary uppercase">Bắt đầu</p>
              <h2 className="mt-3 max-w-lg text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Từ tải về đến việc đầu tiên, ba bước.
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted text-pretty">
                Không cần dán khoá thủ công, không cần cấu hình tệp. Cài app, đăng nhập một lần,
                rồi mở dự án và giao việc.
              </p>
            </Reveal>

            <ol className="mt-8 space-y-5">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <Reveal delay={index * 90}>
                    <div className="flex gap-3.5">
                      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background font-mono text-xs text-foreground">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="mt-1 max-w-md text-sm leading-6 text-muted text-pretty">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>

            <Reveal delay={120}>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/downloads" variant="primary">
                  <Download className="size-4" />
                  Chọn bản cài
                </ButtonLink>
                <ButtonLink href="/docs#bat-dau" variant="outline">
                  <BookOpen className="size-4" />
                  Đọc hướng dẫn
                </ButtonLink>
              </div>
            </Reveal>
          </div>

          <Reveal delay={100}>
            <div className="rounded-2xl border border-border bg-background p-2">
              <div className="grid gap-2">
                {PLATFORMS.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.os}
                      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong sm:flex-row sm:items-center"
                    >
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-medium">
                          {item.os}
                          {index === 0 ? <Badge tone="brand">Khuyên dùng</Badge> : null}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {item.detail} · {item.size}
                        </p>
                      </div>
                      <ButtonLink
                        href="/downloads"
                        variant={index === 0 ? "primary" : "outline"}
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <Download className="size-3.5" />
                        Tải
                      </ButtonLink>
                    </div>
                  );
                })}
              </div>
              <p className="flex items-center justify-center gap-2 px-3 py-3 text-center text-[11px] text-muted">
                <ShieldCheck className="size-3.5 shrink-0 text-success" />
                Tệp cài được ký số và notarize đầy đủ.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ MODELS ============ */}
      <section id="model" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-wide text-primary uppercase">Danh mục model</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Chọn model theo việc, không theo bảng xếp hạng
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted text-pretty">
                Giá tính theo 1 triệu token. Đổi model giữa phiên không mất ngữ cảnh.
              </p>
            </div>
            <Link
              href="/models"
              className="inline-flex h-8 items-center gap-1 text-sm text-muted transition-colors hover:text-foreground hover:underline"
            >
              Xem tất cả model
              <ChevronRight className="size-4" />
            </Link>
          </Reveal>

          <Reveal delay={80} className="mt-8">
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] text-left">
                  <thead className="bg-surface-subtle text-xs text-muted">
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
                            <span className="whitespace-nowrap">{model.name}</span>
                            {model.featured === 1 ? (
                              <Badge tone="brand" className="hidden sm:inline-flex">
                                Nổi bật
                              </Badge>
                            ) : null}
                          </p>
                          <p className="mt-0.5 max-w-md text-xs text-muted text-pretty">
                            {model.description}
                          </p>
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
          </Reveal>
        </div>
      </section>

      {/* ============ API ============ */}
      <section id="api" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="text-xs font-medium tracking-wide text-primary uppercase">API và khoá</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Một khoá API, dùng cho app và tích hợp
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted text-pretty">
              Tạo khoá trong bảng điều khiển, app tự nhận cấu hình khi đăng nhập. Khoá có tiền tố{" "}
              <span className="font-mono text-foreground">fj_live_</span>, chỉ hiện một lần khi tạo,
              thu hồi được tức thì.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                "App tự nhận base URL, model mặc định và danh mục sau khi đăng nhập",
                "Cổng tương thích OpenAI cho tích hợp nội bộ và công cụ khác",
                "Mỗi khoá có hạn mức riêng và nhật ký sử dụng",
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
          </Reveal>

          <Reveal delay={100}>
            <div className="app-window overflow-hidden rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                <span className="rounded-md bg-surface-subtle px-2 py-1 font-mono text-[11px] text-foreground">
                  GET
                </span>
                <span className="font-mono text-[11px] text-muted">/v1/harness/config</span>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2 py-0.5 text-[10.5px] text-success">
                  <span className="size-1.5 rounded-full bg-success" />
                  200 OK
                </span>
                <CopyButton text={CONFIG_SNIPPET} />
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-6 text-muted">
                <code>{CONFIG_SNIPPET}</code>
              </pre>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal className="text-center">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">Hỏi đáp</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Câu hỏi thường gặp
            </h2>
          </Reveal>
          <Reveal delay={80} className="mt-8">
            <Faq items={FAQ} />
          </Reveal>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative overflow-hidden">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-16 text-center sm:px-10 sm:py-20">
            <div className="landing-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden />
            <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden />
            <div className="landing-grain pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative">
              <Sparkles className="mx-auto size-6 text-primary" />
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Tải app và giao việc <span className="ink-gradient">đầu tiên</span>
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted text-pretty">
                Tạo tài khoản, tải app, đăng nhập bằng trình duyệt. Cả quá trình mất chưa tới hai
                phút.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink href="/downloads" variant="primary" size="lg">
                  <Download className="size-4" />
                  Tải app miễn phí
                </ButtonLink>
                <ButtonLink href={user ? "/dashboard" : "/register"} variant="outline" size="lg">
                  {user ? "Vào bảng điều khiển" : "Tạo tài khoản"}
                  <ArrowRight className="size-4" />
                </ButtonLink>
              </div>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
                <FolderOpen className="size-3.5" />
                Phiên và tệp nằm trên máy bạn
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}