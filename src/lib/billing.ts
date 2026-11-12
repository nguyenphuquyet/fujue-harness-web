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

export { formatVnd } from "./format";
