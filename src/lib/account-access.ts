export type AccountRole = "worker" | "employer";

export function canAccessAccountPath(path: string, roles: readonly AccountRole[]): boolean {
  return !/^\/admin(?:\/|$)/.test(path) || roles.includes("employer");
}