import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Calendar, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import PassCard from "@/components/gatepass/PassCard";
import ActivityTimeline from "@/components/shared/ActivityTimeline";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function GuestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Retrieve user session and role
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

  const isWritable = ["super_admin", "admin", "coordinator"].includes(userRole);

  // Fetch Guest
  const { data: guest } = await supabase
    .from("guests")
    .select("*, sponsors(sponsor_name)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!guest) {
    notFound();
  }

  // Fetch Gatepass
  const { data: gatepass } = await supabase
    .from("gatepasses")
    .select("*, scanner:scanned_by(full_name)")
    .eq("guest_id", id)
    .is("deleted_at", null)
    .single();

  // Fetch Timeline Changes
  const { data: timeline } = await supabase
    .from("change_history")
    .select("*, users(full_name)")
    .eq("entity_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/dashboard/guests"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" /> Back to Guests
        </Link>
      </div>

      {/* Profile Header */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-zinc-100">{guest.guest_name}</h1>
            <span className="rounded bg-zinc-900 border border-zinc-850 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide text-zinc-300">
              {guest.guest_role}
            </span>
          </div>
          <p className="text-xs text-zinc-500">Guest ID: {guest.id}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:flex items-center">
          <div className="rounded border border-zinc-900 bg-zinc-950 px-4 py-2 text-center">
            <span className="block text-[10px] text-zinc-500 font-semibold uppercase">RSVP</span>
            <span className={`text-xs font-bold capitalize mt-1 block ${
              guest.attendance_status === "attended"
                ? "text-emerald-500"
                : guest.attendance_status === "confirmed"
                ? "text-sky-500"
                : guest.attendance_status === "declined"
                ? "text-red-500"
                : "text-zinc-500"
            }`}>
              {guest.attendance_status}
            </span>
          </div>

          <div className="rounded border border-zinc-900 bg-zinc-950 px-4 py-2 text-center">
            <span className="block text-[10px] text-zinc-500 font-semibold uppercase">Gatepass</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 block ${
              guest.gatepass_status === "scanned"
                ? "text-purple-500"
                : guest.gatepass_status === "issued"
                ? "text-emerald-500"
                : "text-zinc-500"
            }`}>
              {guest.gatepass_status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6 space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-zinc-500" /> Guest Details
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <span className="text-zinc-550 text-zinc-500 block uppercase font-medium">Designation</span>
                <span className="text-zinc-300 font-semibold mt-1 block">{guest.designation || "Guest"}</span>
              </div>
              <div>
                <span className="text-zinc-550 text-zinc-500 block uppercase font-medium">Company / Institute</span>
                <span className="text-zinc-300 font-semibold mt-1 block">
                  {guest.company || guest.sponsors?.sponsor_name || "Independent"}
                </span>
              </div>
              <div>
                <span className="text-zinc-550 text-zinc-500 block uppercase font-medium">Email Address</span>
                <span className="text-zinc-300 font-semibold mt-1 block">{guest.email || "N/A"}</span>
              </div>
              <div>
                <span className="text-zinc-550 text-zinc-500 block uppercase font-medium">Phone Number</span>
                <span className="text-zinc-300 font-semibold mt-1 block">{guest.phone || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Event dates & logistics */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6 space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-zinc-500" /> Track Logistics
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
              <div>
                <span className="text-zinc-550 text-zinc-500 block uppercase font-medium">Arrival Date</span>
                <span className="text-zinc-300 font-semibold mt-1 block">
                  {guest.arrival_date ? formatDate(guest.arrival_date) : "TBD"}
                </span>
              </div>
              <div>
                <span className="text-zinc-550 text-zinc-500 block uppercase font-medium">Departure Date</span>
                <span className="text-zinc-300 font-semibold mt-1 block">
                  {guest.departure_date ? formatDate(guest.departure_date) : "TBD"}
                </span>
              </div>
              <div>
                <span className="text-zinc-550 text-zinc-500 block uppercase font-medium">Accommodation</span>
                <span className="text-zinc-300 font-semibold mt-1 block">
                  {guest.accommodation_required ? "Required (Arranged)" : "Self Arranged"}
                </span>
              </div>
            </div>

            {guest.remarks && (
              <div className="border-t border-zinc-900 pt-4">
                <span className="text-zinc-550 text-zinc-500 text-xs block uppercase font-medium">Operations Remarks</span>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed bg-zinc-950/20 p-3 rounded border border-zinc-900">
                  {guest.remarks}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - QR Gatepass Scanner & Audits */}
        <div className="space-y-6">
          <PassCard
            guestId={guest.id}
            guestName={guest.guest_name}
            guestRole={guest.guest_role}
            company={guest.company || guest.sponsors?.sponsor_name}
            gatepassStatus={guest.gatepass_status}
            initialGatepass={gatepass as any}
            isWritable={isWritable}
          />

          <ActivityTimeline timeline={(timeline as any[]) || []} />
        </div>
      </div>
    </div>
  );
}
