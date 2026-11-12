import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logAudit, one } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { formatVnd } from "@/lib/format";
import { guard, readJson } from "@/lib/http";
import { creditWallet } from "@/lib/wallet";
import { MAX_TOPUP_VND } from "@/lib/billing";

/**
 * Cộng hoặc trừ tiền tay vào ví một tài khoản. Dùng khi khách chuyển khoản
 * không tạo lệnh, hoặc khi cần hoàn tiền một lượt gọi lỗi.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const target = one<{ id: string; email: string }>("SELECT id, email FROM users WHERE id = ?", id);
    if (!target) throw new ApiError(404, "Không tìm thấy người dùng.");

    const body = await readJson(request);
    const amount = Math.round(Number(body.amount_vnd));
    if (!Number.isFinite(amount) || amount === 0) {
      throw new ApiError(422, "Số tiền điều chỉnh phải khác 0.", "amount_vnd");
    }
    if (Math.abs(amount) > MAX_TOPUP_VND) {
      throw new ApiError(422, `Một lần điều chỉnh tối đa ${formatVnd(MAX_TOPUP_VND)}.`, "amount_vnd");
    }

    const note = typeof body.note === "string" ? body.note.trim() : "";
    const balance = creditWallet(target.id, amount, "manual", note || "Quản trị viên điều chỉnh số dư");
    logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: amount > 0 ? "Cộng tiền vào ví" : "Trừ tiền khỏi ví",
      target: target.email,
      detail: `${formatVnd(amount)}${note ? ` · ${note}` : ""}`,
    });

    return NextResponse.json({ ok: true, balance_vnd: balance });
  });
}
