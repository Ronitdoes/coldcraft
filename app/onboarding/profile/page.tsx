import { requireUserWithoutProfile } from "@/utils/supabase/auth";
import ProfileReviewClient from "./client";

export default async function ProfileReviewPage() {
  await requireUserWithoutProfile();
  return <ProfileReviewClient />;
}
