import { currentUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { UsersClient, type AdminUser } from "./users-client";

type Row = {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  status: string;
  created_at: number;
  last_login_at: number | null;
  keys: number;
};

export default async function AdminUsersPage() {
  const admin = await currentUser();
  if (!admin) return null;

  const rows = all<Row>(
    `SELECT u.id, u.email, u.name, u.role, u.plan, u.status, u.created_at, u.last_login_at,
            (SELECT COUNT(*) FROM api_keys k WHERE k.user_id = u.id AND k.revoked_at IS NULL) AS keys,
            (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id) AS sessions
       FROM users u
      ORDER BY u.created_at DESC`,
  );

  const users: AdminUser[] = rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    plan: row.plan,
    status: row.status,
    createdAt: new Date(row.created_at).toLocaleDateString("vi-VN"),
    lastLogin: row.last_login_at
      ? new Date(row.last_login_at).toLocaleString("vi-VN")
      : "Chưa đăng nhập",
    keys: row.keys,
  }));

  return <UsersClient initial={users} currentUserId={admin.id} />;
}
