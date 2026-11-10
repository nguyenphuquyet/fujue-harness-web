import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logAudit, one, run } from "@/lib/db";
import { fail, guard, readJson, str } from "@/lib/http";

const ROLES = new Set(["user", "admin"]);
const PLANS = new Set(["free", "pro", "team"]);
const STATUSES = new Set(["active", "suspended"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const target = one<{ id: string; email: string; role: string }>(
      "SELECT id, email, role FROM users WHERE id = ?",
      id,
    );
    if (!target) return fail(404, "Không tìm thấy người dùng.");

    const body = await readJson(request);
    const changes: string[] = [];

    if (typeof body.role === "string") {
      if (!ROLES.has(body.role)) return fail(422, "Vai trò không hợp lệ.", "role");
      if (target.id === admin.id) return fail(409, "Không tự đổi vai trò của chính mình.");
      run("UPDATE users SET role = ? WHERE id = ?", body.role, id);
      changes.push(`vai trò sang ${body.role}`);
    }

    if (typeof body.plan === "string") {
      if (!PLANS.has(body.plan)) return fail(422, "Gói không hợp lệ.", "plan");
      run("UPDATE users SET plan = ? WHERE id = ?", body.plan, id);
      changes.push(`gói sang ${body.plan}`);
    }

    if (typeof body.status === "string") {
      if (!STATUSES.has(body.status)) return fail(422, "Trạng thái không hợp lệ.", "status");
      if (target.id === admin.id) return fail(409, "Không tự khoá tài khoản của chính mình.");
      run("UPDATE users SET status = ? WHERE id = ?", body.status, id);
      if (body.status === "suspended") run("DELETE FROM sessions WHERE user_id = ?", id);
      changes.push(body.status === "suspended" ? "tạm khoá" : "mở khoá");
    }

    if (changes.length === 0) return fail(400, "Không có thay đổi nào được gửi lên.");

    logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "Cập nhật người dùng",
      target: target.email,
      detail: changes.join(", "),
    });

    return NextResponse.json({ ok: true });
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    if (id === admin.id) return fail(409, "Không xoá tài khoản của chính mình.");
    const target = one<{ email: string }>("SELECT email FROM users WHERE id = ?", id);
    if (!target) return fail(404, "Không tìm thấy người dùng.");

    run("DELETE FROM users WHERE id = ?", id);
    logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "Xoá người dùng",
      target: target.email,
    });
    return NextResponse.json({ ok: true });
  });
}
