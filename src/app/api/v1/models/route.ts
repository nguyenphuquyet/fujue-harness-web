import { NextResponse } from "next/server";
import { listPublicModels } from "@/lib/models";

/**
 * Danh mục model công khai, kèm nguồn của từng model để app biết gọi thẳng API
 * nào. Không cần xác thực để app hiển thị bảng chọn model trước khi đăng nhập.
 */
export async function GET() {
  return NextResponse.json({ object: "list", data: listPublicModels() });
}
