import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { logAudit, one } from "@/lib/db";
import { fail, guard } from "@/lib/http";
import { revokeKey } from "@/lib/keys";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const user = await requireUser();
    const { id } = await params;
    const row = one<{ name: string }>("SELECT name FROM api_keys WHERE id = ?", id);
    const revoked = revokeKey(user.id, id, user.role === "admin");
    if (!revoked) return fail(404, "Không tìm thấy khoá đang hoạt động với mã này.");

    logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "Thu hồi khoá API",
      target: row?.name ?? id,
    });
    return NextResponse.json({ ok: true });
  });
}
