import { currentUser } from "@/lib/auth";
import { bankInfo, pendingTopup, topupsForUser, walletSummary } from "@/lib/wallet";
import { BillingClient, type TopupItem } from "./billing-client";

export default async function BillingPage() {
  const user = await currentUser();
  if (!user) return null;

  const summary = walletSummary(user.id);
  const pending = pendingTopup(user.id);
  const history: TopupItem[] = topupsForUser(user.id, 10).map((row) => ({
    id: row.id,
    code: row.code,
    amountVnd: row.amount_vnd,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  }));

  return (
    <BillingClient
      balanceVnd={summary.balanceVnd}
      used30Vnd={summary.used30Vnd}
      pending={
        pending
          ? {
              id: pending.id,
              code: pending.code,
              amountVnd: pending.amount_vnd,
              status: pending.status,
              createdAt: pending.created_at,
              expiresAt: pending.expires_at,
            }
          : null
      }
      history={history}
      bank={bankInfo()}
    />
  );
}
