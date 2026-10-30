import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, ArrowRight, LoaderCircle, Info, UserRound, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authProvider, getVerifiedUser, loginSchema, safeReturnPath } from "@/lib/auth";

export function LoginPage({ returnTo }: { returnTo?: string }) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const result = loginSchema.safeParse({ identifier, password });
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      setErrors({ identifier: fields.identifier?.[0], password: fields.password?.[0] });
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await authProvider.signIn(result.data);
      const user = await getVerifiedUser(authProvider);
      if (!user) throw new Error("We couldn’t confirm your session. Please try logging in again.");
      setPassword("");
      await navigate({ to: safeReturnPath(returnTo), replace: true });
    } catch (cause) {
      setPassword("");
      setError(!authProvider.configured && cause instanceof Error ? cause.message : "We couldn’t log you in. Check your details and try again.");
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
            <div>
              <label htmlFor="login-identifier" className="mb-2 block text-sm font-semibold">Username or email</label>
              <div className="relative">
                <UserRound aria-hidden="true" className="absolute left-3.5 top-4 h-4 w-4 text-muted-foreground" />
                <Input id="login-identifier" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Enter your username or email" className="h-12 bg-card pl-10 text-base" value={identifier} maxLength={254} disabled={busy} aria-invalid={!!errors.identifier} aria-describedby={errors.identifier ? "identifier-error" : undefined} onChange={(e) => { setIdentifier(e.target.value); setErrors((old) => ({ ...old, identifier: undefined })); setError(""); }} />
              </div>
              {errors.identifier && <p id="identifier-error" role="alert" className="mt-1.5 text-sm text-destructive">{errors.identifier}</p>}
            </div>
            <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-semibold">Password</label>
              <div className="relative">
                <LockKeyhole aria-hidden="true" className="absolute left-3.5 top-4 h-4 w-4 text-muted-foreground" />
                <Input id="login-password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" className="h-12 bg-card pl-10 pr-12 text-base" value={password} maxLength={1024} disabled={busy} aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined} onChange={(e) => { setPassword(e.target.value); setErrors((old) => ({ ...old, password: undefined })); setError(""); }} />
                <Button type="button" variant="ghost" size="icon" disabled={busy} className="absolute right-1 top-1 h-10 w-10 text-muted-foreground" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} title={visible ? "Hide password" : "Show password"} onClick={() => setVisible((old) => !old)}>{visible ? <EyeOff /> : <Eye />}</Button>
              </div>
              {errors.password && <p id="password-error" role="alert" className="mt-1.5 text-sm text-destructive">{errors.password}</p>}
            </div>
            {error && <p role="alert" className="rounded-md border border-destructive/25 bg-destructive-soft p-3 text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy} className="h-12 w-full text-base font-semibold">{busy ? <><LoaderCircle className="animate-spin motion-reduce:animate-none" />Logging in…</> : <>Login<ArrowRight /></>}</Button>
          </form>
          {!authProvider.configured && <div className="mt-6 flex items-start gap-2.5 border-t border-border pt-5 text-sm text-muted-foreground"><Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-teal" /><p>Account sign-in is not connected yet. Login is unavailable until real user accounts are enabled.</p></div>}
        </div>
      </main>
      <footer className="px-5 py-5 text-center text-xs text-muted-foreground">FairShift TrustLoop · Decent work. Fair pay. A voice for everyone.</footer>
    </div>
  );
}