import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/db";
import { fail, guard, readJson, str } from "@/lib/http";
import { clearProviderKey, deleteProvider, getProvider, updateProvider } from "@/lib/providers";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await readJson(request);

    const updated = updateProvider(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      baseUrl: typeof body.baseUrl === "string" ? body.baseUrl : undefined,
      apiKey: typeof body.apiKey === "string" ? body.apiKey : undefined,
      enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
    });
    if (!updated) return fail(404, "Không tìm thấy nguồn model.");
    if ("error" in updated) return fail(422, updated.error, updated.field);
    if (body.clearKey === true) {
      clearProviderKey(id);
    }

    logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "Cập nhật nguồn model",
      target: updated.name,
      detail: updated.base_url,
    });
    return NextResponse.json({ provider: getProvider(id) });
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const before = getProvider(id);
    if (!before) return fail(404, "Không tìm thấy nguồn model.");

    const result = deleteProvider(id);
    logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "Xoá nguồn model",
      target: before.name,
      detail: `${result?.removedModels ?? 0} model đã gỡ`,
    });
    return NextResponse.json({ ok: true, removedModels: result?.removedModels ?? 0 });
  });
}
