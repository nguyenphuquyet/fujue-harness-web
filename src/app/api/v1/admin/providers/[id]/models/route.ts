import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { fail, guard } from "@/lib/http";
import { getProvider, listUpstreamModels } from "@/lib/providers";

/**
 * Danh mục model của một nguồn, chỉ để đọc. Trang quản trị dùng endpoint này
 * cho bước chọn model trước khi đồng bộ, nên không ghi gì vào DB. Trả 502 khi
 * nguồn không gọi được để hộp chọn hiện đúng lỗi của nhà cung cấp.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    await requireAdmin();
    const { id } = await params;
    const provider = getProvider(id);
    if (!provider) return fail(404, "Không tìm thấy nguồn model.");

    const result = await listUpstreamModels(id);
    if ("error" in result) return fail(result.status, result.error);

    return NextResponse.json({ provider, models: result.models });
  });
}
