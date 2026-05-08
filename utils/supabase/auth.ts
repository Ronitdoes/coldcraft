import { redirect } from "next/navigation";
import { createClient } from "./server";

/**
 * Server-side helper: gets the authenticated user or redirects to login.
 * Use in Server Components and API routes.
 */
export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

/**
 * Server-side helper: gets the authenticated user and their profile.
 * Redirects to login if not authenticated, or to onboarding if no profile.
 */
export async function requireUserWithProfile(
  select = "name, college, year, github, linkedin, portfolio, skills, projects"
) {
  const { supabase, user } = await requireUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(select + ", onboarding_completed")
    .eq("id", user.id)
    .single();

  if (error || !profile || !(profile as any).onboarding_completed) {
    redirect("/onboarding/resume");
  }

  return { supabase, user, profile };
}

/**
 * Server-side helper: gets the authenticated user and checks if they already have a profile.
 * Redirects to dashboard if they DO have a profile.
 * Used for protecting onboarding routes from already onboarded users.
 */
export async function requireUserWithoutProfile() {
  const { supabase, user } = await requireUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Profile lookup error:", error);
  } else if ((profile as any)?.onboarding_completed) {
    redirect("/dashboard");
  }

  return { supabase, user };
}
