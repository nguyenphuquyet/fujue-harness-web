import { NextResponse } from "next/server";
import { registerUser, sessionCookie } from "@/lib/auth";
import { fail, readJson, str } from "@/lib/http";

export async function POST(request: Request) {
  const body = await readJson(request);
  const result = registerUser({
    name: str(body.name),
    email: str(body.email),
    password: str(body.password),
    userAgent: request.headers.get("user-agent"),
    ip: request.headers.get("x-forwarded-for"),
  });

  if (!result.ok) return fail(result.status, result.message, result.field);

  const response = NextResponse.json({ user: result.user }, { status: 201 });
  response.cookies.set(sessionCookie(result.token));
  return response;
}
