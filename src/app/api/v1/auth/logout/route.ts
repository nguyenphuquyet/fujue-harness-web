import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { run } from "@/lib/db";
import { revokedSessionCookie, SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    run("DELETE FROM sessions WHERE token_hash = ?", createHash("sha256").update(token).digest("hex"));
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(revokedSessionCookie());
  return response;
}
