"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SponsorSchema, InteractionSchema } from "@/lib/validators";

export async function createSponsorAction(data: any) {
  const validation = SponsorSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const payload = validation.data;
  const supabase = await createClient();

  // Retrieve current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Set change reason
  if (payload.change_reason) {
    await supabase.rpc("set_change_reason", { reason: payload.change_reason });
  }

  const { error } = await supabase.from("sponsors").insert({
    sponsor_name: payload.sponsor_name,
    sponsor_tier: payload.sponsor_tier,
    sponsorship_amount: payload.sponsorship_amount,
    payment_status: payload.payment_status,
    lead_status: payload.lead_status,
    contact_person: payload.contact_person,
    email: payload.email || null,
    phone: payload.phone || null,
    notes: payload.notes || null,
    updated_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/sponsors");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateSponsorAction(data: any) {
  const validation = SponsorSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const payload = validation.data;
  if (!payload.id) return { error: "Sponsor ID is required for updates" };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // 1. Fetch current version to check conflict
  const { data: current } = await supabase
    .from("sponsors")
    .select("version")
    .eq("id", payload.id)
    .is("deleted_at", null)
    .single();

  if (!current) return { error: "Sponsor not found or was deleted by another user" };

  if (current.version !== payload.version) {
    return { error: "conflict" };
  }

  // Set change reason in transaction session
  if (payload.change_reason) {
    await supabase.rpc("set_change_reason", { reason: payload.change_reason });
  }

  // 2. Perform the update checking version matches
  const { error, count } = await supabase
    .from("sponsors")
    .update({
      sponsor_name: payload.sponsor_name,
      sponsor_tier: payload.sponsor_tier,
      sponsorship_amount: payload.sponsorship_amount,
      payment_status: payload.payment_status,
      lead_status: payload.lead_status,
      contact_person: payload.contact_person,
      email: payload.email || null,
      phone: payload.phone || null,
      notes: payload.notes || null,
      version: current.version + 1,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .eq("version", payload.version);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/sponsors/${payload.id}`);
  revalidatePath("/dashboard/sponsors");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteSponsorAction(id: string, reason?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (reason) {
    await supabase.rpc("set_change_reason", { reason });
  }

  // Soft delete
  const { error } = await supabase
    .from("sponsors")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/sponsors");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function addSponsorInteractionAction(data: any) {
  const validation = InteractionSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const payload = validation.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("sponsor_interactions").insert({
    sponsor_id: payload.sponsor_id,
    type: payload.type,
    summary: payload.summary,
    details: payload.details || null,
    logged_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/sponsors/${payload.sponsor_id}`);
  return { success: true };
}

export async function updateBenefitStatusAction(benefitId: string, sponsorId: string, status: "pending" | "in_progress" | "completed", remarks?: string, reason?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (reason) {
    await supabase.rpc("set_change_reason", { reason });
  }

  const { error } = await supabase
    .from("sponsor_benefits")
    .update({
      status,
      remarks: remarks || null,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", benefitId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/sponsors/${sponsorId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createBenefitAction(sponsorId: string, benefitName: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (reason) {
    await supabase.rpc("set_change_reason", { reason });
  }

  const { error } = await supabase.from("sponsor_benefits").insert({
    sponsor_id: sponsorId,
    benefit_name: benefitName,
    status: "pending",
    updated_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/sponsors");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteBenefitAction(benefitId: string, sponsorId: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (reason) {
    await supabase.rpc("set_change_reason", { reason });
  }

  // Soft delete benefit
  const { error } = await supabase
    .from("sponsor_benefits")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq("id", benefitId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/sponsors");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateSponsorPaymentStatusAction(sponsorId: string, paymentStatus: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (reason) {
    await supabase.rpc("set_change_reason", { reason });
  }

  const { error } = await supabase
    .from("sponsors")
    .update({
      payment_status: paymentStatus,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sponsorId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/sponsors");
  revalidatePath("/dashboard");
  return { success: true };
}
