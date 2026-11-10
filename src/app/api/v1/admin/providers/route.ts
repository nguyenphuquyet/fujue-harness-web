import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/db";
import { fail, guard, readJson, str } from "@/lib/http";
import { createProvider, listProviders } from "@/lib/providers";

export async function GET() {
  return guard(async () => {
    await requireAdmin();
    return NextResponse.json({ providers: listProviders() });
  });
}

export async function POST(request: Request) {
  return guard(async () => {
    const admin = await requireAdmin();
    const body = await readJson(request);
    const created = createProvider({
      name: str(body.name),
      baseUrl: str(body.baseUrl),
      apiKey: str(body.apiKey),
    });
    if ("error" in created) return fail(422, created.error, created.field);

    logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "Thêm nguồn model",
      target: created.name,
      detail: created.base_url,
    });

    return NextResponse.json({ provider: created }, { status: 201 });
  });
}
