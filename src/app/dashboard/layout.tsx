import { AppShell } from "@/components/app/app-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell next="/dashboard">{children}</AppShell>;
}
