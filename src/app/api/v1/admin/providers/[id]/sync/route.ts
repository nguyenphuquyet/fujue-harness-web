import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/db";
import { fail, guard } from "@/lib/http";
import { getProvider, syncProvider } from "@/lib/providers";

/**
 * Đồng bộ danh mục từ nguồn ngoài. Trả 502 khi nguồn không gọi được để trang
 * quản trị hiện đúng lỗi của nhà cung cấp.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const provider = getProvider(id);
    if (!provider) return fail(404, "Không tìm thấy nguồn model.");

    const result = await syncProvider(id);
    if ("error" in result) return fail(result.status, result.error);

    logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "Đồng bộ model",
      target: provider.name,
      detail: `+${result.added} mới · ${result.updated} cập nhật · -${result.removed} xoá`,
    });

    return NextResponse.json({ result, provider: getProvider(id) });
  });
}
