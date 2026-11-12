import { NextResponse } from "next/server";
import { ApiError } from "./errors";

export function json(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function fail(status: number, message: string, field?: string): NextResponse {
  return NextResponse.json({ error: message, field }, { status });
}

/**
 * Bọc handler để lỗi xác thực trả đúng mã và lỗi lạ không rò stack ra client.
 */
export async function guard<T>(handler: () => Promise<T>): Promise<T | NextResponse> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) return fail(error.status, error.message, error.field);
    console.error("[fujue-api]", error);
    return fail(500, "Máy chủ gặp lỗi. Thử lại sau ít phút.");
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) return {};
    return body as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function num(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return fallback;
}
