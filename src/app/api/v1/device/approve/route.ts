import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/db";
import { approveDevice } from "@/lib/devices";
import { fail, guard, readJson, str } from "@/lib/http";

export async function POST(request: Request) {
  return guard(async () => {
    const user = await requireUser();
    const body = await readJson(request);
    const result = approveDevice(str(body.user_code), user.id);
    if (!result.ok) return fail(400, result.message, "user_code");

    logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "Duyệt thiết bị",
      target: str(body.user_code).toUpperCase(),
    });
    return NextResponse.json({ ok: true });
  });
}
