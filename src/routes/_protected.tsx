import { createFileRoute, redirect, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { endSession, getVerifiedUser, safeReturnPath } from "@/lib/auth";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_protected")({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    const user = await getVerifiedUser(context.auth);
    if (!user) throw redirect({ to: "/auth", search: { redirect: safeReturnPath(location.href) }, replace: true });
    return { user };
  },
  component: ProtectedShell,
});

function ProtectedShell() {
  const { auth, queryClient } = Route.useRouteContext();
  const router = useRouter();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await endSession(auth, queryClient, async () => {
        await navigate({ to: "/auth", search: { redirect: "/dashboard" }, replace: true });
        await router.invalidate();
      });
    } catch { setError("We couldn’t log you out. Please try again."); }
    finally { setBusy(false); }
  }
  return <>
    <AppNav />
    <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 pt-4">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button variant="outline" disabled={busy} onClick={logout}><LogOut />{busy ? "Logging out…" : "Log out"}</Button>
    </div>
    <main className="mx-auto max-w-7xl px-4 py-8"><Outlet /></main>
    <footer className="mx-auto max-w-7xl px-4 pb-10 text-sm text-muted-foreground">FairShift TrustLoop · Supporting UN SDG 8 — Decent Work and Economic Growth. Sample data and pay policies are demonstrations, not legally verified payroll rules.</footer>
  </>;
}