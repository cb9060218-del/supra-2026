"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function restoreRecordAction(tableName: string, id: string, reason: string) {
  if (!reason.trim()) return { error: "Please enter a reason for restoring this record." };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Verify authorization
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "admin"].includes(profile.role)) {
    return { error: "Permission Denied. Only administrators can restore archived records." };
  }

  // Set reason in SQL transaction session
  await supabase.rpc("set_change_reason", { reason });

  const { error } = await supabase
    .from(tableName)
    .update({
      deleted_at: null,
      deleted_by: null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/sponsors");
  revalidatePath("/dashboard/guests");
  revalidatePath("/dashboard");
  return { success: true };
}
