import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { bankInfo, createTopup } from "@/lib/wallet";
import { ApiError } from "@/lib/errors";
import { guard, readJson } from "@/lib/http";

/**
 * Tạo lệnh nạp tiền mới cho tài khoản đang đăng nhập. Không có cổng thanh toán:
 * lệnh chỉ ghi nhận số tiền cần chuyển, quản trị viên đối chiếu sao kê rồi xác
 * nhận ở trang Người dùng.
 */
export async function POST(request: Request) {
  return guard(async () => {
    const user = await requireUser();
    const bank = bankInfo();
    if (!bank) {
      throw new ApiError(
        503,
        "Chưa cấu hình tài khoản nhận tiền. Liên hệ quản trị viên để bật nạp tiền.",
      );
    }

    const body = await readJson(request);
    const topup = createTopup(user.id, Number(body.amount_vnd), typeof body.note === "string" ? body.note : null);

    return NextResponse.json({
      topup: {
        id: topup.id,
        code: topup.code,
        amount_vnd: topup.amount_vnd,
        status: topup.status,
        created_at: topup.created_at,
        expires_at: topup.expires_at,
      },
      bank,
    });
  });
}
