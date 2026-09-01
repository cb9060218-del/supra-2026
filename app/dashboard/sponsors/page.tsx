import React from "react";
import { createClient } from "@/lib/supabase/server";
import SponsorList from "@/components/sponsors/SponsorList";

export const revalidate = 0; // Fetch fresh data on load

export default async function SponsorsPage() {
  const supabase = await createClient();

  // Retrieve user session and profile role
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

  // Retrieve active sponsors
  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("*")
    .is("deleted_at", null)
    .order("sponsor_name", { ascending: true });

  // Retrieve active guests
  const { data: guests } = await supabase
    .from("guests")
    .select("*")
    .is("deleted_at", null)
    .order("guest_name", { ascending: true });

  // Retrieve active sponsor benefits
  const { data: benefits } = await supabase
    .from("sponsor_benefits")
    .select("*")
    .is("deleted_at", null);

  // Retrieve sponsor media (photos/videos)
  let media: any[] = [];
  try {
    const { data: mediaData } = await supabase
      .from("sponsor_media")
      .select("*")
      .order("created_at", { ascending: false });
    if (mediaData) media = mediaData;
  } catch {
    // Graceful fallback if table is not yet migrated in Supabase
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Sponsor & Benefit Tracker</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Buddh International Circuit, Greater Noida — 2–5 September 2026
        </p>
      </div>

      <SponsorList
        initialSponsors={(sponsors as any[]) || []}
        initialGuests={(guests as any[]) || []}
        initialBenefits={(benefits as any[]) || []}
        initialMedia={media}
        userRole={userRole}
      />
    </div>
  );
}
