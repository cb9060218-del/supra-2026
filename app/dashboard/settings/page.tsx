import React from "react";
import { createClient } from "@/lib/supabase/server";
import RestoreCenter from "@/components/dashboard/RestoreCenter";
import { User, ShieldAlert, ArchiveRestore, Database } from "lucide-react";

export const revalidate = 0;

export default async function SettingsPage() {
  const supabase = await createClient();

  // Retrieve user session and role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const isWritable = profile && ["super_admin", "admin"].includes(profile.role);

  // Fetch deleted sponsors
  let deletedSponsors: any[] = [];
  let deletedGuests: any[] = [];

  if (isWritable) {
    const { data: sponsors } = await supabase
      .from("sponsors")
      .select("id, sponsor_name, sponsor_tier, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (sponsors) deletedSponsors = sponsors;

    const { data: guests } = await supabase
      .from("guests")
      .select("id, guest_name, guest_role, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });
    if (guests) deletedGuests = guests;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Portal Configuration</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Review credentials, access the archived records restore deck, and review backup logs.
        </p>
      </div>

      {/* User Profile Info Card */}
      {profile && (
        <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6 space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-zinc-500" /> Member Identity
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div>
              <span className="text-zinc-500 block uppercase font-medium">Full Name</span>
              <span className="text-zinc-200 font-semibold mt-1 block">{profile.full_name}</span>
            </div>
            <div>
              <span className="text-zinc-500 block uppercase font-medium">Email Address</span>
              <span className="text-zinc-200 font-semibold mt-1 block">{profile.email}</span>
            </div>
            <div>
              <span className="text-zinc-500 block uppercase font-medium">Organization</span>
              <span className="text-zinc-200 font-semibold mt-1 block">{profile.organization || "SAEINDIA"}</span>
            </div>
            <div>
              <span className="text-zinc-500 block uppercase font-medium">Access Permission Level</span>
              <span className="text-zinc-200 font-semibold mt-1 block uppercase tracking-wide text-zinc-300">
                {profile.role.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Backup and Recovery Policy Box */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6 space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Database className="h-4.5 w-4.5 text-zinc-500" /> Backup & Recovery Strategy
        </h3>

        <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
          <p>
            To prevent data loss during network outages or infrastructure issues at the Buddh International Circuit track:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-500">
            <li>
              <strong className="text-zinc-300">Standard Schedule:</strong> Daily automated database snapshots and transaction log (PITR) backups via Supabase console.
            </li>
            <li>
              <strong className="text-zinc-300">Event Week Schedule (Sept 2–5, 2026):</strong> Automated hourly pg_dump CRON worker outputs critical CRM databases (sponsors, guests, gatepasses, change_history) to a secure remote storage bucket.
            </li>
            <li>
              <strong className="text-zinc-300">Recovery Validation:</strong> Weekly automated backup extraction tests checking log checkins and gatepass validity.
            </li>
          </ul>
        </div>
      </div>

      {/* Restore center Visualizer (Admins/Super Admins only) */}
      {isWritable ? (
        <RestoreCenter
          deletedSponsors={deletedSponsors}
          deletedGuests={deletedGuests}
          isWritable={!!isWritable}
        />
      ) : (
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 text-xs text-zinc-550 text-zinc-500 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-zinc-650" />
          <span>Restore Center is accessible only to Super Admins and Admins.</span>
        </div>
      )}
    </div>
  );
}
