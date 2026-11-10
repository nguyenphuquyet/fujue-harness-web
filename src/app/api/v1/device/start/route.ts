import { NextResponse } from "next/server";
import { readJson, str } from "@/lib/http";
import { startDevice } from "@/lib/devices";

/**
 * App gọi endpoint này để xin mã thiết bị. Không cần xác thực: mã chỉ có giá trị
 * khi một người đã đăng nhập duyệt nó trên web.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  const label = str(body.label).trim().slice(0, 60) || null;
  return NextResponse.json(startDevice(label), { status: 201 });
}
