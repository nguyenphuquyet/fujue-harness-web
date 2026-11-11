import type { Metadata } from "next";
import Link from "next/link";
import {
  Apple,
  Check,
  ChevronRight,
  Download,
  Laptop,
  Monitor,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
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
    note: "Tự cập nhật khi có bản mới",
  },
  {
    icon: Apple,
    os: "macOS",
    requirement: "macOS 13 trở lên · Universal (Apple Silicon, Intel)",
    file: "FuJueHarness-0.9.2-universal.dmg",
    size: "142 MB",
    sha: "8b02 31cf 6ae4 90dd",
    installer: "DMG, ký số và notarize",
    note: "Kéo vào Applications để cài",
  },
  {
    icon: Laptop,
    os: "Linux",
    requirement: "Ubuntu 22.04+, Fedora 40+, Debian 12+ · x86_64",
    file: "FuJueHarness-0.9.2-x86_64.AppImage",
    size: "134 MB",
    sha: "c57a 0e13 4b8f 22a6",
    installer: "AppImage, kèm gói .deb",
    note: "Chạy trực tiếp, không cần cài",
  },
];

export default function DownloadsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <nav className="flex items-center gap-1.5 text-xs text-muted" aria-label="Đường dẫn">
        <Link href="/" className="hover:text-foreground">
          Trang chủ
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">Tải về</span>
      </nav>

      <header className="mt-5 max-w-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tải FuJue Harness</h1>
          <Badge tone="warning">Bản xem trước</Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">
          Phiên bản 0.9.2 cho máy tính. Cài xong, mở app và chọn “Đăng nhập bằng trình duyệt” —
          app mở trang kết nối thiết bị, bạn nhập mã 8 ký tự là xong.
        </p>
      </header>

      <div className="mt-8 grid gap-3 lg:grid-cols-3">
        {BUILDS.map((build, index) => {
          const Icon = build.icon;
          return (
            <article
              key={build.os}
              className={
                index === 0
                  ? "flex flex-col rounded-2xl border border-primary/35 bg-surface p-5 ring-1 ring-primary/10"
                  : "flex flex-col rounded-2xl border border-border bg-surface p-5"
              }
            >
              <div className="flex items-start justify-between">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-surface-subtle text-foreground">
                  <Icon className="size-5" />
                </span>
                {index === 0 ? <Badge tone="brand">Khuyên dùng</Badge> : null}
              </div>
              <h2 className="mt-4 text-base font-medium">FuJue Harness cho {build.os}</h2>
              <p className="mt-1 text-xs leading-5 text-muted">{build.requirement}</p>

              <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Tệp</dt>
                  <dd className="truncate font-mono text-foreground">{build.file}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Dung lượng</dt>
                  <dd className="text-foreground">{build.size}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">SHA-256</dt>
                  <dd className="font-mono text-foreground">{build.sha}…</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Định dạng</dt>
                  <dd className="truncate text-right text-foreground">{build.installer}</dd>
                </div>
              </dl>

              <div className="mt-5">
                <ButtonLink
                  href="#"
                  variant={index === 0 ? "primary" : "outline"}
                  className="w-full"
                >
                  <Download className="size-4" />
                  Tải cho {build.os}
                </ButtonLink>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted">
                  <RefreshCw className="size-3" />
                  {build.note}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-success" />
            <h2 className="text-base font-medium">Trước khi cài</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {[
              "Tệp cài được ký số; Windows SmartScreen và Gatekeeper chỉ hỏi một lần.",
              "App cần quyền đọc/ghi trong thư mục dự án bạn mở. Bạn có thể giới hạn từng thư mục.",
              "Khoá API lưu trong keychain của hệ điều hành, không nằm trong tệp cấu hình.",
              "Gỡ app không xoá phiên; xoá thêm thư mục dữ liệu nếu muốn dọn sạch.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm leading-6 text-muted">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-base font-medium">Kết nối app với tài khoản</h2>
          <ol className="mt-4 space-y-4">
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
              <li key={item.step} className="flex gap-3">
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-light font-mono text-xs text-primary">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5">
            <ButtonLink href="/device" variant="outline" size="sm">
              Mở trang kết nối thiết bị
              <ChevronRight className="size-3.5" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-sm font-medium">Cần hướng dẫn chi tiết?</h2>
          <p className="mt-1 text-xs text-muted">
            Xem cách làm quen giao diện, quản lý phiên và duyệt quyền công cụ.
          </p>
        </div>
        <ButtonLink href="/docs" variant="outline" size="sm">
          Mở hướng dẫn sử dụng
          <ChevronRight className="size-3.5" />
        </ButtonLink>
      </section>
    </div>
  );
}
