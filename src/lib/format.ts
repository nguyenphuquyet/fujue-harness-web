/**
 * Định dạng số, tiền và thời gian dùng chung cho cả server component lẫn client
 * component. Tách khỏi `usage.ts` để client không kéo theo `node:sqlite`.
 */

export function formatNumber(value: number): string {
  return value.toLocaleString("vi-VN");
}

export function formatCost(value: number): string {
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

export function formatVnd(value: number): string {
  return `${Math.round(value).toLocaleString("vi-VN")} ₫`;
}

export function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return String(value);
}

/**
 * Giá trên 1 triệu token. Model nhập từ nguồn ngoài có thể không kèm giá, khi đó
 * giá trị 0 nghĩa là "chưa niêm yết" chứ không phải miễn phí.
 */
export function formatPricePerMillion(value: number): string {
  if (value === 0) return "—";
  if (value < 0.1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(2)}`;
}

export function formatRelative(timestamp: number | null): string {
  if (!timestamp) return "Chưa có";
  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(timestamp).toLocaleDateString("vi-VN");
}

export function formatDateTime(timestamp: number | null): string {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
