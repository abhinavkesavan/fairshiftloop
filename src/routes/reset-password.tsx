import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: pageHead("Reset Password", "Set a new password for your FairShift TrustLoop account."),
  component: ResetPassword,
});

function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const recovery = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    if (recovery) void supabase.auth.getUser().then(({ data }) => setReady(Boolean(data.user)));
  }, []);
  return <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
    <h1 className="font-display text-3xl font-bold text-primary">Reset your password</h1>
    {!ready ? <p className="mt-4 text-muted-foreground">Open the password-reset link in your email to continue.</p> : <form className="mt-6 space-y-4" onSubmit={async (event) => {
      event.preventDefault();
      if (password.length < 8) { setMessage("Use at least 8 characters."); return; }
      setBusy(true);
      const { error } = await supabase.auth.updateUser({ password });
      setBusy(false);
      setPassword("");
      setMessage(error ? "Your password could not be changed. Request a new reset link and try again." : "Your password has been changed.");
    }}>
      <label htmlFor="new-password" className="block font-semibold">New password</label>
      <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} />
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save new password"}</Button>
    </form>}
    {message && <p className="mt-4 text-sm" role="status">{message}</p>}
    <a href="/auth" className="mt-6 text-teal underline">Back to login</a>
  </main>;
}