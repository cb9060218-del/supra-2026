import React from "react";
import { createClient } from "@/lib/supabase/server";
import OutreachDashboard from "@/components/outreach/OutreachDashboard";

export const revalidate = 0; // Fresh data on each load

export default async function OutreachPage() {
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

  // Retrieve outreach sponsors
  let sponsors: any[] = [];
  try {
    const { data: sData } = await supabase
      .from("outreach_sponsors")
      .select("*")
      .order("created_at", { ascending: false });
    if (sData) sponsors = sData;
  } catch {}

  // Retrieve templates
  let templates: any[] = [];
  try {
    const { data: tData } = await supabase
      .from("outreach_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (tData) templates = tData;
  } catch {}

  // Retrieve campaigns
  let campaigns: any[] = [];
  try {
    const { data: cData } = await supabase
      .from("outreach_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (cData) campaigns = cData;
  } catch {}

  // Retrieve logs
  let logs: any[] = [];
  try {
    const { data: lData } = await supabase
      .from("outreach_logs")
      .select("*")
      .order("sent_at", { ascending: false });
    if (lData) logs = lData;
  } catch {}

  // Retrieve followups
  let followups: any[] = [];
  try {
    const { data: fData } = await supabase
      .from("outreach_followups")
      .select("*")
      .order("scheduled_date", { ascending: true });
    if (fData) followups = fData;
  } catch {}

  // Retrieve attachments
  let attachments: any[] = [];
  try {
    const { data: aData } = await supabase
      .from("outreach_attachments")
      .select("*")
      .order("created_at", { ascending: false });
    if (aData) attachments = aData;
  } catch {}

  return (
    <div className="space-y-6">
      <OutreachDashboard
        initialSponsors={sponsors}
        initialTemplates={templates}
        initialCampaigns={campaigns}
        initialLogs={logs}
        initialFollowups={followups}
        initialAttachments={attachments}
        userRole={userRole}
      />
    </div>
  );
}
