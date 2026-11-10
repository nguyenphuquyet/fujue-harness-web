import { NextResponse } from "next/server";
import { gatewayBaseUrl, requestOrigin } from "@/lib/api-config";
import { guard } from "@/lib/http";
import { authenticateKey } from "@/lib/keys";
import { getDefaultModelSlug, listPublicModels } from "@/lib/models";

/**
 * Cấu hình khởi động cho harness: API base, model mặc định và toàn bộ danh mục
 * kèm nguồn. Harness gọi endpoint này một lần khi đăng nhập để dựng cấu hình
 * model thay vì chép tay từng model.
 *
 * Xác thực bằng khoá API của người dùng (`Authorization: Bearer fj_live_…`).
 */
export async function GET(request: Request) {
  return guard(async () => {
    const header = request.headers.get("authorization") ?? "";
    const raw = header.replace(/^Bearer\s+/i, "");
    if (raw.trim() === "") {
      return NextResponse.json(
        { error: "Thiếu khoá API. Gửi header Authorization: Bearer fj_live_…" },
        { status: 401 },
      );
    }

    const owner = authenticateKey(raw);
    if (!owner) {
      return NextResponse.json(
        { error: "Khoá API không hợp lệ, đã thu hồi hoặc tài khoản đang bị tạm ngưng." },
        { status: 401 },
      );
    }

    const models = listPublicModels();
    return NextResponse.json({
      object: "harness.config",
      version: 1,
      api: {
        base_url: gatewayBaseUrl(requestOrigin(request)),
        auth: "Authorization: Bearer <khoá API của bạn>",
      },
      account: { email: owner.email, name: owner.name, plan: owner.plan },
      default_model: getDefaultModelSlug(),
      models,
    });
  });
}
