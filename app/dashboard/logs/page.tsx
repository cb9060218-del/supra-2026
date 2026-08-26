import React from "react";
import { createClient } from "@/lib/supabase/server";
import AuditCenter from "@/components/dashboard/AuditCenter";

export const revalidate = 0;

export default async function AuditLogsPage() {
  const supabase = await createClient();

  // Retrieve logs from change_history
  const { data: logs } = await supabase
    .from("change_history")
    .select("*, users(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Audit Log Center</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Immutable history of record changes, checkins, updates, and soft-deletes.
        </p>
      </div>

      <AuditCenter logs={(logs as any[]) || []} />
    </div>
  );
}
