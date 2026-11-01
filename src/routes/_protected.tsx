import { createFileRoute, redirect, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { endSession, getVerifiedUser, safeReturnPath } from "@/lib/auth";
import { getAccount } from "@/lib/account.functions";
import { canAccessAccountPath } from "@/lib/account-access";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_protected")({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    const user = await getVerifiedUser(context.auth);
    if (!user) throw redirect({ to: "/auth", search: { redirect: safeReturnPath(location.href) }, replace: true });
    const account = await getAccount();
    if (!canAccessAccountPath(location.pathname, account.roles)) throw redirect({ to: "/dashboard", replace: true });
    return { user, account };
  },
  component: ProtectedShell,
});

function ProtectedShell() {
  const { auth, queryClient, account } = Route.useRouteContext();
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
    <header className="border-b border-border bg-card px-6 py-5"><span className="font-display text-lg font-extrabold text-primary">FairShift <span className="text-teal">TrustLoop</span></span></header>
    <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 pt-4">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button variant="outline" disabled={busy} onClick={logout}><LogOut />{busy ? "Logging out…" : "Log out"}</Button>
    </div>
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-semibold text-teal">{account.roles.includes("employer") ? "EMPLOYER ACCOUNT" : "WORKER ACCOUNT"}</p>
      <h1 className="mt-3 font-display text-3xl font-bold">Welcome{account.displayName ? `, ${account.displayName}` : " to FairShift TrustLoop"}</h1>
      <p className="mt-4 text-muted-foreground">You’re securely signed in.</p>
      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-xl font-semibold">{account.employeeReference ? "Workplace records pending" : "Workplace connection pending"}</h2>
        <p className="mt-3 text-muted-foreground">{account.employeeReference ? `Employee reference: ${account.employeeReference}. ` : "Your account isn’t linked to an employee record yet. "}Pay, shifts, leave and reports will become available when your real workplace records are connected. Existing demonstration records are not your personal records.</p>
      </section>
    </main>
    {/* Retained demo routes stay unmounted until their data is migrated with owner/employer policies. */}
    {false && <Outlet />}
  </>;
}