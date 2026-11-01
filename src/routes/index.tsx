import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "@/components/LoginPage";
import { getVerifiedUser } from "@/lib/auth";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    if (await getVerifiedUser(context.auth)) throw redirect({ to: "/dashboard", replace: true });
  },
  head: pageHead("Login", "Log in to FairShift TrustLoop to report concerns, check pay and manage leave."),
  component: () => <LoginPage returnTo="/dashboard" />,
});
