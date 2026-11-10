import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logAudit, one, now, run } from "@/lib/db";
import { fail, guard, num, readJson, str } from "@/lib/http";
import { resolveSource } from "@/lib/providers";
import { clearDefaultModelIf, setDefaultModelSlug } from "@/lib/models";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const model = one<{ id: string; name: string; slug: string }>(
      "SELECT id, name, slug FROM models WHERE id = ?",
      id,
    );
    if (!model) return fail(404, "Không tìm thấy model.");

    const body = await readJson(request);
    const fields: string[] = [];
    const values: Array<string | number | null> = [];

    const push = (column: string, value: string | number | null) => {
      fields.push(`${column} = ?`);
      values.push(value);
    };

    if (typeof body.name === "string" && body.name.trim().length >= 2) push("name", body.name.trim());
    if (typeof body.description === "string") push("description", body.description.trim());
    if (typeof body.family === "string") push("family", body.family.trim());
    if (typeof body.vendor === "string") push("vendor", body.vendor.trim());
    if (typeof body.speed === "string") push("speed", body.speed);
    if (typeof body.status === "string") push("status", body.status);
    if (body.context_window !== undefined) push("context_window", num(body.context_window, 131072));
    if (body.max_output !== undefined) push("max_output", num(body.max_output, 16384));
    if (body.input_price !== undefined) push("input_price", num(body.input_price, 0));
    if (body.output_price !== undefined) push("output_price", num(body.output_price, 0));
    if (body.featured !== undefined) push("featured", body.featured ? 1 : 0);

    if (body.provider_id !== undefined || body.external_id !== undefined) {
      const source = resolveSource(body, id);
      if ("error" in source) return fail(source.status, source.error, source.field);
      push("provider_id", source.providerId);
      push("external_id", source.externalId);
      push("synced_at", now());
    }

    if (body.default !== undefined) {
      setDefaultModelSlug(body.default ? model.slug : null);
    }

    if (fields.length === 0 && body.default === undefined)
      return fail(400, "Không có thay đổi nào được gửi lên.");

    if (fields.length > 0) {
      run(`UPDATE models SET ${fields.join(", ")} WHERE id = ?`, ...values, id);
    }
    logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "Cập nhật model",
      target: str(body.name, model.name),
      detail:
        fields.length > 0
          ? fields.map((field) => field.replace(" = ?", "")).join(", ")
          : "model mặc định",
    });
    return NextResponse.json({ ok: true });
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const model = one<{ name: string; slug: string }>("SELECT name, slug FROM models WHERE id = ?", id);
    if (!model) return fail(404, "Không tìm thấy model.");
    run("DELETE FROM models WHERE id = ?", id);
    clearDefaultModelIf(model.slug);
    logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "Xoá model",
      target: model.name,
    });
    return NextResponse.json({ ok: true });
  });
}
