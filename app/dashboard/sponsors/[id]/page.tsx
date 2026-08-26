import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, BadgeAlert, BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, getSponsorTierColor, getLeadStatusColor } from "@/lib/utils";
import BenefitList from "@/components/sponsors/BenefitList";
import InteractionList from "@/components/shared/InteractionList";
import SponsorDocs from "@/components/shared/SponsorDocs";
import ActivityTimeline from "@/components/shared/ActivityTimeline";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function SponsorDetailPage({ params }: PageProps) {
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

  // Fetch Sponsor
  const { data: sponsor } = await supabase
    .from("sponsors")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!sponsor) {
    notFound();
  }

  // Fetch Benefits
  const { data: benefits } = await supabase
    .from("sponsor_benefits")
    .select("*")
    .eq("sponsor_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  // Fetch Interactions
  const { data: interactions } = await supabase
    .from("sponsor_interactions")
    .select("*, users(full_name)")
    .eq("sponsor_id", id)
    .order("created_at", { ascending: false });

  // Fetch Timeline Changes
  const { data: timeline } = await supabase
    .from("change_history")
    .select("*, users(full_name)")
    .eq("entity_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Back breadcrumb */}
      <div>
        <Link
          href="/dashboard/sponsors"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" /> Back to Sponsors
        </Link>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-zinc-100">{sponsor.sponsor_name}</h1>
            <span className={`rounded px-1.5 py-0.5 border text-[10px] uppercase font-bold tracking-wide ${getSponsorTierColor(sponsor.sponsor_tier)}`}>
              {sponsor.sponsor_tier}
            </span>
          </div>
          <p className="text-xs text-zinc-500">Sponsor ID: {sponsor.id}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:flex items-center">
          <div className="rounded border border-zinc-900 bg-zinc-950 px-4 py-2 text-center">
            <span className="block text-[10px] text-zinc-500 font-semibold uppercase">Commitment</span>
            <span className="text-xs font-bold text-zinc-200 mt-1 block">
              {formatCurrency(sponsor.sponsorship_amount)}
            </span>
          </div>

          <div className="rounded border border-zinc-900 bg-zinc-950 px-4 py-2 text-center">
            <span className="block text-[10px] text-zinc-500 font-semibold uppercase">Lead Status</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize mt-1 ${getLeadStatusColor(sponsor.lead_status)}`}>
              {sponsor.lead_status.replace("_", " ")}
            </span>
          </div>

          <div className="rounded border border-zinc-900 bg-zinc-950 px-4 py-2 text-center">
            <span className="block text-[10px] text-zinc-500 font-semibold uppercase">Payment</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 block ${
              sponsor.payment_status === "paid"
                ? "text-emerald-500"
                : sponsor.payment_status === "partial"
                ? "text-orange-500"
                : "text-red-500"
            }`}>
              {sponsor.payment_status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column (Sponsor CRM & Benefits Tracker) */}
        <div className="lg:col-span-2 space-y-6">
          {/* CRM Cards Details */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6 space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-zinc-500" /> CRM Details
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div>
                <span className="text-zinc-550 text-zinc-500 block uppercase font-medium">Contact Person</span>
                <span className="text-zinc-300 font-semibold mt-1 block">{sponsor.contact_person}</span>
              </div>
              <div>
                <span className="text-zinc-550 text-zinc-500 block uppercase font-medium">Email Address</span>
                <span className="text-zinc-300 font-semibold mt-1 block">{sponsor.email || "N/A"}</span>
              </div>
              <div>
                <span className="text-zinc-550 text-zinc-500 block uppercase font-medium">Phone Number</span>
                <span className="text-zinc-300 font-semibold mt-1 block">{sponsor.phone || "N/A"}</span>
              </div>
              <div>
                <span className="text-zinc-550 text-zinc-500 block uppercase font-medium">Pipeline Conversion</span>
                <span className="text-zinc-300 font-semibold mt-1 block">
                  {sponsor.lead_status === "confirmed" ? "Sponsorship Confirmed" : "Acquisition Phase"}
                </span>
              </div>
            </div>

            {sponsor.notes && (
              <div className="border-t border-zinc-900 pt-4">
                <span className="text-zinc-550 text-zinc-500 text-xs block uppercase font-medium">Sponsorship Notes</span>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed bg-zinc-950/20 p-3 rounded border border-zinc-900">
                  {sponsor.notes}
                </p>
              </div>
            )}
          </div>

          {/* Benefits checklist */}
          <BenefitList
            sponsorId={sponsor.id}
            initialBenefits={(benefits as any[]) || []}
            isWritable={isWritable}
          />

          {/* Documents manager */}
          <SponsorDocs sponsorId={sponsor.id} isWritable={isWritable} />
        </div>

        {/* Right column (Interactions & Audits Timeline) */}
        <div className="space-y-6">
          <InteractionList
            sponsorId={sponsor.id}
            interactions={(interactions as any[]) || []}
            isWritable={isWritable}
          />

          <ActivityTimeline timeline={(timeline as any[]) || []} />
        </div>
      </div>
    </div>
  );
}
