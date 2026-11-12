import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { guard } from "@/lib/http";
import { listAdminUsers } from "@/lib/admin";

export type { AdminUserRow } from "@/lib/admin";

export async function GET(request: Request) {
  return guard(async () => {
    await requireAdmin();
    const search = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    return NextResponse.json({ users: listAdminUsers(search) });
  });
}
