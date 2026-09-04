"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. SPONSOR LEADS ACTIONS
// ==========================================

export interface OutreachSponsorInput {
  company_name: string;
  contact_person: string;
  phone?: string;
  email?: string;
  category: string;
  status?: string;
  target_amount?: number;
  secured_amount?: number;
  notes?: string;
  city?: string;
  state?: string;
}

export async function createOutreachSponsorAction(data: OutreachSponsorInput, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (reason) {
    try {
      await supabase.rpc("set_change_reason", { reason });
    } catch {}
  }

  const { data: created, error } = await supabase
    .from("outreach_sponsors")
    .insert({
      company_name: data.company_name.trim(),
      contact_person: data.contact_person.trim(),
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      category: data.category || "Automotive",
      status: data.status || "not_contacted",
      target_amount: data.target_amount || 0,
      secured_amount: data.secured_amount || 0,
      notes: data.notes?.trim() || null,
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true, data: created };
}

export async function updateOutreachSponsorAction(id: string, data: Partial<OutreachSponsorInput>, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (reason) {
    try {
      await supabase.rpc("set_change_reason", { reason });
    } catch {}
  }

  const { error } = await supabase
    .from("outreach_sponsors")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true };
}

export async function updateLeadStatusAction(id: string, status: string, notes?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const updatePayload: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "contacted") {
    updatePayload.last_contacted_at = new Date().toISOString();
  }

  if (notes) {
    updatePayload.notes = notes;
  }

  const { error } = await supabase
    .from("outreach_sponsors")
    .update(updatePayload)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true };
}

export async function deleteOutreachSponsorAction(id: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (reason) {
    try {
      await supabase.rpc("set_change_reason", { reason });
    } catch {}
  }

  const { error } = await supabase.from("outreach_sponsors").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true };
}

export async function importFromExistingSponsorsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // 1. Fetch from sponsors
  const { data: existingSponsors } = await supabase
    .from("sponsors")
    .select("sponsor_name, contact_person, phone, email, notes, sponsorship_amount, payment_status, lead_status")
    .is("deleted_at", null);

  if (!existingSponsors || existingSponsors.length === 0) {
    return { error: "No existing sponsors found in CRM." };
  }

  // 2. Fetch existing outreach sponsors
  const { data: outreachSponsors } = await supabase
    .from("outreach_sponsors")
    .select("company_name");

  const existingNames = new Set((outreachSponsors || []).map((s) => s.company_name.toLowerCase().trim()));

  const newLeads = existingSponsors
    .filter((s) => s.sponsor_name && !existingNames.has(s.sponsor_name.toLowerCase().trim()))
    .map((s) => {
      const isPaid = s.payment_status === "paid" || s.payment_status === "Payment Received";
      const status = isPaid ? "sponsored" : s.lead_status === "confirmed" ? "meeting_scheduled" : "contacted";

      return {
        company_name: s.sponsor_name.trim(),
        contact_person: s.contact_person || `${s.sponsor_name} Lead`,
        phone: s.phone || null,
        email: s.email || null,
        category: "Automotive",
        status: status,
        target_amount: parseFloat(s.sponsorship_amount as any) || 0,
        secured_amount: isPaid ? parseFloat(s.sponsorship_amount as any) || 0 : 0,
        notes: s.notes || "Imported from Sponsors CRM",
      };
    });

  if (newLeads.length === 0) {
    return { message: "All existing CRM sponsors are already imported." };
  }

  const { error } = await supabase.from("outreach_sponsors").insert(newLeads);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true, count: newLeads.length };
}


// ==========================================
// 2. MESSAGE TEMPLATES ACTIONS
// ==========================================

export interface TemplateInput {
  title: string;
  channel: "whatsapp" | "email" | "multi";
  category: string;
  subject?: string;
  body: string;
}

export async function createTemplateAction(data: TemplateInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: created, error } = await supabase
    .from("outreach_templates")
    .insert({
      title: data.title.trim(),
      channel: data.channel,
      category: data.category,
      subject: data.subject?.trim() || null,
      body: data.body.trim(),
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true, data: created };
}

export async function updateTemplateAction(id: string, data: Partial<TemplateInput>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("outreach_templates")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true };
}

export async function deleteTemplateAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("outreach_templates").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true };
}


// ==========================================
// 3. CAMPAIGNS ACTIONS
// ==========================================

export interface CampaignInput {
  title: string;
  description?: string;
  target_category?: string;
  target_sponsorship_goal?: number;
  status?: string;
}

export async function createCampaignAction(data: CampaignInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: created, error } = await supabase
    .from("outreach_campaigns")
    .insert({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      target_category: data.target_category || "All",
      target_sponsorship_goal: data.target_sponsorship_goal || 0,
      status: data.status || "active",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true, data: created };
}

export async function updateCampaignAction(id: string, data: Partial<CampaignInput>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("outreach_campaigns")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true };
}

export async function deleteCampaignAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("outreach_campaigns").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true };
}


// ==========================================
// 4. BATCH OUTREACH LOGGING & DISPATCH
// ==========================================

export interface BatchLogItem {
  sponsor_id: string;
  campaign_id?: string;
  template_id?: string;
  channel: "whatsapp" | "email" | "call" | "meeting";
  message_content: string;
  delivery_status: "queued" | "sent" | "delivered" | "replied" | "failed";
}

export async function logBatchOutreachMessagesAction(items: BatchLogItem[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const logsToInsert = items.map((item) => ({
    ...item,
    sent_by: user.id,
    sent_at: new Date().toISOString(),
  }));

  const { error: logError } = await supabase.from("outreach_logs").insert(logsToInsert);
  if (logError) return { error: logError.message };

  // Also update last_contacted_at and status on sponsors
  const sponsorIds = items.map((i) => i.sponsor_id);
  await supabase
    .from("outreach_sponsors")
    .update({
      status: "contacted",
      last_contacted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("id", sponsorIds);

  revalidatePath("/dashboard/outreach");
  return { success: true, count: items.length };
}

export async function updateOutreachLogStatusAction(logId: string, status: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("outreach_logs")
    .update({ delivery_status: status })
    .eq("id", logId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true };
}


// ==========================================
// 5. FOLLOW-UP REMINDERS
// ==========================================

export interface FollowupInput {
  sponsor_id: string;
  scheduled_date: string;
  scheduled_time?: string;
  priority: "low" | "medium" | "high" | "urgent";
  notes: string;
}

export async function scheduleFollowupAction(data: FollowupInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: created, error } = await supabase
    .from("outreach_followups")
    .insert({
      sponsor_id: data.sponsor_id,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time || null,
      priority: data.priority || "medium",
      notes: data.notes.trim(),
      assigned_to: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true, data: created };
}

export async function toggleFollowupDoneAction(id: string, isCompleted: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("outreach_followups")
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true };
}

export async function deleteFollowupAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("outreach_followups").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true };
}


// ==========================================
// 6. ATTACHMENT DOCUMENTS
// ==========================================

export interface AttachmentInput {
  title: string;
  doc_type: "Brochure" | "Team Profile" | "Proposal Deck" | "Rate Card" | "Image" | "Other";
  file_name: string;
  file_url: string;
  file_size?: string;
  version?: string;
  description?: string;
}

export async function createOutreachAttachmentAction(data: AttachmentInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: created, error } = await supabase
    .from("outreach_attachments")
    .insert({
      title: data.title.trim(),
      doc_type: data.doc_type,
      file_name: data.file_name.trim(),
      file_url: data.file_url.trim(),
      file_size: data.file_size || "1.0 MB",
      version: data.version || "v1.0",
      description: data.description?.trim() || null,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true, data: created };
}

export async function deleteOutreachAttachmentAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("outreach_attachments").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/outreach");
  return { success: true };
}
