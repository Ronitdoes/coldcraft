import { requireUserWithoutProfile } from "@/utils/supabase/auth";
import ResumeUploadClient from "./client";

export default async function ResumeUploadPage() {
  await requireUserWithoutProfile();
  return <ResumeUploadClient />;
}
