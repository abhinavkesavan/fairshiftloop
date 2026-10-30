import { z } from "zod";

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

// Deliberately fail closed. Replace this adapter only when real auth is connected.
export const authProvider: AuthProvider = {
  configured: false,
  async getUser() { return null; },
  async signIn(credentials) {
    loginSchema.parse(credentials);
    throw new Error(AUTH_UNAVAILABLE);
  },
  async signOut() {},
  onIdentityChange() { return () => {}; },
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