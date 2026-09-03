import React from "react";
import { createClient } from "@/lib/supabase/server";
import KitsView from "@/components/kits/KitsView";

export const revalidate = 0; // Fresh data on each load

export default async function KitsPage() {
  const supabase = await createClient();

  // Retrieve user session & role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole = "viewer";
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile) userRole = profile.role;
  }

  // Retrieve kit distribution records
  let kits: any[] = [];
  try {
    const { data: kitsData } = await supabase
      .from("kits_distribution")
      .select("*")
      .order("created_at", { ascending: true });
    if (kitsData) kits = kitsData;
  } catch {
    // Graceful fallback if table is not yet migrated in Supabase
  }

  return (
    <div className="space-y-6">
      <KitsView initialKits={kits} userRole={userRole} />
    </div>
  );
}
