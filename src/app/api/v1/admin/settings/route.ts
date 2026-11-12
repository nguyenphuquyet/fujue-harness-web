import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { guard, readJson } from "@/lib/http";
import { saveWalletSettings, walletConfig } from "@/lib/wallet";

/** Cấu hình nhận tiền và tỷ giá đang dùng, kèm nguồn của từng nhóm giá trị. */
export async function GET() {
  return guard(async () => {
    await requireAdmin();
    return NextResponse.json({ wallet: walletConfig() });
  });
}

/**
 * Lưu cấu hình nhận tiền. Ghi vào bảng `settings` nên lệnh nạp kế tiếp dùng ngay
 * thông tin mới, không cần khởi động lại tiến trình.
 */
export async function PUT(request: Request) {
  return guard(async () => {
    const admin = await requireAdmin();
    const body = await readJson(request);
    const wallet = saveWalletSettings(
      {
        bin: typeof body.bin === "string" ? body.bin : "",
        bankName: typeof body.bankName === "string" ? body.bankName : "",
        account: typeof body.account === "string" ? body.account : "",
        accountName: typeof body.accountName === "string" ? body.accountName : "",
        vndPerUsd: Number(body.vndPerUsd),
      },
      { id: admin.id, email: admin.email },
    );
    return NextResponse.json({ wallet });
  });
}
