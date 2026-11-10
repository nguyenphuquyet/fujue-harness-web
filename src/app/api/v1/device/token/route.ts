import { NextResponse } from "next/server";
import { exchangeDeviceToken } from "@/lib/devices";
import { fail, readJson, str } from "@/lib/http";

/**
 * App đổi device_code lấy khoá API. Trả 428 khi mã chưa được duyệt để app biết
 * tiếp tục chờ; 409 khi mã đã dùng.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  const result = exchangeDeviceToken(str(body.device_code));
  if (!result.ok) return fail(result.status, result.error);
  return NextResponse.json({ api_key: result.api_key, user: result.user });
}
