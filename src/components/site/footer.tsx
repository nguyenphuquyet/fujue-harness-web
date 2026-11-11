import Link from "next/link";
import { Apple, Download, Monitor } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Dot } from "@/components/ui/badge";

const COLUMNS = [
  {
    title: "Sản phẩm",
    links: [
      { href: "/downloads", label: "Tải app desktop" },
      { href: "/models", label: "Danh mục model" },
      { href: "/pricing", label: "Bảng giá" },
      { href: "/#tinh-nang", label: "Tính năng" },
      { href: "/dashboard", label: "Bảng điều khiển" },
    ],
  },
  {
    title: "Tài nguyên",
    links: [
      { href: "/docs", label: "Bắt đầu với app" },
      { href: "/docs#giao-dien", label: "Khám phá giao diện" },
      { href: "/docs#api", label: "Tham chiếu API" },
      { href: "/docs#thiet-bi", label: "Kết nối thiết bị" },
      { href: "/docs#faq", label: "Câu hỏi thường gặp" },
    ],
  },
  {
    title: "Tài khoản",
    links: [
      { href: "/login", label: "Đăng nhập" },
      { href: "/register", label: "Tạo tài khoản" },
      { href: "/dashboard/keys", label: "Quản lý khoá API" },
      { href: "/device", label: "Kết nối thiết bị" },
      { href: "/admin", label: "Trang quản trị" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <div>
              <p className="text-sm font-semibold tracking-tight">FuJue Harness</p>
              <p className="text-xs text-muted">Phiên bản 0.9.2 · Bản xem trước</p>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
            App desktop giao việc cho agent ngay trên máy bạn: model, công cụ và phiên làm việc
            trong một cửa sổ.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
            <Dot tone="success" />
            <span className="text-xs text-muted">Mọi hệ thống đang hoạt động</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {[
              { icon: Monitor, label: "Windows" },
              { icon: Apple, label: "macOS" },
              { icon: Download, label: "Linux" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href="/downloads"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] text-muted transition-colors hover:text-foreground"
                >
                  <Icon className="size-3" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-xs font-medium tracking-wide text-muted uppercase">{column.title}</p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} FuJue Harness. Dựng trên DeepSeek Harness.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span>Điều khoản</span>
            <span>Quyền riêng tư</span>
            <span>Trạng thái</span>
            <span className="text-foreground">Tiếng Việt</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
