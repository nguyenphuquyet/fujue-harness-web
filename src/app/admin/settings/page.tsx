import { pendingTopups, walletConfig } from "@/lib/wallet";
import { SettingsClient } from "./settings-client";

export default function AdminSettingsPage() {
  const config = walletConfig();
  const pendingCount = pendingTopups(100).length;
  return <SettingsClient initial={config} pendingCount={pendingCount} />;
}
