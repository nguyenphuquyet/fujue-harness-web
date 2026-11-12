"use client";

import { useState } from "react";
import {
  Check,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { formatDateTime, formatRelative, formatVnd } from "@/lib/format";
import { cn } from "@/lib/cn";

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
  balanceVnd: number;
  used30Vnd: number;
  pendingVnd: number;
};

export type PendingTopup = {
  id: string;
  code: string;
  amountVnd: number;
  createdAt: number;
  userName: string;
  userEmail: string;
};

type ApiUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  status: string;
  created_at: number;
  last_login_at: number | null;
  keys: number;
  balance_vnd: number;
  used30: number;
  pending_vnd: number;
};

type ApiTopup = {
  id: string;
  code: string;
  amount_vnd: number;
  created_at: number;
  user_name: string;
  user_email: string;
};

function toUser(row: ApiUser): AdminUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    plan: row.plan,
    status: row.status,
    createdAt: new Date(row.created_at).toLocaleDateString("vi-VN"),
    lastLogin: row.last_login_at ? new Date(row.last_login_at).toLocaleString("vi-VN") : "Chưa đăng nhập",
    keys: row.keys,
    balanceVnd: row.balance_vnd,
    used30Vnd: row.used30,
    pendingVnd: row.pending_vnd,
  };
}

function toTopup(row: ApiTopup): PendingTopup {
  return {
    id: row.id,
    code: row.code,
    amountVnd: row.amount_vnd,
    createdAt: row.created_at,
    userName: row.user_name,
    userEmail: row.user_email,
  };
}

export function UsersClient({
  initial,
  initialPending,
  currentUserId,
}: {
  initial: AdminUser[];
  initialPending: PendingTopup[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initial);
  const [pending, setPending] = useState(initialPending);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [creditTarget, setCreditTarget] = useState<AdminUser | null>(null);

  async function reload(search: string) {
    const [userResponse, topupResponse] = await Promise.all([
      fetch(`/api/v1/admin/users?q=${encodeURIComponent(search)}`),
      fetch("/api/v1/admin/topups"),
    ]);
    if (userResponse.ok) {
      const data = (await userResponse.json()) as { users: ApiUser[] };
      setUsers(data.users.map(toUser));
    }
    if (topupResponse.ok) {
      const data = (await topupResponse.json()) as { topups: ApiTopup[] };
      setPending(data.topups.map(toTopup));
    }
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

  async function decide(topup: PendingTopup, action: "confirm" | "reject") {
    setBusy(topup.id);
    setError(null);
    const response = await fetch(`/api/v1/admin/topups/${topup.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Không xử lý được lệnh nạp.");
    } else {
      await reload(query);
    }
    setBusy(null);
  }

  async function credit(user: AdminUser, amount: number, note: string) {
    setBusy(user.id);
    setError(null);
    const response = await fetch(`/api/v1/admin/users/${user.id}/balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount_vnd: amount, note }),
    });
    const data = (await response.json()) as { error?: string; balance_vnd?: number };
    if (!response.ok) {
      setError(data.error ?? "Không điều chỉnh được số dư.");
      setBusy(null);
      return false;
    }
    setUsers((current) =>
      current.map((row) => (row.id === user.id ? { ...row, balanceVnd: data.balance_vnd ?? row.balanceVnd } : row)),
    );
    setBusy(null);
    return true;
  }

  const sumBalance = users.reduce((sum, row) => sum + row.balanceVnd, 0);
  const sumUsed = users.reduce((sum, row) => sum + row.used30Vnd, 0);
  const pendingAmount = pending.reduce((sum, row) => sum + row.amountVnd, 0);
  const emptyAccounts = users.filter((row) => row.balanceVnd <= 0).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">        <div>
          <h1 className="text-xl font-semibold tracking-tight">Người dùng</h1>
          <p className="mt-1 text-sm text-muted">
            {users.length} tài khoản. Số dư, mức dùng và lệnh nạp nằm cùng một chỗ.
          </p>
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

      <section className="grid grid-cols-2 divide-border overflow-hidden rounded-2xl border border-border bg-surface sm:grid-cols-4 sm:divide-x">
        {[
          { label: "Tài khoản", value: String(users.length), sub: `${emptyAccounts} hết số dư` },
          { label: "Tổng số dư", value: formatVnd(sumBalance), sub: "khả dụng toàn hệ thống" },
          { label: "Chi tiêu 30 ngày", value: formatVnd(sumUsed), sub: "đã trừ khỏi ví" },
          {
            label: "Chờ xác nhận",
            value: `${pending.length} lệnh`,
            sub: pending.length > 0 ? formatVnd(pendingAmount) : "không có lệnh nào",
          },
        ].map((cell, index) => (
          <div
            key={cell.label}
            className={cn(
              "px-4 py-3.5 sm:px-5",
              index < 2 && "border-b border-border sm:border-b-0",
              index % 2 === 0 && "border-r border-border sm:border-r-0",
            )}
          >
            <p className="text-xs text-muted">{cell.label}</p>
            <p className="mt-1 text-lg font-semibold tracking-tight tabular-nums">{cell.value}</p>
            <p className="mt-0.5 text-[11px] text-muted">{cell.sub}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-subtle text-[11px] text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Người dùng</th>
                <th className="px-3 py-2.5 font-medium">Vai trò</th>
                <th className="hidden px-3 py-2.5 font-medium xl:table-cell">Gói</th>
                <th className="px-3 py-2.5 text-right font-medium">Số dư</th>
                <th className="px-3 py-2.5 text-right font-medium">Đã dùng</th>
                <th className="px-3 py-2.5 font-medium">Trạng thái</th>
                <th className="px-4 py-2.5 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <tr key={user.id} className="transition-colors hover:bg-surface-hover">
                    <td className="px-4 py-3">
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
                    <td className="px-3 py-3">
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
                    <td className="hidden px-3 py-3 xl:table-cell">
                      <Select
                        value={user.plan}
                        disabled={busy === user.id}
                        onChange={(event) => void patch(user.id, { plan: event.target.value })}
                        className="h-8 w-24 text-xs"
                      >
                        <option value="free">Miễn phí</option>
                        <option value="pro">Pro</option>
                        <option value="team">Đội nhóm</option>
                      </Select>
                    </td>
                    <td
                      className={cn(
                        "px-3 py-3 text-right text-sm whitespace-nowrap tabular-nums",
                        user.balanceVnd <= 0 && "text-danger",
                      )}
                    >
                      {formatVnd(user.balanceVnd)}
                      {user.pendingVnd > 0 ? (
                        <p className="text-[11px] font-normal text-muted">+{formatVnd(user.pendingVnd)} chờ</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-right text-sm whitespace-nowrap tabular-nums">
                      {user.used30Vnd > 0 ? formatVnd(user.used30Vnd) : <span className="text-muted">—</span>}
                      <p className="text-[11px] font-normal text-muted">
                        {user.used30Vnd > 0 ? "30 ngày" : "chưa gọi"}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={user.status === "active" ? "success" : "danger"}>
                        {user.status === "active" ? "Hoạt động" : "Tạm khoá"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {busy === user.id ? <Loader2 className="size-4 animate-spin text-muted" /> : null}
                        <button
                          type="button"
                          disabled={busy === user.id}
                          onClick={() => setCreditTarget(user)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border-strong bg-surface px-2.5 text-xs transition-colors hover:bg-item-hover disabled:opacity-40"
                          title="Nạp tiền cho tài khoản"
                        >
                          <Plus className="size-3.5" />
                          Nạp
                        </button>
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

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium">Lệnh nạp chờ xác nhận</h2>
            {pending.length > 0 ? (
              <Badge tone="warning">
                {pending.length} lệnh · {formatVnd(pendingAmount)}
              </Badge>
            ) : null}
          </div>
          <p className="text-[11px] text-muted">Đối chiếu sao kê theo mã lệnh trước khi cộng tiền</p>
        </div>

        {pending.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium">Không có lệnh nào chờ xác nhận</p>
            <p className="mt-1 text-xs text-muted">Lệnh mới người dùng tạo sẽ hiện ở đây.</p>
          </div>
        ) : (
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {pending.map((topup) => (
              <article key={topup.id} className="rounded-xl border border-border bg-surface-subtle p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-muted">{topup.code}</p>
                    <p className="mt-0.5 truncate text-sm font-medium">{topup.userName}</p>
                    <p className="truncate text-[11px] text-muted">{topup.userEmail}</p>
                  </div>
                  <p className="text-base font-semibold whitespace-nowrap tabular-nums">
                    {formatVnd(topup.amountVnd)}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                  <p className="text-[11px] text-muted" title={formatDateTime(topup.createdAt)}>
                    {formatRelative(topup.createdAt)}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy === topup.id}
                      onClick={() => void decide(topup, "reject")}
                    >
                      <X className="size-3.5" />
                      Từ chối
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={busy === topup.id}
                      onClick={() => void decide(topup, "confirm")}
                    >
                      {busy === topup.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Check className="size-3.5" />
                      )}
                      Đã nhận tiền
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {creditTarget ? (
        <BalanceDialog
          user={creditTarget}
          onClose={() => setCreditTarget(null)}
          onConfirm={async (amount, note) => {
            const ok = await credit(creditTarget, amount, note);
            if (ok) setCreditTarget(null);
            return ok;
          }}
        />
      ) : null}

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-overlay p-5 shadow-modal">
            <p className="flex items-center gap-2 text-sm font-medium">
              <UserRound className="size-4 text-danger" />
              Xoá tài khoản {confirmDelete.email}?
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Toàn bộ khoá API, phiên đăng nhập, số dư và số liệu sử dụng của tài khoản này sẽ bị
              xoá. Không hoàn tác được.
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

function BalanceDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: AdminUser;
  onClose: () => void;
  onConfirm: (amount: number, note: string) => Promise<boolean>;
}) {
  const [digits, setDigits] = useState("");
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const amount = Number(digits || 0);

  async function submit() {
    if (amount === 0) {
      setLocalError("Nhập số tiền cần cộng hoặc trừ.");
      return;
    }
    setBusy(true);
    setLocalError(null);
    const ok = await onConfirm(amount, note);
    if (!ok) setLocalError("Không điều chỉnh được số dư.");
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-overlay p-5 shadow-modal">
        <p className="text-sm font-medium">Điều chỉnh số dư</p>
        <p className="mt-1 text-xs text-muted">
          {user.name} · {user.email}
        </p>
        <p className="mt-3 rounded-xl bg-surface-subtle px-3 py-2 text-sm">
          Số dư hiện tại: <span className="font-medium tabular-nums">{formatVnd(user.balanceVnd)}</span>
        </p>

        <div className="mt-4 space-y-3">
          <Field label="Số tiền" htmlFor="balance-amount" hint="Nhập số âm để trừ tiền, ví dụ -50000.">
            <Input
              id="balance-amount"
              inputMode="numeric"
              value={digits}
              onChange={(event) =>
                setDigits(event.target.value.replace(/[^\d-]/g, "").replace(/(?!^)-/g, ""))
              }
              placeholder="200000"
              className="tabular-nums"
            />
          </Field>
          <Field label="Ghi chú" htmlFor="balance-note" hint="Không bắt buộc.">
            <Input
              id="balance-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Chuyển khoản ngoài lệnh"
            />
          </Field>
          {localError ? <p className="text-xs text-error-strong">{localError}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
            Huỷ
          </Button>
          <Button variant="primary" size="sm" onClick={() => void submit()} disabled={busy}>
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Xác nhận
          </Button>
        </div>
      </div>
    </div>
  );
}
