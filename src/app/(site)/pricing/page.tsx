import type { Metadata } from "next";
import Link from "next/link";
import { Check, ChevronRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatVnd } from "@/lib/models";

export const metadata: Metadata = {
  title: "Bảng giá",
  description: "Ba gói FuJue Harness: Miễn phí, Pro và Đội nhóm.",
};

const PLANS = [
  {
    name: "Miễn phí",
    price: 0,
    unit: "/tháng",
    note: "Không cần thẻ, dùng bao lâu cũng được",
    cta: "Bắt đầu miễn phí",
    href: "/register",
    featured: false,
    features: [
      { label: "Không giới hạn phiên trên máy", included: true },
      { label: "500.000 token mỗi tháng qua khoá FuJue", included: true },
      { label: "Model nhanh (Coder Lite)", included: true },
      { label: "2 khoá API", included: true },
      { label: "Nhật ký sử dụng 7 ngày", included: true },
      { label: "Model suy luận sâu", included: false },
      { label: "Chạy nền nhiều job song song", included: false },
    ],
  },
  {
    name: "Pro",
    price: 249000,
    unit: "/tháng",
    note: "Cho một người dùng chuyên nghiệp",
    cta: "Nâng lên Pro",
    href: "/register",
    featured: true,
    features: [
      { label: "Không giới hạn phiên trên máy", included: true },
      { label: "20 triệu token mỗi tháng qua khoá FuJue", included: true },
      { label: "Toàn bộ danh mục model", included: true },
      { label: "10 khoá API", included: true },
      { label: "Nhật ký sử dụng 12 tháng", included: true },
      { label: "Ưu tiên hàng đợi khi cao điểm", included: true },
      { label: "Chạy nền 10 job song song", included: true },
    ],
  },
  {
    name: "Đội nhóm",
    price: 1190000,
    unit: "/tháng",
    note: "Tính cho 5 thành viên, thêm người 190.000 ₫",
    cta: "Liên hệ tư vấn",
    href: "/docs#lien-he",
    featured: false,
    features: [
      { label: "Mọi quyền lợi của gói Pro", included: true },
      { label: "100 triệu token dùng chung mỗi tháng", included: true },
      { label: "Phân quyền quản trị và thành viên", included: true },
      { label: "Nhật ký thao tác toàn tổ chức", included: true },
      { label: "Khoá API theo từng máy, thu hồi tức thì", included: true },
      { label: "Trang quản trị riêng", included: true },
      { label: "Hợp đồng và hoá đơn theo yêu cầu", included: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <nav className="flex items-center gap-1.5 text-xs text-muted" aria-label="Đường dẫn">
        <Link href="/" className="hover:text-foreground">
          Trang chủ
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">Bảng giá</span>
      </nav>

      <header className="mx-auto mt-6 max-w-2xl text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Trả cho token bạn dùng, không trả cho chỗ ngồi
        </h1>
        <p className="mx-auto mt-3 max-w-[55ch] text-sm leading-6 text-muted sm:text-base/7">
          Ứng dụng trên máy luôn miễn phí. Gói chỉ quyết định hạn mức gọi model qua khoá FuJue và
          các tính năng cho đội nhóm.
        </p>
      </header>

      <div className="mx-auto mt-8 grid grid-cols-1 gap-4 lg:mt-12 lg:max-w-none lg:grid-cols-3">
        {PLANS.map((plan) => (
          <article
            key={plan.name}
            className={`row-span-7 grid grid-rows-subgrid gap-y-0 rounded-2xl border py-7 *:px-6 ${
              plan.featured
                ? "border-primary/60 bg-surface ring-1 ring-primary/20"
                : "border-border bg-surface"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium">{plan.name}</h2>
              {plan.featured ? <Badge tone="brand">Phổ biến nhất</Badge> : null}
            </div>

            <p className="text-sm text-muted">{plan.note}</p>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-tight">
                {plan.price === 0 ? "0 ₫" : formatVnd(plan.price)}
              </span>
              <span className="text-sm text-muted">{plan.unit}</span>
            </div>

            <p className="mt-1 text-xs text-muted">
              {plan.price === 0 ? "Không giới hạn thời gian" : "Thanh toán theo tháng, huỷ bất cứ lúc nào"}
            </p>

            <p className="mt-6 border-t border-border-strong pt-4 text-xs font-medium tracking-wide text-muted uppercase">
              Bao gồm
            </p>

            <ul className="mt-4 space-y-2.5">
              {plan.features.map((feature) => (
                <li
                  key={feature.label}
                  className={`flex items-start gap-2 text-sm ${feature.included ? "text-foreground" : "text-muted/60"}`}
                >
                  {feature.included ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <Minus className="mt-0.5 size-4 shrink-0 text-muted/50" />
                  )}
                  {feature.label}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-6">
              <ButtonLink
                href={plan.href}
                variant={plan.featured ? "primary" : "outline"}
                className="w-full"
              >
                {plan.cta}
              </ButtonLink>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        Giá đã gồm VAT. Dùng khoá DeepSeek của riêng bạn thì không mất phí nền tảng — chỉ tính hạn
        mức phiên trên máy.
      </p>
    </div>
  );
}
