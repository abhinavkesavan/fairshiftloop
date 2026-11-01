import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, ArrowRight, LoaderCircle, Info, UserRound, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authProvider, getVerifiedUser, loginSchema, safeReturnPath } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import "@lovable.dev/cloud-auth-js/styles.css";

export function LoginPage({ returnTo }: { returnTo?: string }) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string | undefined; password?: string | undefined }>({});
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [displayName, setDisplayName] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    // Handles both popup sign-in and email-confirmation returns on this public page.
    void getVerifiedUser(authProvider).then((user) => {
      if (user) {
        const target = safeReturnPath(sessionStorage.getItem("fairshift-return") ?? returnTo);
        sessionStorage.removeItem("fairshift-return");
        void navigate({ to: target, replace: true });
      }
    });
  }, [navigate, returnTo]);

  async function social(provider: "google" | "lovable") {
    setError("");
    sessionStorage.setItem("fairshift-return", safeReturnPath(returnTo));
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
      if (result.error) throw result.error;
      if (result.redirected) return;
      if (await getVerifiedUser(authProvider)) await navigate({ to: safeReturnPath(returnTo), replace: true });
    } catch { setError("Sign-in could not be completed. Please try again."); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) {
      setErrors({ identifier: "Enter a valid account email address." });
      return;
    }
    if (mode === "forgot") {
      setBusy(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(identifier.trim(), { redirectTo: `${window.location.origin}/reset-password` });
      setBusy(false);
      if (resetError) setError("We couldn’t send a reset link. Please try again.");
      else setNotice("If an account exists for this email, a password-reset link will arrive shortly.");
      return;
    }
    const result = loginSchema.safeParse({ identifier, password });
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      setErrors({ identifier: fields.identifier?.[0], password: fields.password?.[0] });
      return;
    }
    setErrors({});
    if (mode === "signup" && password.length < 8) { setErrors({ password: "Use at least 8 characters." }); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: signupError } = await supabase.auth.signUp({ email: result.data.identifier, password: result.data.password, options: { data: { display_name: displayName.trim() }, emailRedirectTo: `${window.location.origin}/auth` } });
        if (signupError) throw signupError;
        setPassword("");
        setNotice("Check your email to confirm your account before signing in.");
        return;
      }
      await authProvider.signIn(result.data);
      const user = await getVerifiedUser(authProvider);
      if (!user) throw new Error("We couldn’t confirm your session. Please try logging in again.");
      setPassword("");
      await navigate({ to: safeReturnPath(returnTo), replace: true });
    } catch (cause) {
      setPassword("");
      setError(mode === "signup" ? "We couldn’t create your account. Check your details and try again." : "We couldn’t log you in. Check your details and confirm your email, then try again.");
    } finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-5">
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-navy font-display text-xl font-extrabold text-navy-foreground">F<span className="sr-only">airShift</span></span>
          <span className="font-display text-lg font-extrabold text-primary">FairShift <span className="font-semibold text-teal">TrustLoop</span></span>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:py-14">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <span className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal"><span className="h-1.5 w-1.5 rounded-full bg-teal" /> WORKPLACE PORTAL</span>
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-normal text-primary">Welcome to<br />FairShift TrustLoop</h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">A more transparent and supportive workplace starts here.</p>
          </div>
          <form onSubmit={submit} noValidate aria-busy={busy} className="space-y-5">
            {mode === "signup" && <div><label htmlFor="display-name" className="mb-2 block text-sm font-semibold">Display name</label><Input id="display-name" autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} className="h-12 bg-card" /></div>}
            <div>
              <label htmlFor="login-identifier" className="mb-2 block text-sm font-semibold">Email address</label>
              <div className="relative">
                <UserRound aria-hidden="true" className="absolute left-3.5 top-4 h-4 w-4 text-muted-foreground" />
                <Input id="login-identifier" type="email" name="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="Enter your email address" className="h-12 bg-card pl-10 text-base" value={identifier} maxLength={254} disabled={busy} aria-invalid={!!errors.identifier} aria-describedby={errors.identifier ? "identifier-error" : undefined} onChange={(e) => { setIdentifier(e.target.value); setErrors((old) => ({ ...old, identifier: undefined })); setError(""); }} />
              </div>
              {errors.identifier && <p id="identifier-error" role="alert" className="mt-1.5 text-sm text-destructive">{errors.identifier}</p>}
            </div>
            {mode !== "forgot" && <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-semibold">Password</label>
              <div className="relative">
                <LockKeyhole aria-hidden="true" className="absolute left-3.5 top-4 h-4 w-4 text-muted-foreground" />
                <Input id="login-password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" className="h-12 bg-card pl-10 pr-12 text-base" value={password} maxLength={1024} disabled={busy} aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined} onChange={(e) => { setPassword(e.target.value); setErrors((old) => ({ ...old, password: undefined })); setError(""); }} />
                <Button type="button" variant="ghost" size="icon" disabled={busy} className="absolute right-1 top-1 h-10 w-10 text-muted-foreground" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} title={visible ? "Hide password" : "Show password"} onClick={() => setVisible((old) => !old)}>{visible ? <EyeOff /> : <Eye />}</Button>
              </div>
              {errors.password && <p id="password-error" role="alert" className="mt-1.5 text-sm text-destructive">{errors.password}</p>}
            </div>}
            {error && <p role="alert" className="rounded-md border border-destructive/25 bg-destructive-soft p-3 text-sm text-destructive">{error}</p>}
            {notice && <p role="status" className="text-sm text-teal">{notice}</p>}
            <Button type="submit" disabled={busy} className="h-12 w-full text-base font-semibold">{busy ? <><LoaderCircle className="animate-spin motion-reduce:animate-none" />Please wait…</> : <>{mode === "signup" ? "Create worker account" : mode === "forgot" ? "Send reset link" : "Login"}<ArrowRight /></>}</Button>
          </form>
          <div className="mt-3 flex flex-wrap justify-between gap-2">
            <Button variant="link" disabled={busy} onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setNotice(""); setErrors({}); }}>{mode === "signup" ? "Back to login" : "Create worker account"}</Button>
            <Button variant="link" disabled={busy} onClick={() => { setMode(mode === "forgot" ? "login" : "forgot"); setError(""); setNotice(""); setErrors({}); }}>{mode === "forgot" ? "Back to login" : "Forgot password?"}</Button>
          </div>
          {mode !== "forgot" && <div className="mt-5 grid gap-3 border-t border-border pt-5">
            <Button type="button" variant="outline" className="h-12" onClick={() => void social("google")}>Continue with Google</Button>
            <Button type="button" className="lovable-auth-button" onClick={() => void social("lovable")}>Continue with Lovable</Button>
          </div>}
          <div className="mt-6 flex items-start gap-2.5 border-t border-border pt-5 text-sm text-muted-foreground"><Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-teal" /><p>Employer access is invitation-only.</p></div>
        </div>
      </main>
      <footer className="px-5 py-5 text-center text-xs text-muted-foreground">FairShift TrustLoop · Decent work. Fair pay. A voice for everyone.</footer>
    </div>
  );
}