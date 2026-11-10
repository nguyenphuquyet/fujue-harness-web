import type { Metadata } from "next";
import Link from "next/link";
import { Apple, Check, ChevronRight, Download, Monitor, ShieldCheck, Terminal } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Tải về",
  description: "Tải FuJue Harness cho Windows, macOS và Linux. Bản xem trước 0.9.2.",
};

const BUILDS = [
  {
    icon: Monitor,
    os: "Windows",
    requirement: "Windows 10 trở lên · 64-bit (x64, ARM64)",
    file: "FuJueHarness-0.9.2-win-x64.exe",
    size: "128 MB",
    sha: "4f1c 9ab2 7d30 e5a8",
    installer: "Trình cài NSIS, ký số",
  },
  {
    icon: Apple,
    os: "macOS",
    requirement: "macOS 13 trở lên · Universal (Apple Silicon, Intel)",
    file: "FuJueHarness-0.9.2-universal.dmg",
    size: "142 MB",
    sha: "8b02 31cf 6ae4 90dd",
    installer: "DMG, ký số và notarize",
  },
  {
    icon: Terminal,
    os: "Linux",
    requirement: "Ubuntu 22.04+, Fedora 40+, Debian 12+ · x86_64",
    file: "FuJueHarness-0.9.2-x86_64.AppImage",
    size: "134 MB",
    sha: "c57a 0e13 4b8f 22a6",
    installer: "AppImage, kèm gói .deb",
  },
];

export default function DownloadsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <nav className="flex items-center gap-1.5 text-xs text-muted" aria-label="Đường dẫn">
        <Link href="/" className="hover:text-foreground">
          Trang chủ
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">Tải về</span>
      </nav>

      <header className="mt-4 max-w-2xl">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Tải FuJue Harness</h1>
          <Badge tone="warning">Bản xem trước</Badge>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted">
          Phiên bản 0.9.2. Cài xong, mở app và chọn “Đăng nhập bằng trình duyệt” — app sẽ mở trang
          kết nối thiết bị trên site này, bạn nhập mã 8 ký tự là xong.
        </p>
      </header>

      <div className="mt-8 grid gap-3 lg:grid-cols-3">
        {BUILDS.map((build, index) => {
          const Icon = build.icon;
          return (
            <article
              key={build.os}
              className="flex flex-col rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-background">
                  <Icon className="size-4" />
                </span>
                {index === 0 ? <Badge tone="brand">Khuyên dùng</Badge> : null}
              </div>
              <h2 className="mt-4 text-base font-medium">{build.os}</h2>
              <p className="mt-1 text-xs leading-5 text-muted">{build.requirement}</p>

              <dl className="mt-4 space-y-2 border-t border-border pt-4 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Tệp</dt>
                  <dd className="truncate font-mono">{build.file}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Dung lượng</dt>
                  <dd>{build.size}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">SHA-256</dt>
                  <dd className="font-mono">{build.sha}…</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Định dạng</dt>
                  <dd className="truncate text-right">{build.installer}</dd>
                </div>
              </dl>

              <ButtonLink
                href="#"
                variant={index === 0 ? "primary" : "outline"}
                className="mt-5 w-full"
              >
                <Download className="size-4" />
                Tải cho {build.os}
              </ButtonLink>
            </article>
          );
        })}
      </div>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-base font-medium">Cài bằng dòng lệnh</h2>
          <p className="mt-1 text-xs text-muted">
            Dùng cho CI, máy chủ không giao diện, hoặc khi bạn muốn quản lý phiên bản bằng trình
            quản lý gói.
          </p>
          <div className="mt-4 space-y-2">
            {[
              { label: "npm", cmd: "npm i -g @fujue/harness && fujue login" },
              { label: "winget", cmd: "winget install Fujue.Harness" },
              { label: "brew", cmd: "brew install --cask fujue-harness" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2"
              >
                <span className="w-14 shrink-0 font-mono text-[11px] text-muted">{row.label}</span>
                <code className="overflow-x-auto font-mono text-xs text-foreground">{row.cmd}</code>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 text-base font-medium">
            <ShieldCheck className="size-4 text-success" />
            Trước khi cài
          </h2>
          <ul className="mt-3 space-y-2.5">
            {[
              "Tệp cài được ký số; Windows SmartScreen và Gatekeeper chỉ hỏi một lần.",
              "App cần quyền đọc/ghi trong thư mục dự án bạn mở.",
              "Khoá API lưu trong keychain của hệ điều hành, không nằm trong tệp cấu hình.",
              "Gỡ app không xoá phiên; xoá thêm ~/.fujue nếu muốn dọn sạch.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-xs leading-5 text-muted">
                <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-base font-medium">Kết nối app với tài khoản</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Mở app, chọn Đăng nhập",
              body: "App hiện mã 8 ký tự và mở sẵn trang /device trên trình duyệt.",
            },
            {
              step: "2",
              title: "Nhập mã trên trang này",
              body: "Đăng nhập tài khoản FuJue rồi xác nhận mã thiết bị.",
            },
            {
              step: "3",
              title: "App nhận khoá riêng",
              body: "Mỗi thiết bị một khoá API riêng, thu hồi được từ bảng điều khiển.",
            },
          ].map((item) => (
            <li key={item.step} className="rounded-xl border border-border bg-background p-4">
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary-light font-mono text-xs text-primary">
                {item.step}
              </span>
              <p className="mt-3 text-sm font-medium">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{item.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-5">
          <ButtonLink href="/device" variant="outline" size="sm">
            Mở trang kết nối thiết bị
            <ChevronRight className="size-3.5" />
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
