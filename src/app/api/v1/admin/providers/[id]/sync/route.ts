import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/db";
import { fail, guard, readJson } from "@/lib/http";
import { getProvider, syncProvider } from "@/lib/providers";

/**
 * Đồng bộ đúng những model quản trị viên đã chọn từ nguồn ngoài. Body
 * `{ external_ids: string[] }`; bỏ trống thì giữ nguyên lựa chọn hiện tại và
 * chỉ làm mới giá, ngữ cảnh. Trả 502 khi nguồn không gọi được để trang quản trị
 * hiện đúng lỗi của nhà cung cấp.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const provider = getProvider(id);
    if (!provider) return fail(404, "Không tìm thấy nguồn model.");

    const body = await readJson(request);
    const selected = Array.isArray(body.external_ids)
      ? body.external_ids.filter((value): value is string => typeof value === "string")
      : null;

    const result = await syncProvider(id, selected);
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
