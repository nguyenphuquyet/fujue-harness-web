import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logAudit, newId, now, one, run } from "@/lib/db";
import { fail, guard, num, readJson, str } from "@/lib/http";
import { listModels } from "@/lib/models";
import { resolveSource } from "@/lib/providers";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,40}$/;

export async function GET() {
  return guard(async () => {
    await requireAdmin();
    return NextResponse.json({ models: listModels() });
  });
}

export async function POST(request: Request) {
  return guard(async () => {
    const admin = await requireAdmin();
    const body = await readJson(request);

    const slug = str(body.slug).trim().toLowerCase();
    const name = str(body.name).trim();
    if (!SLUG_RE.test(slug)) return fail(422, "Mã model chỉ gồm chữ thường, số và dấu gạch ngang.", "slug");
    if (name.length < 2) return fail(422, "Tên model cần ít nhất 2 ký tự.", "name");
    if (one<{ id: string }>("SELECT id FROM models WHERE slug = ?", slug))
      return fail(409, "Mã model này đã tồn tại.", "slug");

    const source = resolveSource(body);
    if ("error" in source) return fail(source.status, source.error, source.field);

    const id = newId("mdl");
    run(
      `INSERT INTO models (id, slug, name, family, vendor, context_window, max_output, input_price,
        output_price, speed, status, description, featured, released_at, provider_id, external_id, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      slug,
      name,
      str(body.family, "Tuỳ chỉnh").trim(),
      str(body.vendor, "Tuỳ chỉnh").trim(),
      num(body.context_window, 131072),
      num(body.max_output, 16384),
      num(body.input_price, 0),
      num(body.output_price, 0),
      str(body.speed, "balanced"),
      str(body.status, "beta"),
      str(body.description).trim(),
      body.featured ? 1 : 0,
      now(),
      source.providerId,
      source.externalId,
      source.providerId ? now() : null,
    );

    logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "Tạo model",
      target: name,
      detail: slug,
    });

    return NextResponse.json({ id }, { status: 201 });
  });
}
