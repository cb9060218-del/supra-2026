import React from "react";
import { createClient } from "@/lib/supabase/server";
import GatepassScannerView from "@/components/gatepass/GatepassScannerView";

export const revalidate = 0;

export default async function GatepassesPage() {
  const supabase = await createClient();

  // Retrieve last 15 checkin scans
  const { data: scans } = await supabase
    .from("gatepasses")
    .select("*, guests(guest_name, guest_role, company)")
    .eq("status", "scanned")
    .order("scanned_at", { ascending: false })
    .limit(15);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Gatepass Scanning & Check-In</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Scan guest entry tickets or input codes manually to verify credentials and record check-ins.
        </p>
      </div>

      <GatepassScannerView initialScans={(scans as any[]) || []} />
    </div>
  );
}
