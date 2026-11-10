import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FuJue Harness — Harness agent cho đội ngũ dùng DeepSeek",
    template: "%s · FuJue Harness",
  },
  description:
    "FuJue Harness gom model, công cụ, terminal và phiên làm việc vào một chỗ. Tải về cho Windows, macOS, Linux hoặc gọi qua API.",
  metadataBase: new URL("https://fujue.dev"),
  openGraph: {
    title: "FuJue Harness",
    description:
      "Harness agent cho đội ngũ dùng DeepSeek mỗi ngày. Model, công cụ, terminal và phiên làm việc trong một chỗ.",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans text-sm">{children}</body>
    </html>
  );
}
