import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { guard } from "@/lib/http";
import { pendingTopups } from "@/lib/wallet";

/** Hàng đợi lệnh nạp để trang quản trị làm mới mà không phải tải lại cả trang. */
export async function GET() {
  return guard(async () => {
    await requireAdmin();
    const topups = pendingTopups().map((row) => ({
      id: row.id,
      code: row.code,
      amount_vnd: row.amount_vnd,
      created_at: row.created_at,
      user_name: row.user_name,
      user_email: row.user_email,
    }));
    return NextResponse.json({ topups });
  });
}
