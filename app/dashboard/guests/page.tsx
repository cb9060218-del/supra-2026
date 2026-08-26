import React from "react";
import { createClient } from "@/lib/supabase/server";
import GuestList from "@/components/guests/GuestList";

export const revalidate = 0;

export default async function GuestsPage() {
  const supabase = await createClient();

  // Retrieve user session
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

  // Fetch guests joined with sponsors
  const { data: guests } = await supabase
    .from("guests")
    .select("*, sponsors(sponsor_name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch sponsors list for form mapping
  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("id, sponsor_name")
    .is("deleted_at", null)
    .order("sponsor_name", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Guest CRM & Registration</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage event invitees, RSVPs, accommodation details, and issue gatepasses.
        </p>
      </div>

      <GuestList
        initialGuests={(guests as any[]) || []}
        sponsors={(sponsors as any[]) || []}
        userRole={userRole}
      />
    </div>
  );
}
