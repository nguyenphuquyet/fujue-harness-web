"use client";

import { useState } from "react";
import { Loader2, Search, ShieldCheck, ShieldOff, Trash2, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  status: string;
  createdAt: string;
  lastLogin: string;
  keys: number;
};

export function UsersClient({ initial, currentUserId }: { initial: AdminUser[]; currentUserId: string }) {
  const [users, setUsers] = useState(initial);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

  async function reload(search: string) {
    const response = await fetch(`/api/v1/admin/users?q=${encodeURIComponent(search)}`);
    if (!response.ok) return;
    const data = (await response.json()) as {
      users: Array<{
        id: string;
        email: string;
        name: string;
        role: string;
        plan: string;
        status: string;
        created_at: number;
        last_login_at: number | null;
        keys: number;
      }>;
    };
    setUsers(
      data.users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        status: user.status,
        createdAt: new Date(user.created_at).toLocaleDateString("vi-VN"),
        lastLogin: user.last_login_at
          ? new Date(user.last_login_at).toLocaleString("vi-VN")
          : "Chưa đăng nhập",
        keys: user.keys,
      })),
    );
  }

  async function patch(id: string, body: Record<string, string>) {
    setBusy(id);
    setError(null);
    const response = await fetch(`/api/v1/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Không cập nhật được.");
    } else {
      setUsers((current) => current.map((user) => (user.id === id ? { ...user, ...body } : user)));
    }
    setBusy(null);
  }

  async function remove(user: AdminUser) {
    setConfirmDelete(null);
    setBusy(user.id);
    const response = await fetch(`/api/v1/admin/users/${user.id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Không xoá được.");
    } else {
      setUsers((current) => current.filter((row) => row.id !== user.id));
    }
    setBusy(null);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Người dùng</h1>
          <p className="mt-1 text-sm text-muted">{users.length} tài khoản. Đổi vai trò, gói và trạng thái tại chỗ.</p>
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void reload(query);
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên hoặc email"
              className="w-64 pl-8"
            />
          </div>
          <Button type="submit" variant="outline" size="md">
            Tìm
          </Button>
        </form>
      </header>

      {error ? (
        <p className="rounded-xl border border-error-border bg-error-bg px-3 py-2 text-xs text-error-strong">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left">
            <thead className="bg-surface text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Người dùng</th>
                <th className="px-4 py-3 font-medium">Vai trò</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Gói</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Khoá</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Đăng nhập gần nhất</th>
                <th className="px-5 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <tr key={user.id} className="transition-colors hover:bg-surface-hover">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-medium">
                          {user.name
                            .split(" ")
                            .filter(Boolean)
                            .slice(-2)
                            .map((part) => part[0]?.toUpperCase())
                            .join("")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {user.name}
                            {isSelf ? <span className="ml-1.5 text-[11px] text-muted">(bạn)</span> : null}
                          </p>
                          <p className="truncate text-[11px] text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={user.role}
                        disabled={isSelf || busy === user.id}
                        onChange={(event) => void patch(user.id, { role: event.target.value })}
                        className="h-8 w-28 text-xs"
                      >
                        <option value="user">Thành viên</option>
                        <option value="admin">Quản trị</option>
                      </Select>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <Select
                        value={user.plan}
                        disabled={busy === user.id}
                        onChange={(event) => void patch(user.id, { plan: event.target.value })}
                        className="h-8 w-28 text-xs"
                      >
                        <option value="free">Miễn phí</option>
                        <option value="pro">Pro</option>
                        <option value="team">Đội nhóm</option>
                      </Select>
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-muted md:table-cell">
                      {user.keys}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted lg:table-cell">{user.lastLogin}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {busy === user.id ? <Loader2 className="size-4 animate-spin text-muted" /> : null}
                        <Badge tone={user.status === "active" ? "success" : "danger"}>
                          {user.status === "active" ? "Hoạt động" : "Tạm khoá"}
                        </Badge>
                        <button
                          type="button"
                          disabled={isSelf || busy === user.id}
                          onClick={() =>
                            void patch(user.id, {
                              status: user.status === "active" ? "suspended" : "active",
                            })
                          }
                          className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-item-hover hover:text-foreground disabled:opacity-40"
                          aria-label={user.status === "active" ? "Tạm khoá" : "Mở khoá"}
                          title={user.status === "active" ? "Tạm khoá" : "Mở khoá"}
                        >
                          {user.status === "active" ? (
                            <ShieldOff className="size-3.5" />
                          ) : (
                            <ShieldCheck className="size-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={isSelf || busy === user.id}
                          onClick={() => setConfirmDelete(user)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-bg hover:text-danger disabled:opacity-40"
                          aria-label={`Xoá ${user.email}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-overlay p-5 shadow-modal">
            <p className="flex items-center gap-2 text-sm font-medium">
              <UserRound className="size-4 text-danger" />
              Xoá tài khoản {confirmDelete.email}?
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Toàn bộ khoá API, phiên đăng nhập và số liệu sử dụng của tài khoản này sẽ bị xoá. Không
              hoàn tác được.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
                Huỷ
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="bg-danger-bg hover:bg-danger-bg-hover"
                onClick={() => void remove(confirmDelete)}
              >
                Xoá tài khoản
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
