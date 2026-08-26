"use client";

import React, { useState, useTransition } from "react";
import { History, ShieldCheck, CornerUpLeft, Trash } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { restoreRecordAction } from "@/app/dashboard/settings/actions";

interface DeletedSponsor {
  id: string;
  sponsor_name: string;
  sponsor_tier: string;
  deleted_at: string;
}

interface DeletedGuest {
  id: string;
  guest_name: string;
  guest_role: string;
  deleted_at: string;
}

interface RestoreCenterProps {
  deletedSponsors: DeletedSponsor[];
  deletedGuests: DeletedGuest[];
  isWritable: boolean;
}

export default function RestoreCenter({ deletedSponsors, deletedGuests, isWritable }: RestoreCenterProps) {
  const [sponsors, setSponsors] = useState<DeletedSponsor[]>(deletedSponsors);
  const [guests, setGuests] = useState<DeletedGuest[]>(deletedGuests);

  const [promptId, setPromptId] = useState<string | null>(null);
  const [promptTable, setPromptTable] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenPrompt = (id: string, tableName: string) => {
    setPromptId(id);
    setPromptTable(tableName);
    setReason("");
    setError(null);
  };

  const handleConfirm = () => {
    if (!promptId || !promptTable || !reason.trim()) {
      setError("Please write down a justification reason.");
      return;
    }

    startTransition(async () => {
      const res = await restoreRecordAction(promptTable, promptId, reason);
      if (res.error) {
        setError(res.error);
      } else {
        if (promptTable === "sponsors") {
          setSponsors((prev) => prev.filter((s) => s.id !== promptId));
        } else if (promptTable === "guests") {
          setGuests((prev) => prev.filter((g) => g.id !== promptId));
        }
        setPromptId(null);
        setPromptTable(null);
        setReason("");
      }
    });
  };

  if (!isWritable) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
        <History className="h-4.5 w-4.5 text-zinc-400" />
        <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
          Restore Center (Archive Control)
        </h3>
      </div>

      {/* Sponsors Archive */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-400">Archived Sponsors ({sponsors.length})</h4>
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 overflow-hidden">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-900/30 text-zinc-500 font-semibold uppercase">
                <th className="px-6 py-2.5">Sponsor Name</th>
                <th className="px-6 py-2.5">Tier</th>
                <th className="px-6 py-2.5">Archived Time</th>
                <th className="px-6 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {sponsors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-zinc-600">
                    Sponsor archive is empty.
                  </td>
                </tr>
              ) : (
                sponsors.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-900/10">
                    <td className="px-6 py-3 font-semibold text-zinc-300">{s.sponsor_name}</td>
                    <td className="px-6 py-3 uppercase text-[10px] text-zinc-550 text-zinc-500">{s.sponsor_tier}</td>
                    <td className="px-6 py-3 text-zinc-500">{formatDateTime(s.deleted_at)}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleOpenPrompt(s.id, "sponsors")}
                        className="inline-flex items-center gap-1 rounded bg-zinc-900 hover:bg-zinc-850 px-2.5 py-1 text-[10px] text-zinc-200 font-bold border border-zinc-800 transition-colors"
                      >
                        <CornerUpLeft className="h-3 w-3" /> Restore
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guests Archive */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-400">Archived Guests ({guests.length})</h4>
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 overflow-hidden">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-900/30 text-zinc-500 font-semibold uppercase">
                <th className="px-6 py-2.5">Guest Name</th>
                <th className="px-6 py-2.5">Role</th>
                <th className="px-6 py-2.5">Archived Time</th>
                <th className="px-6 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {guests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-zinc-600">
                    Guest archive is empty.
                  </td>
                </tr>
              ) : (
                guests.map((g) => (
                  <tr key={g.id} className="hover:bg-zinc-900/10">
                    <td className="px-6 py-3 font-semibold text-zinc-300">{g.guest_name}</td>
                    <td className="px-6 py-3 capitalize text-[10px] text-zinc-550 text-zinc-500">{g.guest_role}</td>
                    <td className="px-6 py-3 text-zinc-500">{formatDateTime(g.deleted_at)}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleOpenPrompt(g.id, "guests")}
                        className="inline-flex items-center gap-1 rounded bg-zinc-900 hover:bg-zinc-850 px-2.5 py-1 text-[10px] text-zinc-200 font-bold border border-zinc-800 transition-colors"
                      >
                        <CornerUpLeft className="h-3 w-3" /> Restore
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation justification prompt */}
      {promptId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-850 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <CornerUpLeft className="h-4.5 w-4.5 text-zinc-400" /> Confirm Record Reinstatement
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every data update is tracked. Please provide a reason to restore this archived record.
            </p>

            {error && (
              <div className="text-[10px] text-red-400 bg-red-950/25 border border-red-900/35 p-2 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-zinc-555 text-zinc-500 uppercase tracking-wider">
                Reason (Required)
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Reinstating delegation after verbal confirmation"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPromptId(null);
                  setPromptTable(null);
                  setReason("");
                  setError(null);
                }}
                className="rounded border border-zinc-850 px-4 py-2 text-[10px] font-semibold text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending || !reason.trim()}
                className="rounded bg-zinc-100 text-zinc-950 px-4 py-2 text-[10px] font-bold disabled:opacity-50"
              >
                {isPending ? "Reinstating..." : "Verify & Restore"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
