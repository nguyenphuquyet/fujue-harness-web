import { randomInt } from "node:crypto";
import { all, logAudit, newId, now, one, run, transaction } from "./db";
import { ApiError } from "./errors";
import { MAX_TOPUP_VND, MIN_TOPUP_VND, TOPUP_TTL_MS, type BankInfo } from "./billing";
import { formatVnd } from "./format";

/**
 * Ví trả trước tính bằng đồng. Mọi thay đổi số dư đều đi qua sổ `wallet_ledger`
 * để đối chiếu được với sao kê ngân hàng và số liệu sử dụng.
 */

/** Tỷ giá quy đổi giá niêm yết USD sang đồng; đổi bằng FUJUE_VND_PER_USD. */
export const VND_PER_USD: number = (() => {
  const raw = Number(process.env.FUJUE_VND_PER_USD);
  return Number.isFinite(raw) && raw > 0 ? raw : 26_500;
})();

/**
 * Tiền phải trả cho một lượt gọi, làm tròn lên tới đồng để không có lượt nào
 * miễn phí ngoài ý muốn.
 */
export function usageCostVnd(inputPrice: number, outputPrice: number, tokensIn: number, tokensOut: number): number {
  const usd = (tokensIn / 1_000_000) * inputPrice + (tokensOut / 1_000_000) * outputPrice;
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  return Math.ceil(usd * VND_PER_USD);
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

/** Cấu hình nhận tiền lấy từ biến môi trường; thiếu thì trang nạp tiền tạm tắt. */
export function bankInfo(): BankInfo | null {
  const bin = (process.env.FUJUE_BANK_BIN ?? "").trim();
  const account = (process.env.FUJUE_BANK_ACCOUNT ?? "").trim();
  const accountName = (process.env.FUJUE_BANK_ACCOUNT_NAME ?? "").trim();
  if (!bin || !account || !accountName) return null;
  return {
    bin,
    name: (process.env.FUJUE_BANK_NAME ?? "").trim() || `Ngân hàng ${bin}`,
    account,
    accountName,
  };
}
