"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface KitItemInput {
  person_name: string;
  category: "OC" | "Jury" | "Sponsor" | "Volunteer" | "Custom";
  organization?: string;
  role_designation?: string;
  shirt_size: "XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "Custom" | "-";
  kit_issued?: boolean;
  sponsor_tshirt_given?: boolean;
  remarks?: string;
}

export async function createKitItemAction(data: KitItemInput, reason?: string) {
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
    .from("kits_distribution")
    .insert({
      person_name: data.person_name.trim(),
      category: data.category,
      organization: data.organization?.trim() || null,
      role_designation: data.role_designation?.trim() || null,
      shirt_size: data.shirt_size,
      kit_issued: !!data.kit_issued,
      sponsor_tshirt_given: !!data.sponsor_tshirt_given,
      remarks: data.remarks?.trim() || null,
      issued_by: data.kit_issued ? user.id : null,
      issued_at: data.kit_issued ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/kits");
  revalidatePath("/dashboard");
  return { success: true, data: created };
}

export async function updateKitFieldAction(
  id: string,
  field: string,
  value: any,
  reason?: string
) {
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

  const updatePayload: Record<string, any> = {
    [field]: value,
    updated_at: new Date().toISOString(),
  };

  if (field === "kit_issued") {
    updatePayload.issued_by = value ? user.id : null;
    updatePayload.issued_at = value ? new Date().toISOString() : null;
  }

  const { error } = await supabase
    .from("kits_distribution")
    .update(updatePayload)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/kits");
  return { success: true };
}

export async function toggleKitIssuedAction(id: string, currentVal: boolean) {
  return updateKitFieldAction(
    id,
    "kit_issued",
    !currentVal,
    `Toggled kit distribution status to ${!currentVal ? "Issued" : "Pending"}`
  );
}

export async function toggleSponsorTshirtAction(id: string, currentVal: boolean) {
  return updateKitFieldAction(
    id,
    "sponsor_tshirt_given",
    !currentVal,
    `Toggled sponsor t-shirt status to ${!currentVal ? "Given" : "Not Given"}`
  );
}

export async function deleteKitItemAction(id: string, reason?: string) {
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
    .from("kits_distribution")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/kits");
  return { success: true };
}

export async function importGuestsToSponsorKitsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Fetch all guests
  const { data: guests } = await supabase
    .from("guests")
    .select("guest_name, company, designation, remarks")
    .is("deleted_at", null);

  if (!guests || guests.length === 0) {
    return { error: "No guests found to import." };
  }

  // Fetch existing kits
  const { data: existingKits } = await supabase
    .from("kits_distribution")
    .select("person_name");

  const existingNames = new Set((existingKits || []).map((k) => k.person_name.toLowerCase().trim()));

  const newItems = guests
    .filter((g) => g.guest_name && !existingNames.has(g.guest_name.toLowerCase().trim()))
    .map((g) => ({
      person_name: g.guest_name.trim(),
      category: "Sponsor",
      organization: g.company || "Corporate Sponsor",
      role_designation: g.designation || "Delegate",
      shirt_size: "L",
      kit_issued: false,
      sponsor_tshirt_given: true,
      remarks: g.remarks || "Imported from Sponsor Guests list",
    }));

  if (newItems.length === 0) {
    return { message: "All guests are already in the Kits distribution tracker." };
  }

  const { error } = await supabase.from("kits_distribution").insert(newItems);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/kits");
  return { success: true, count: newItems.length };
}
