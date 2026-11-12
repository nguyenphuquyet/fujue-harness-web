import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { guard, readJson } from "@/lib/http";
import { confirmTopup, rejectTopup } from "@/lib/wallet";

/**
 * Quản trị viên xác nhận hoặc từ chối một lệnh nạp. Xác nhận là thao tác duy
 * nhất cộng tiền vào ví, nên chỉ chạy sau khi đã thấy tiền về trong sao kê.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await readJson(request);
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "confirm") {
      const balance = confirmTopup(id, { id: admin.id, email: admin.email });
      return NextResponse.json({ ok: true, status: "paid", balance_vnd: balance });
    }
    if (action === "reject") {
      rejectTopup(id, { id: admin.id, email: admin.email }, typeof body.note === "string" ? body.note : undefined);
      return NextResponse.json({ ok: true, status: "rejected" });
    }
    throw new ApiError(422, 'Thao tác không hợp lệ. Dùng "confirm" hoặc "reject".', "action");
  });
}
