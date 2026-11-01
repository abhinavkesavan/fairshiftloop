import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your username or email.").max(254, "Use no more than 254 characters.").refine((value) => !value.includes("@") || z.string().email().safeParse(value).success, "Enter a valid email address."),
  password: z.string().min(1, "Enter your password.").max(1024, "Password is too long."),
});

export type LoginCredentials = z.infer<typeof loginSchema>;
export type AuthUser = { id: string; displayName?: string };
export interface AuthProvider {
  readonly configured: boolean;
  // A real adapter must revalidate identity with its provider, not browser storage.
  getUser(): Promise<AuthUser | null>;
  signIn(credentials: LoginCredentials): Promise<void>;
  signOut(): Promise<void>;
  onIdentityChange(listener: () => void): () => void;
}

export const AUTH_UNAVAILABLE = "Login is not available yet because the account service is not connected. No credentials have been sent or saved.";

// Identity is always revalidated with the real account provider.
export const authProvider: AuthProvider = {
  configured: true,
  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id };
  },
  async signIn(credentials) {
    const values = loginSchema.parse(credentials);
    if (!z.string().email().safeParse(values.identifier).success) throw new Error("Use your account email address to sign in.");
    const { error } = await supabase.auth.signInWithPassword({ email: values.identifier, password: values.password });
    if (error) throw error;
  },
  async signOut() { const { error } = await supabase.auth.signOut(); if (error) throw error; },
  onIdentityChange(listener) {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) listener();
    });
    return () => data.subscription.unsubscribe();
  },
};

export async function getVerifiedUser(provider: AuthProvider): Promise<AuthUser | null> {
  if (!provider.configured) return null;
  try { return await provider.getUser(); } catch { return null; }
}

export function safeReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return "/dashboard";
  const path = value.split(/[?#]/)[0];
  return ["/dashboard", "/payslip", "/shifts", "/leave", "/report", "/track", "/admin", "/admin/", "/admin/reports", "/admin/leave", "/admin/salary"].includes(path ?? "") ? value : "/dashboard";
}

export async function endSession(provider: AuthProvider, cache: { cancelQueries(): Promise<unknown>; clear(): void }, returnToLogin: () => Promise<unknown>) {
  await cache.cancelQueries();
  cache.clear();
  await provider.signOut();
  await returnToLogin();
}