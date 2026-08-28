import React from "react";
import { createClient } from "@/lib/supabase/server";
import StickersView from "@/components/stickers/StickersView";

export const revalidate = 0; // Disable caching to fetch live checkbox states

export default async function StickersPage() {
  const supabase = await createClient();

  // 1. Fetch Competing Teams list
  const { data: teams } = await supabase
    .from("teams")
    .select("num, name")
    .order("num", { ascending: true });

  // 2. Fetch Sticker Companies
  const { data: companies } = await supabase
    .from("sticker_companies")
    .select("id, company_name, sticker_size")
    .order("company_name", { ascending: true });

  // 3. Fetch Placement statuses
  const { data: placements } = await supabase
    .from("sticker_placements")
    .select("company_id, team_number, is_placed");

  // 4. Fetch Overall Sticker check status
  const { data: overallStatus } = await supabase
    .from("team_sticker_status")
    .select("team_number, is_placed");

  // 5. Get User Role
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

  return (
    <StickersView
      initialTeams={teams || []}
      initialCompanies={companies || []}
      initialPlacements={placements || []}
      initialOverallStatus={overallStatus || []}
      userRole={userRole}
    />
  );
}
