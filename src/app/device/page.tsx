import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { normalizeUserCode } from "@/lib/devices";
import { DeviceApprove } from "./device-approve";

export const metadata: Metadata = {
  title: "Kết nối thiết bị",
};

/**
 * Trang duyệt mã thiết bị. App mở sẵn `?code=ABCD-2345` để người dùng không
 * phải gõ lại mã đang hiện trong terminal.
 */
export default async function DevicePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const user = await currentUser();
  const raw = (await searchParams).code ?? "";
  const digits = normalizeUserCode(raw).slice(0, 8);
  const initialCode = digits.length === 8 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : "";

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div className="hero-glow pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="relative flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <DeviceApprove signedIn={Boolean(user)} initialCode={initialCode} />
        </div>
      </div>
    </div>
  );
}
