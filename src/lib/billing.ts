/**
 * Cấu hình ví chạy được ở cả server lẫn client: mệnh giá, hạn mức và cách dựng
 * ảnh VietQR. Phần đọc/ghi số dư nằm ở `wallet.ts` vì cần cơ sở dữ liệu.
 */

export const MIN_TOPUP_VND = 20_000;
export const MAX_TOPUP_VND = 50_000_000;

/** Mệnh giá gợi ý trên trang nạp tiền. */
export const TOPUP_DENOMINATIONS = [50_000, 100_000, 200_000, 500_000] as const;

/** Lệnh nạp hết hạn sau 15 phút, khớp ghi chú trên mã QR. */
export const TOPUP_TTL_MS = 15 * 60 * 1000;

/** Tỷ giá mặc định khi chưa cấu hình ở trang quản trị lẫn biến môi trường. */
export const DEFAULT_VND_PER_USD = 26_500;

/** Khoảng tỷ giá quản trị viên được đặt, đủ rộng nhưng chặn lỗi gõ nhầm. */
export const MIN_VND_PER_USD = 10_000;
export const MAX_VND_PER_USD = 100_000;

export type BankInfo = {
  /** Mã BIN ngân hàng, dùng cho ảnh VietQR. */
  bin: string;
  /** Tên ngân hàng hiển thị cho người chuyển tiền. */
  name: string;
  /** Số tài khoản nhận tiền. */
  account: string;
  /** Tên chủ tài khoản, in hoa không dấu theo sao kê. */
  accountName: string;
};

/**
 * Ảnh VietQR cho một lệnh nạp. Nội dung chuyển khoản chính là mã lệnh để quản
 * trị viên đối chiếu sao kê với đúng tài khoản.
 */
export function vietQrUrl(bank: BankInfo, amountVnd: number, memo: string): string {
  const query = new URLSearchParams({
    amount: String(amountVnd),
    addInfo: memo,
    accountName: bank.accountName,
  });
  return `https://img.vietqr.io/image/${encodeURIComponent(bank.bin)}-${encodeURIComponent(
    bank.account,
  )}-compact2.png?${query.toString()}`;
}

/** Nhãn trạng thái lệnh nạp dùng chung cho trang người dùng và quản trị. */
export const TOPUP_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  paid: "Đã cộng",
  rejected: "Từ chối",
  expired: "Hết hạn",
};

/**
 * Cấu hình ví đang dùng, trả về cho trang quản trị. Nằm ở đây để component phía
 * client dùng được kiểu này mà không kéo `node:sqlite` vào bundle.
 */
export type WalletConfigView = {
  /** `null` khi chưa đủ thông tin nhận tiền. */
  bank: BankInfo | null;
  vndPerUsd: number;
  /** Nguồn của thông tin nhận tiền, để trang quản trị báo đúng trạng thái. */
  bankSource: "settings" | "env" | "none";
  rateSource: "settings" | "env" | "default";
};

export { formatVnd } from "./format";
