import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "@/components/LoginPage";
import { getVerifiedUser, safeReturnPath } from "@/lib/auth";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({ redirect: safeReturnPath(search.redirect) }),
  beforeLoad: async ({ context, search }) => {
    if (await getVerifiedUser(context.auth)) throw redirect({ to: search.redirect, replace: true });
  },
  head: pageHead("Login", "Log in to your FairShift TrustLoop workplace account."),
  component: () => <LoginPage returnTo={Route.useSearch().redirect} />,
});