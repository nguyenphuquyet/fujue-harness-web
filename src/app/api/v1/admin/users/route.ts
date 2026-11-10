import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { all } from "@/lib/db";
import { guard } from "@/lib/http";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  status: string;
  created_at: number;
  last_login_at: number | null;
  keys: number;
  sessions: number;
};

export async function GET(request: Request) {
  return guard(async () => {
    await requireAdmin();
    const search = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    const like = `%${search}%`;
    const users = all<AdminUserRow>(
      `SELECT u.id, u.email, u.name, u.role, u.plan, u.status, u.created_at, u.last_login_at,
              (SELECT COUNT(*) FROM api_keys k WHERE k.user_id = u.id AND k.revoked_at IS NULL) AS keys,
              (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id) AS sessions
         FROM users u
        WHERE (? = '' OR u.email LIKE ? OR u.name LIKE ?)
        ORDER BY u.created_at DESC`,
      search,
      like,
      like,
    );
    return NextResponse.json({ users });
  });
}
