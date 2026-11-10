import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

/**
 * Trạng thái môi trường cho app desktop kiểm tra trước khi mở màn đăng nhập.
 * Trả 200 kể cả khi chưa đăng nhập để app hiện đúng nút.
 */
export async function GET() {
  const user = await currentUser();
  return NextResponse.json({
    service: "fujue-harness-web",
    version: "0.9.2",
    auth: {
      signedIn: Boolean(user),
      user: user ? { id: user.id, email: user.email, name: user.name, plan: user.plan } : null,
    },
    endpoints: {
      device_start: "/api/v1/device/start",
      device_approve: "/api/v1/device/approve",
      device_token: "/api/v1/device/token",
      models: "/api/v1/models",
      keys: "/api/v1/keys",
    },
  });
}
