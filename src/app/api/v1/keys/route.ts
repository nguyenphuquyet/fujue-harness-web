import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/db";
import { fail, guard, readJson, str } from "@/lib/http";
import { createKey, listKeys } from "@/lib/keys";

export async function GET() {
  return guard(async () => {
    const user = await requireUser();
    return NextResponse.json({
      keys: listKeys(user.id).map((key) => ({
        id: key.id,
        name: key.name,
        prefix: key.prefix,
        created_at: key.created_at,
        last_used_at: key.last_used_at,
        revoked_at: key.revoked_at,
        requests: key.requests,
      })),
    });
  });
}

export async function POST(request: Request) {
  return guard(async () => {
    const user = await requireUser();
    const body = await readJson(request);
    const created = createKey(user.id, str(body.name));
    if ("error" in created) return fail(created.status, created.error, "name");

    logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "Tạo khoá API",
      target: created.name,
      detail: `${created.prefix}••••`,
    });

    return NextResponse.json({ key: created }, { status: 201 });
  });
}
