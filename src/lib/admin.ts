import { all, now } from "./db";

/**
 * Truy vấn dùng chung cho trang quản trị người dùng và API tìm kiếm: số dư ví,
 * chi tiêu 30 ngày và lệnh nạp đang chờ phải khớp nhau ở cả hai nơi.
 */
export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  status: string;
  created_at: number;
  last_login_at: number | null;
  balance_vnd: number;
  used30: number;
  pending_vnd: number;
  pending_count: number;
  keys: number;
  sessions: number;
};

export function listAdminUsers(search = ""): AdminUserRow[] {
  const stamp = now();
  const since = new Date(stamp - 29 * 86_400_000).toISOString().slice(0, 10);
  const like = `%${search}%`;
  return all<AdminUserRow>(
    `SELECT u.id, u.email, u.name, u.role, u.plan, u.status, u.created_at, u.last_login_at,
            u.balance_vnd,
            (SELECT COALESCE(SUM(d.cost_vnd), 0) FROM usage_daily d
              WHERE d.user_id = u.id AND d.day >= ?) AS used30,
            (SELECT COALESCE(SUM(t.amount_vnd), 0) FROM topups t
              WHERE t.user_id = u.id AND t.status = 'pending' AND t.expires_at > ?) AS pending_vnd,
            (SELECT COUNT(*) FROM topups t
              WHERE t.user_id = u.id AND t.status = 'pending' AND t.expires_at > ?) AS pending_count,
            (SELECT COUNT(*) FROM api_keys k WHERE k.user_id = u.id AND k.revoked_at IS NULL) AS keys,
            (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id) AS sessions
       FROM users u
      WHERE (? = '' OR u.email LIKE ? OR u.name LIKE ?)
      ORDER BY u.created_at DESC`,
    since,
    stamp,
    stamp,
    search,
    like,
    like,
  );
}
