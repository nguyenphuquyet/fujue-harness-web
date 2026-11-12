import { randomInt } from "node:crypto";
import { all, getSetting, logAudit, newId, now, one, run, setSetting, transaction } from "./db";
import { ApiError } from "./errors";
import {
  DEFAULT_VND_PER_USD,
  MAX_TOPUP_VND,
  MAX_VND_PER_USD,
  MIN_TOPUP_VND,
  MIN_VND_PER_USD,
  TOPUP_TTL_MS,
  type BankInfo,
  type WalletConfigView,
} from "./billing";
import { formatVnd } from "./format";

/**
 * Ví trả trước tính bằng đồng. Mọi thay đổi số dư đều đi qua sổ `wallet_ledger`
 * để đối chiếu được với sao kê ngân hàng và số liệu sử dụng.
 */

/** Khoá trong bảng `settings` cho cấu hình nhận tiền, sửa ở `/admin/settings`. */
export const WALLET_SETTING_KEYS = {
  bin: "wallet.bank_bin",
  bankName: "wallet.bank_name",
  account: "wallet.bank_account",
  accountName: "wallet.bank_account_name",
  vndPerUsd: "wallet.vnd_per_usd",
} as const;

function readSetting(key: string): string {
  return (getSetting(key) ?? "").trim();
}

/**
 * Tỷ giá quy đổi USD sang đồng. Quản trị viên đổi ở trang Cài đặt; biến môi
 * trường `FUJUE_VND_PER_USD` chỉ còn là giá trị dự phòng khi chưa đặt trong DB.
 */
export function vndPerUsd(): number {
  const raw = Number(readSetting(WALLET_SETTING_KEYS.vndPerUsd) || process.env.FUJUE_VND_PER_USD);
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : DEFAULT_VND_PER_USD;
}

/**
 * Tiền phải trả cho một lượt gọi, làm tròn lên tới đồng để không có lượt nào
 * miễn phí ngoài ý muốn.
 */
export function usageCostVnd(inputPrice: number, outputPrice: number, tokensIn: number, tokensOut: number): number {
  const usd = (tokensIn / 1_000_000) * inputPrice + (tokensOut / 1_000_000) * outputPrice;
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  return Math.ceil(usd * vndPerUsd());
}

export function walletBalance(userId: string): number {
  const row = one<{ balance_vnd: number }>("SELECT balance_vnd FROM users WHERE id = ?", userId);
  return row?.balance_vnd ?? 0;
}

export type LedgerKind = "topup" | "usage" | "adjust";

/**
 * Cập nhật số dư và ghi một dòng sổ ví. Hàm này không tự mở giao dịch: chỗ gọi
 * bọc `transaction()` khi cần cộng/trừ cùng lúc với bảng khác.
 */
export function applyLedger(
  userId: string,
  kind: LedgerKind,
  amountVnd: number,
  ref: string | null,
  detail: string | null,
): number {
  const amount = Math.round(amountVnd);
  if (amount === 0) return walletBalance(userId);
  const row = one<{ balance_vnd: number }>("SELECT balance_vnd FROM users WHERE id = ?", userId);
  if (!row) throw new ApiError(404, "Không tìm thấy tài khoản.");
  const balance = row.balance_vnd + amount;
  run("UPDATE users SET balance_vnd = ? WHERE id = ?", balance, userId);
  run(
    `INSERT INTO wallet_ledger (id, user_id, kind, amount_vnd, balance_after, ref, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    newId("wlt"),
    userId,
    kind,
    amount,
    balance,
    ref,
    detail,
    now(),
  );
  return balance;
}

/** Cộng tiền vào ví ngoài luồng lệnh nạp, ví dụ quản trị viên bù tiền tay. */
export function creditWallet(
  userId: string,
  amountVnd: number,
  ref: string | null,
  detail: string | null,
): number {
  return transaction(() => applyLedger(userId, "adjust", amountVnd, ref, detail));
}

export type TopupRow = {
  id: string;
  user_id: string;
  code: string;
  amount_vnd: number;
  status: string;
  note: string | null;
  created_at: number;
  expires_at: number;
  confirmed_at: number | null;
  confirmed_by: string | null;
  confirmed_by_email: string | null;
};

export type TopupView = TopupRow & { user_name: string; user_email: string };

/** Đánh dấu hết hạn các lệnh chờ đã quá 15 phút, chỉ chạm đúng phạm vi cần. */
export function expireTopups(userId?: string): void {
  const stamp = now();
  if (userId) {
    run(
      "UPDATE topups SET status = 'expired' WHERE user_id = ? AND status = 'pending' AND expires_at <= ?",
      userId,
      stamp,
    );
    return;
  }
  run("UPDATE topups SET status = 'expired' WHERE status = 'pending' AND expires_at <= ?", stamp);
}

function nextTopupCode(): string {
  const date = new Date();
  const month = `${date.getFullYear() % 100}${String(date.getMonth() + 1).padStart(2, "0")}`;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = `FJ-${month}-${String(randomInt(0, 10_000)).padStart(4, "0")}`;
    const exists = one<{ id: string }>("SELECT id FROM topups WHERE code = ?", code);
    if (!exists) return code;
  }
  return `FJ-${month}-${String(Date.now()).slice(-4)}`;
}

/**
 * Tạo lệnh nạp mới. Mỗi tài khoản chỉ có một lệnh chờ tại một thời điểm để quản
 * trị viên đối chiếu sao kê không bị lẫn giữa nhiều mã.
 */
export function createTopup(userId: string, amountVnd: number, note?: string | null): TopupRow {
  const amount = Math.round(Number(amountVnd));
  if (!Number.isFinite(amount) || amount < MIN_TOPUP_VND || amount > MAX_TOPUP_VND) {
    throw new ApiError(
      422,
      `Số tiền nạp từ ${formatVnd(MIN_TOPUP_VND)} đến ${formatVnd(MAX_TOPUP_VND)}.`,
      "amount_vnd",
    );
  }
  if (amount % 1000 !== 0) {
    throw new ApiError(422, "Số tiền nạp cần là bội số của 1.000 ₫.", "amount_vnd");
  }

  expireTopups(userId);
  run("UPDATE topups SET status = 'expired' WHERE user_id = ? AND status = 'pending'", userId);

  const id = newId("top");
  const stamp = now();
  const row: TopupRow = {
    id,
    user_id: userId,
    code: nextTopupCode(),
    amount_vnd: amount,
    status: "pending",
    note: note?.trim() || null,
    created_at: stamp,
    expires_at: stamp + TOPUP_TTL_MS,
    confirmed_at: null,
    confirmed_by: null,
    confirmed_by_email: null,
  };
  run(
    `INSERT INTO topups (id, user_id, code, amount_vnd, status, note, created_at, expires_at,
                         confirmed_at, confirmed_by, confirmed_by_email)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)`,
    row.id,
    row.user_id,
    row.code,
    row.amount_vnd,
    row.status,
    row.note,
    row.created_at,
    row.expires_at,
  );
  return row;
}

export function pendingTopup(userId: string): TopupRow | undefined {
  expireTopups(userId);
  return one<TopupRow>(
    "SELECT * FROM topups WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
    userId,
  );
}

export function topupsForUser(userId: string, limit = 8): TopupRow[] {
  expireTopups(userId);
  return all<TopupRow>(
    "SELECT * FROM topups WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    userId,
    limit,
  );
}

export function pendingTopups(limit = 20): TopupView[] {
  expireTopups();
  return all<TopupView>(
    `SELECT t.*, u.name AS user_name, u.email AS user_email
       FROM topups t JOIN users u ON u.id = t.user_id
      WHERE t.status = 'pending'
      ORDER BY t.created_at ASC
      LIMIT ?`,
    limit,
  );
}

/** Xác nhận đã nhận tiền: chuyển lệnh sang `paid` và cộng đúng số tiền vào ví. */
export function confirmTopup(topupId: string, admin: { id: string; email: string }): number {
  const row = one<TopupRow>("SELECT * FROM topups WHERE id = ?", topupId);
  if (!row) throw new ApiError(404, "Không tìm thấy lệnh nạp.");
  if (row.status !== "pending") throw new ApiError(409, "Lệnh nạp này đã được xử lý.");
  if (row.expires_at <= now()) {
    run("UPDATE topups SET status = 'expired' WHERE id = ? AND status = 'pending'", row.id);
    throw new ApiError(409, "Lệnh nạp đã hết hạn. Yêu cầu người dùng tạo lệnh mới.");
  }

  return transaction(() => {
    const changed = run(
      `UPDATE topups SET status = 'paid', confirmed_at = ?, confirmed_by = ?, confirmed_by_email = ?
        WHERE id = ? AND status = 'pending'`,
      now(),
      admin.id,
      admin.email,
      row.id,
    );
    if (changed.changes === 0) throw new ApiError(409, "Lệnh nạp vừa được xử lý ở nơi khác.");
    const balance = applyLedger(row.user_id, "topup", row.amount_vnd, row.code, `Nạp tiền · ${row.code}`);
    logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "Xác nhận nạp tiền",
      target: row.code,
      detail: `${formatVnd(row.amount_vnd)} · ${row.user_id}`,
    });
    return balance;
  });
}

/** Từ chối lệnh nạp, ví dụ chưa thấy tiền về hoặc nội dung chuyển khoản sai. */
export function rejectTopup(topupId: string, admin: { id: string; email: string }, note?: string): void {
  const row = one<TopupRow>("SELECT * FROM topups WHERE id = ?", topupId);
  if (!row) throw new ApiError(404, "Không tìm thấy lệnh nạp.");
  if (row.status !== "pending") throw new ApiError(409, "Lệnh nạp này đã được xử lý.");
  run(
    `UPDATE topups SET status = 'rejected', note = ?, confirmed_at = ?, confirmed_by = ?, confirmed_by_email = ?
      WHERE id = ? AND status = 'pending'`,
    note?.trim() || row.note,
    now(),
    admin.id,
    admin.email,
    row.id,
  );
  logAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: "Từ chối nạp tiền",
    target: row.code,
    detail: note?.trim() || null,
  });
}

export type WalletSummary = {
  balanceVnd: number;
  used30Vnd: number;
  pendingVnd: number;
  pendingCount: number;
  pendingCode: string | null;
};

/** Số dư, chi tiêu 30 ngày và lệnh nạp đang chờ — đủ cho dải ví ở tổng quan. */
export function walletSummary(userId: string): WalletSummary {
  const since = new Date(now() - 29 * 86_400_000).toISOString().slice(0, 10);
  const used = one<{ total: number }>(
    "SELECT COALESCE(SUM(cost_vnd), 0) AS total FROM usage_daily WHERE user_id = ? AND day >= ?",
    userId,
    since,
  );
  const pending = one<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(amount_vnd), 0) AS total, COUNT(*) AS count
       FROM topups WHERE user_id = ? AND status = 'pending' AND expires_at > ?`,
    userId,
    now(),
  );
  const latest = pendingTopup(userId);
  return {
    balanceVnd: walletBalance(userId),
    used30Vnd: used?.total ?? 0,
    pendingVnd: pending?.total ?? 0,
    pendingCount: pending?.count ?? 0,
    pendingCode: latest?.code ?? null,
  };
}

/**
 * Cấu hình nhận tiền: ưu tiên giá trị lưu trong bảng `settings` (sửa ở
 * `/admin/settings`), sau đó mới tới biến môi trường. Thiếu cả hai thì trang
 * nạp tiền tạm tắt thay vì tạo mã QR không chuyển được.
 */
export function bankInfo(): BankInfo | null {
  const bin = readSetting(WALLET_SETTING_KEYS.bin) || (process.env.FUJUE_BANK_BIN ?? "").trim();
  const account =
    readSetting(WALLET_SETTING_KEYS.account) || (process.env.FUJUE_BANK_ACCOUNT ?? "").trim();
  const accountName =
    readSetting(WALLET_SETTING_KEYS.accountName) || (process.env.FUJUE_BANK_ACCOUNT_NAME ?? "").trim();
  if (!bin || !account || !accountName) return null;
  const name =
    readSetting(WALLET_SETTING_KEYS.bankName) || (process.env.FUJUE_BANK_NAME ?? "").trim();
  return { bin, name: name || `Ngân hàng ${bin}`, account, accountName };
}

export type WalletConfig = WalletConfigView;

/** Toàn bộ cấu hình ví cho trang quản trị: giá trị đang dùng và nó đến từ đâu. */
export function walletConfig(): WalletConfig {
  const storedBank = [
    WALLET_SETTING_KEYS.bin,
    WALLET_SETTING_KEYS.account,
    WALLET_SETTING_KEYS.accountName,
  ].some((key) => readSetting(key) !== "");
  const envBank = ["FUJUE_BANK_BIN", "FUJUE_BANK_ACCOUNT", "FUJUE_BANK_ACCOUNT_NAME"].some(
    (key) => (process.env[key] ?? "").trim() !== "",
  );
  const storedRate = readSetting(WALLET_SETTING_KEYS.vndPerUsd) !== "";
  const envRate = (process.env.FUJUE_VND_PER_USD ?? "").trim() !== "";
  return {
    bank: bankInfo(),
    vndPerUsd: vndPerUsd(),
    bankSource: storedBank ? "settings" : envBank ? "env" : "none",
    rateSource: storedRate ? "settings" : envRate ? "env" : "default",
  };
}

export type WalletSettingsInput = {
  bin: string;
  bankName: string;
  account: string;
  accountName: string;
  vndPerUsd: number;
};

/**
 * Lưu cấu hình nhận tiền và tỷ giá. Ghi vào `settings` nên áp dụng ngay cho lệnh
 * nạp kế tiếp, không cần khởi động lại server.
 */
export function saveWalletSettings(
  input: WalletSettingsInput,
  admin: { id: string; email: string },
): WalletConfig {
  const bin = input.bin.trim();
  const bankName = input.bankName.trim();
  const account = input.account.trim().replace(/\s+/g, "");
  const accountName = input.accountName.trim().replace(/\s+/g, " ").toUpperCase();
  const rate = Math.round(Number(input.vndPerUsd));

  if (!/^\d{6}$/.test(bin)) {
    throw new ApiError(422, "Mã BIN ngân hàng gồm đúng 6 chữ số.", "bin");
  }
  if (!/^\d{6,19}$/.test(account)) {
    throw new ApiError(422, "Số tài khoản gồm 6 đến 19 chữ số.", "account");
  }
  if (accountName.length < 3 || accountName.length > 60 || !/^[A-Z0-9 ]+$/.test(accountName)) {
    throw new ApiError(422, "Tên chủ tài khoản viết hoa không dấu, 3–60 ký tự.", "accountName");
  }
  if (bankName.length > 60) {
    throw new ApiError(422, "Tên ngân hàng tối đa 60 ký tự.", "bankName");
  }
  if (!Number.isFinite(rate) || rate < MIN_VND_PER_USD || rate > MAX_VND_PER_USD) {
    throw new ApiError(
      422,
      `Tỷ giá từ ${MIN_VND_PER_USD.toLocaleString("vi-VN")} đến ${MAX_VND_PER_USD.toLocaleString("vi-VN")} ₫/USD.`,
      "vndPerUsd",
    );
  }

  transaction(() => {
    setSetting(WALLET_SETTING_KEYS.bin, bin);
    setSetting(WALLET_SETTING_KEYS.bankName, bankName);
    setSetting(WALLET_SETTING_KEYS.account, account);
    setSetting(WALLET_SETTING_KEYS.accountName, accountName);
    setSetting(WALLET_SETTING_KEYS.vndPerUsd, String(rate));
    logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "Cập nhật cấu hình ví",
      target: `${bankName || bin} · ${account}`,
      detail: `${accountName} · 1 USD = ${rate.toLocaleString("vi-VN")} ₫`,
    });
  });

  return walletConfig();
}
