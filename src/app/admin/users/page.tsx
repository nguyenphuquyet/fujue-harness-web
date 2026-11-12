import { currentUser } from "@/lib/auth";
import { listAdminUsers } from "@/lib/admin";
import { pendingTopups } from "@/lib/wallet";
import { UsersClient, type AdminUser, type PendingTopup } from "./users-client";

export default async function AdminUsersPage() {
  const admin = await currentUser();
  if (!admin) return null;

  const rows = listAdminUsers();
  const pending: PendingTopup[] = pendingTopups().map((row) => ({
    id: row.id,
    code: row.code,
    amountVnd: row.amount_vnd,
    createdAt: row.created_at,
    userName: row.user_name,
    userEmail: row.user_email,
  }));

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
    balanceVnd: row.balance_vnd,
    used30Vnd: row.used30,
    pendingVnd: row.pending_vnd,
  }));

  return <UsersClient initial={users} initialPending={pending} currentUserId={admin.id} />;
}
