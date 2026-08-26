"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { GuestSchema } from "@/lib/validators";

export async function createGuestAction(data: any) {
  const validation = GuestSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const payload = validation.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (payload.change_reason) {
    await supabase.rpc("set_change_reason", { reason: payload.change_reason });
  }

  const { error } = await supabase.from("guests").insert({
    guest_name: payload.guest_name,
    sponsor_id: payload.sponsor_id || null,
    designation: payload.designation || null,
    company: payload.company || null,
    email: payload.email || null,
    phone: payload.phone || null,
    attendance_status: payload.attendance_status,
    guest_role: payload.guest_role,
    arrival_date: payload.arrival_date || null,
    departure_date: payload.departure_date || null,
    accommodation_required: payload.accommodation_required,
    remarks: payload.remarks || null,
    updated_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/guests");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateGuestAction(data: any) {
  const validation = GuestSchema.safeParse(data);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const payload = validation.data;
  if (!payload.id) return { error: "Guest ID is required for updates" };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Fetch current version
  const { data: current } = await supabase
    .from("guests")
    .select("version")
    .eq("id", payload.id)
    .is("deleted_at", null)
    .single();

  if (!current) return { error: "Guest not found or deleted" };

  if (current.version !== payload.version) {
    return { error: "conflict" };
  }

  if (payload.change_reason) {
    await supabase.rpc("set_change_reason", { reason: payload.change_reason });
  }

  const { error } = await supabase
    .from("guests")
    .update({
      guest_name: payload.guest_name,
      sponsor_id: payload.sponsor_id || null,
      designation: payload.designation || null,
      company: payload.company || null,
      email: payload.email || null,
      phone: payload.phone || null,
      attendance_status: payload.attendance_status,
      guest_role: payload.guest_role,
      arrival_date: payload.arrival_date || null,
      departure_date: payload.departure_date || null,
      accommodation_required: payload.accommodation_required,
      remarks: payload.remarks || null,
      version: current.version + 1,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .eq("version", payload.version);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/guests/${payload.id}`);
  revalidatePath("/dashboard/guests");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteGuestAction(id: string, reason?: string) {
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
    .from("guests")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/guests");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function bulkImportGuestsAction(guestsList: any[], reason?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (reason) {
    await supabase.rpc("set_change_reason", { reason });
  }

  // Bulk insert
  const formatted = guestsList.map((g) => ({
    guest_name: g.guest_name,
    designation: g.designation || null,
    company: g.company || null,
    email: g.email || null,
    phone: g.phone || null,
    guest_role: g.guest_role || "sponsor",
    attendance_status: g.attendance_status || "invited",
    accommodation_required: g.accommodation_required === true,
    remarks: g.remarks || null,
    updated_by: user.id,
  }));

  const { error } = await supabase.from("guests").insert(formatted);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/guests");
  revalidatePath("/dashboard");
  return { success: true, count: formatted.length };
}

export async function generateGatepassAction(guestId: string, reason?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Set change reason
  if (reason) {
    await supabase.rpc("set_change_reason", { reason });
  }

  // Generate unique secure token
  const qrCodeToken = `SUPRA2026_${crypto.randomUUID().replace(/-/g, "").substring(0, 16).toUpperCase()}`;

  // Insert Gatepass
  const { error: gatepassError } = await supabase.from("gatepasses").insert({
    guest_id: guestId,
    qr_code: qrCodeToken,
    issued_by: user.id,
  });

  if (gatepassError) return { error: gatepassError.message };

  // Update guest status
  const { error: guestError } = await supabase
    .from("guests")
    .update({
      gatepass_status: "issued",
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", guestId);

  if (guestError) return { error: guestError.message };

  revalidatePath(`/dashboard/guests/${guestId}`);
  revalidatePath("/dashboard/guests");
  return { success: true, qr_code: qrCodeToken };
}

export async function verifyGatepassScanAction(qrCode: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Fetch gatepass checking join tables
  const { data: gatepass, error } = await supabase
    .from("gatepasses")
    .select("*, guests(*), scanner:scanned_by(full_name)")
    .eq("qr_code", qrCode)
    .is("deleted_at", null)
    .single();

  if (error || !gatepass) {
    return { error: "Invalid Gatepass! This QR code does not belong to any registered ticket." };
  }

  if (gatepass.status === "scanned") {
    const scannedAt = new Date(gatepass.scanned_at).toLocaleString("en-IN");
    const scannedBy = gatepass.scanner?.full_name || "another coordinator";
    return {
      error: `Duplicate Scan Blocked! This pass was already scanned on ${scannedAt} by ${scannedBy}. Access denied.`,
      guest: gatepass.guests,
    };
  }

  if (gatepass.status === "expired") {
    return { error: "This gatepass has been marked as expired by administrator." };
  }

  // Set scanning change reason
  await supabase.rpc("set_change_reason", { reason: "Checked in via QR code scan" });

  // Update gatepass state to scanned
  await supabase
    .from("gatepasses")
    .update({
      status: "scanned",
      scanned_at: new Date().toISOString(),
      scanned_by: user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", gatepass.id);

  // Update guest check-in
  await supabase
    .from("guests")
    .update({
      attendance_status: "attended",
      gatepass_status: "scanned",
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", gatepass.guest_id);

  revalidatePath("/dashboard/guests");
  revalidatePath("/dashboard");
  return {
    success: true,
    guest: gatepass.guests,
  };
}

export async function updateGuestFieldInlineAction(guestId: string, field: string, value: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const allowedFields = ["guest_name", "designation", "email", "phone", "remarks", "attendance_status"];
  let dbField = field;
  if (field === "name") dbField = "guest_name";
  if (field === "contact") dbField = "phone";
  if (field === "date") dbField = "remarks";

  if (!allowedFields.includes(dbField)) {
    return { error: "Invalid field: " + dbField };
  }

  if (reason) {
    await supabase.rpc("set_change_reason", { reason });
  }

  const { error } = await supabase
    .from("guests")
    .update({
      [dbField]: value === "" ? null : value,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", guestId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/sponsors");
  revalidatePath("/dashboard/guests");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleGuestGatepassAction(guestId: string, currentStatus: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (reason) {
    await supabase.rpc("set_change_reason", { reason });
  }

  if (currentStatus === "issued" || currentStatus === "scanned") {
    // Delete/expire gatepass
    await supabase
      .from("gatepasses")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq("guest_id", guestId);

    await supabase
      .from("guests")
      .update({
        gatepass_status: "not_issued",
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", guestId);
  } else {
    // Generate new gatepass
    const qrCodeToken = `SUPRA2026_${crypto.randomUUID().replace(/-/g, "").substring(0, 16).toUpperCase()}`;

    await supabase.from("gatepasses").insert({
      guest_id: guestId,
      qr_code: qrCodeToken,
      issued_by: user.id,
    });

    await supabase
      .from("guests")
      .update({
        gatepass_status: "issued",
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", guestId);
  }

  revalidatePath("/dashboard/sponsors");
  revalidatePath("/dashboard/guests");
  revalidatePath("/dashboard");
  return { success: true };
}
