"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function verifyUserAction(targetUserId: string, isVerified: boolean, reason?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return { error: "Only Super Admins can verify users." };
  }

  // Set change reason
  if (reason) {
    await supabase.rpc("set_change_reason", { reason });
  }

  const { error } = await supabase
    .from("users")
    .update({
      is_verified: isVerified,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId);

  if (error) return { error: error.message };

  // Write notification for the user
  await supabase.from("notifications").insert({
    user_id: targetUserId,
    title: isVerified ? "Account Approved!" : "Account Unverified",
    message: isVerified
      ? "An administrator has approved your account. Welcome to SUPRA SAEINDIA 2026."
      : "Your account verification status has been revoked.",
  });

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function updateUserRoleAction(targetUserId: string, role: "super_admin" | "admin" | "coordinator" | "viewer", reason?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return { error: "Only Super Admins can update roles." };
  }

  // Set change reason
  if (reason) {
    await supabase.rpc("set_change_reason", { reason });
  }

  const { error } = await supabase
    .from("users")
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function toggleUserActiveAction(targetUserId: string, isActive: boolean, reason?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return { error: "Only Super Admins can toggle account active status." };
  }

  if (reason) {
    await supabase.rpc("set_change_reason", { reason });
  }

  const { error } = await supabase
    .from("users")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/users");
  return { success: true };
}
