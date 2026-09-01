import React from "react";
import { createClient } from "@/lib/supabase/server";
import OverviewCharts from "@/components/dashboard/OverviewCharts";
import RealtimeFeed from "@/components/dashboard/RealtimeFeed";
import FulfillmentOverview from "@/components/dashboard/FulfillmentOverview";
import { formatCurrency } from "@/lib/utils";
import { computeGuestDateBreakdown } from "@/lib/dateUtils";
import Link from "next/link";
import {
  Award,
  Users,
  QrCode,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  UserCheck,
  Percent,
  Calendar,
  ArrowRight,
} from "lucide-react";

export const revalidate = 0; // Fetch fresh data on page load

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Fetch Sponsors Stats
  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("sponsor_tier, sponsorship_amount, payment_status, lead_status")
    .is("deleted_at", null);

  const totalSponsorsCount = sponsors?.length || 0;
  const confirmedSponsorsCount = sponsors?.filter((s) => s.lead_status === "confirmed").length || 0;

  let expectedRevenue = 0;
  let collectedRevenue = 0;
  const tierRevenueMap: Record<string, number> = {
    principal: 0,
    platinum: 0,
    gold: 0,
    lunch: 0,
    silver: 0,
    bronze: 0,
    custom: 0,
    other: 0,
  };

  sponsors?.forEach((s) => {
    const amt = parseFloat(s.sponsorship_amount as any) || 0;
    expectedRevenue += amt;
    if (s.payment_status === "paid" || s.payment_status === "Payment Received") {
      collectedRevenue += amt;
    }
    const tierKey = (s.sponsor_tier || "other").toLowerCase();
    tierRevenueMap[tierKey] = (tierRevenueMap[tierKey] || 0) + amt;
  });

  const outstandingPayments = expectedRevenue - collectedRevenue;
  const sponsorConversionRate = totalSponsorsCount > 0
    ? Math.round((confirmedSponsorsCount / totalSponsorsCount) * 100)
    : 0;

  // 2. Fetch Guests Stats
  const { data: guests } = await supabase
    .from("guests")
    .select("attendance_status, guest_role, sponsor_id, gatepass_status, remarks, arrival_date, departure_date")
    .is("deleted_at", null);

  const totalGuestsCount = guests?.length || 0;
  const dateBreakdown = computeGuestDateBreakdown(guests || []);

  // Align RSVP checks to match both CapitalCase and lowercase values
  const confirmedGuestsCount = guests?.filter((g) =>
    ["confirmed", "Confirmed", "attended", "Attended"].includes(g.attendance_status)
  ).length || 0;

  const pendingGuestsCount = guests?.filter((g) =>
    ["pending", "Pending", "invited", "Invited"].includes(g.attendance_status)
  ).length || 0;

  const notComingGuestsCount = guests?.filter((g) =>
    ["not", "Not", "declined", "Declined"].includes(g.attendance_status)
  ).length || 0;

  const gatepassIssuedCount = guests?.filter((g) =>
    ["issued", "scanned"].includes(g.gatepass_status)
  ).length || 0;

  const gatepassPendingCount = guests?.filter((g) =>
    g.gatepass_status === "not_issued"
  ).length || 0;

  // Checked in today (attendance_status = attended or gatepass status scanned)
  const checkedInGuestsCount = guests?.filter((g) =>
    g.attendance_status === "attended" || g.gatepass_status === "scanned"
  ).length || 0;

  // 3. Fetch Benefits Stats
  const { data: benefits } = await supabase
    .from("sponsor_benefits")
    .select("status")
    .is("deleted_at", null);

  const totalBenefitsCount = benefits?.length || 0;
  const completedBenefitsCount = benefits?.filter((b) => b.status === "completed").length || 0;
  const benefitCompletionRate = totalBenefitsCount > 0
    ? Math.round((completedBenefitsCount / totalBenefitsCount) * 100)
    : 0;

  // 4. Change History logs for Realtime team feed
  const { data: initialLogs } = await supabase
    .from("change_history")
    .select("*, users(full_name)")
    .order("created_at", { ascending: false })
    .limit(10);

  // 5. Fetch Fulfillment Items
  const { data: fulfillmentItems } = await supabase
    .from("fulfillment_items")
    .select("*")
    .order("created_at", { ascending: true });

  // 6. Get Current User Role
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

  // Formatting chart structures
  const tierChartData = Object.entries(tierRevenueMap).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));

  const guestRSVPMap: Record<string, number> = {
    confirmed: 0,
    pending: 0,
    declined: 0,
  };
  guests?.forEach((g) => {
    const raw = (g.attendance_status || "pending").toLowerCase();
    if (raw === "confirmed" || raw === "attended") {
      guestRSVPMap.confirmed += 1;
    } else if (raw === "pending" || raw === "invited") {
      guestRSVPMap.pending += 1;
    } else {
      guestRSVPMap.declined += 1;
    }
  });

  const guestChartData = Object.entries(guestRSVPMap).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));

  return (
    <div className="space-y-8">
      {/* Hero Header Card */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-6 md:p-8 flex items-center gap-6 shadow-xl">
        <div className="h-16 w-16 rounded-full bg-zinc-850 border border-zinc-700 flex items-center justify-center font-black text-zinc-100 text-3xl">
          👥
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-150 tracking-tight">{totalGuestsCount}</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Total guests registered across {totalSponsorsCount} sponsors (Buddh International Circuit, 2–5 Sept 2026)
          </p>
        </div>
      </div>

      {/* 1. Core Platform Statistics Grid */}
      <div>
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
          Core Metrics Checklist
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4">
            <span className="block text-[10px] text-zinc-500 font-semibold uppercase">Total Guests</span>
            <span className="text-2xl font-bold text-zinc-100 mt-2 block">{totalGuestsCount}</span>
          </div>

          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 border-emerald-900/40 bg-emerald-950/5">
            <span className="block text-[10px] text-emerald-500 font-semibold uppercase">Confirmed Coming</span>
            <span className="text-2xl font-bold text-emerald-400 mt-2 block">{confirmedGuestsCount}</span>
          </div>

          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 border-amber-900/40 bg-amber-950/5">
            <span className="block text-[10px] text-amber-500 font-semibold uppercase">Pending RSVP</span>
            <span className="text-2xl font-bold text-amber-400 mt-2 block">{pendingGuestsCount}</span>
          </div>

          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 border-red-950/40 bg-red-950/5">
            <span className="block text-[10px] text-red-400 font-semibold uppercase">Not Coming</span>
            <span className="text-2xl font-bold text-red-400 mt-2 block">{notComingGuestsCount}</span>
          </div>

          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4">
            <span className="block text-[10px] text-zinc-500 font-semibold uppercase">Pass Issued</span>
            <span className="text-2xl font-bold text-emerald-400 mt-2 block">{gatepassIssuedCount}</span>
          </div>

          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4">
            <span className="block text-[10px] text-zinc-500 font-semibold uppercase">Pass Pending</span>
            <span className="text-2xl font-bold text-amber-400 mt-2 block">{gatepassPendingCount}</span>
          </div>

          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4">
            <span className="block text-[10px] text-zinc-500 font-semibold uppercase">Total Sponsors</span>
            <span className="text-2xl font-bold text-zinc-100 mt-2 block">{totalSponsorsCount}</span>
          </div>
        </div>
      </div>

      {/* Benefit Fulfillment Cubicles */}
      <FulfillmentOverview initialItems={fulfillmentItems || []} userRole={userRole} />

      {/* Daily Guest Attendance Schedule by Event Date */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">
                Expected Guest Attendance by Event Date
              </h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Headcount breakdown of VIPs, sponsors, and delegates attending across event dates
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/sponsors"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>Filter by date in Sponsors CRM</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {dateBreakdown.map((d) => (
            <div
              key={d.id}
              className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all ${
                d.count > 0
                  ? "bg-zinc-950/60 border-zinc-800/80 hover:border-amber-500/40"
                  : "bg-zinc-950/20 border-zinc-900/60 opacity-60"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                  {d.shortLabel}
                </span>
                <span className="text-[10px] text-zinc-500 block truncate mt-0.5" title={d.description}>
                  {d.description}
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl font-black text-zinc-100">{d.count}</span>
                <span className="text-[10px] font-semibold text-zinc-500">guests</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Executive KPIs */}
      <div>
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
          Financial & Operational KPIs
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase flex items-center justify-between">
              Expected Revenue <DollarSign className="h-3.5 w-3.5 text-zinc-600" />
            </span>
            <span className="text-lg font-bold text-zinc-200 mt-2">
              {formatCurrency(expectedRevenue)}
            </span>
          </div>

          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase flex items-center justify-between">
              Collected <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            </span>
            <span className="text-lg font-bold text-emerald-400 mt-2">
              {formatCurrency(collectedRevenue)}
            </span>
          </div>

          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase flex items-center justify-between">
              Outstanding <DollarSign className="h-3.5 w-3.5 text-orange-500" />
            </span>
            <span className="text-lg font-bold text-orange-400 mt-2">
              {formatCurrency(outstandingPayments)}
            </span>
          </div>

          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase flex items-center justify-between">
              Check-In Count <UserCheck className="h-3.5 w-3.5 text-blue-500" />
            </span>
            <span className="text-lg font-bold text-blue-400 mt-2">
              {checkedInGuestsCount} present
            </span>
          </div>

          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase flex items-center justify-between">
              Benefit Comp % <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
            </span>
            <span className="text-lg font-bold text-purple-400 mt-2">
              {benefitCompletionRate}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Charts Visualization */}
      <OverviewCharts tierData={tierChartData} guestData={guestChartData} />

      {/* 4. Realtime Team activity logs */}
      <RealtimeFeed initialLogs={initialLogs as any[] || []} />
    </div>
  );
}
