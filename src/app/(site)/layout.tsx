import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { currentUser } from "@/lib/auth";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader signedIn={Boolean(user)} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
