/**
 * API base mà harness dùng để gọi model. Mặc định trỏ về chính site
 * (`<origin>/api/v1`), nơi cổng `/api/v1/chat/completions` chuyển tiếp sang nguồn
 * model và giữ khoá của nguồn ở phía máy chủ. Đặt `FUJUE_GATEWAY_URL` khi muốn
 * tách cổng model ra một miền riêng.
 */
export function gatewayBaseUrl(origin: string): string {
  const configured = process.env.FUJUE_GATEWAY_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return `${origin.replace(/\/+$/, "")}/api/v1`;
}

/**
 * Gốc công khai của request hiện tại. Sau proxy, `x-forwarded-*` mới là địa chỉ
 * người dùng thấy, nên chúng được ưu tiên hơn URL nội bộ.
 *
 * @param request Request đang xử lý.
 * @returns Gốc dạng `https://host`, không có dấu `/` ở cuối.
 */
export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    url.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    url.host;
  return `${proto}://${host}`;
}
