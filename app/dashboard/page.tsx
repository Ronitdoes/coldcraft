import { requireUser } from "@/utils/supabase/auth";
import DashboardClient from "./client";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const { user, supabase } = await requireUser();

  // Concurrent fetching on the server
  const [profileResponse, mailResponse] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('mail_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  ]);

  return (
    <DashboardClient 
      initialUser={user}
      initialProfile={profileResponse.data}
      initialMailHistory={mailResponse.data || []}
    />
  );
}
