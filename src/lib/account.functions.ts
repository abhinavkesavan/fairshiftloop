import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Invitations are private, email-bound and redeemed only by a verified account.
    const invitation = await context.supabase.rpc("accept_employer_invitation");
    if (invitation.error) throw new Error("Your account access could not be checked.");
    const [profile, roles, link] = await Promise.all([
      context.supabase.from("profiles").select("display_name, avatar_url").eq("id", context.userId).single(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
      context.supabase.from("employee_links").select("employee_reference").eq("user_id", context.userId).maybeSingle(),
    ]);
    if (profile.error || roles.error || link.error) throw new Error("Your account could not be loaded.");
    return { id: context.userId, displayName: profile.data.display_name, roles: roles.data.map((row) => row.role), employeeReference: link.data?.employee_reference ?? null };
  });