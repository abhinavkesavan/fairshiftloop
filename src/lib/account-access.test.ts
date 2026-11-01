import { describe, expect, it } from "vitest";
import { canAccessAccountPath } from "./account-access";

describe("Invitation-only employer access", () => {
  it("denies workers all employer pages", () => {
    for (const path of ["/admin", "/admin/", "/admin/reports", "/admin/leave", "/admin/salary"]) expect(canAccessAccountPath(path, ["worker"])).toBe(false);
  });
  it("allows verified employer roles to access employer pages", () => {
    expect(canAccessAccountPath("/admin/reports", ["worker", "employer"])).toBe(true);
  });
  it("allows workers their protected home", () => {
    expect(canAccessAccountPath("/dashboard", ["worker"])).toBe(true);
  });
});