import { currentUser } from "@/lib/auth";
import { listKeys, KEY_LIMITS } from "@/lib/keys";
import { formatDateTime, formatRelative } from "@/lib/usage";
import { KeysClient, type KeyView } from "./keys-client";

export default async function KeysPage() {
  const user = await currentUser();
  if (!user) return null;

  const keys: KeyView[] = listKeys(user.id).map((key) => ({
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    createdAt: formatDateTime(key.created_at),
    lastUsed: key.last_used_at ? formatRelative(key.last_used_at) : "Chưa dùng",
    revoked: key.revoked_at !== null,
    requests: key.requests,
  }));

  return <KeysClient initial={keys} limit={KEY_LIMITS[user.plan] ?? 2} />;
}
