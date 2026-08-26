"use client";

import React, { useState, useTransition } from "react";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { updateBenefitStatusAction } from "@/app/dashboard/sponsors/actions";

interface Benefit {
  id: string;
  benefit_name: string;
  benefit_description?: string;
  status: "pending" | "in_progress" | "completed";
  remarks?: string;
  completed_at?: string;
}

interface BenefitListProps {
  sponsorId: string;
  initialBenefits: Benefit[];
  isWritable: boolean;
}

export default function BenefitList({ sponsorId, initialBenefits, isWritable }: BenefitListProps) {
  const [benefits, setBenefits] = useState<Benefit[]>(initialBenefits);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const total = benefits.length;
  const completed = benefits.filter((b) => b.status === "completed").length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const toggleStatus = (benefit: Benefit) => {
    if (!isWritable) return;

    const newStatus = benefit.status === "completed" ? "pending" : "completed";
    setEditingId(benefit.id);
    setRemarks(benefit.remarks || "");
    setChangeReason("");
  };

  const handleSave = (benefit: Benefit, newStatus: "pending" | "in_progress" | "completed") => {
    startTransition(async () => {
      const res = await updateBenefitStatusAction(
        benefit.id,
        sponsorId,
        newStatus,
        remarks,
        changeReason || `Updated status of ${benefit.benefit_name}`
      );

      if (!res.error) {
        setBenefits((prev) =>
          prev.map((b) =>
            b.id === benefit.id
              ? {
                  ...b,
                  status: newStatus,
                  remarks: remarks || undefined,
                  completed_at: newStatus === "completed" ? new Date().toISOString() : undefined,
                }
              : b
          )
        );
        setEditingId(null);
        setRemarks("");
        setChangeReason("");
      } else {
        alert("Failed to update status: " + res.error);
      }
    });
  };

  return (
    <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6 space-y-6">
      {/* Progress Bar Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
          <span>Sponsor Benefits Progress</span>
          <span>{percentage}% ({completed}/{total})</span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Benefits List */}
      <div className="divide-y divide-zinc-900">
        {benefits.length === 0 ? (
          <p className="text-xs text-zinc-555 text-zinc-500 py-4 text-center">
            No benefits allocated to this sponsor tier.
          </p>
        ) : (
          benefits.map((b) => {
            const isEditing = editingId === b.id;

            return (
              <div key={b.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    disabled={!isWritable || isPending}
                    onClick={() => toggleStatus(b)}
                    className="mt-0.5 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {b.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-zinc-650 text-zinc-650" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-200">{b.benefit_name}</p>
                    {b.benefit_description && (
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-normal">
                        {b.benefit_description}
                      </p>
                    )}
                    {b.remarks && !isEditing && (
                      <p className="text-[10px] text-emerald-500/80 bg-emerald-950/10 border border-emerald-950/40 p-2 rounded mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Remarks: {b.remarks}
                      </p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="pl-8 p-3 rounded bg-zinc-950/40 border border-zinc-900 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-zinc-500 uppercase">
                          Execution Remarks
                        </label>
                        <input
                          type="text"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="e.g. Backdrop banner printed and verified"
                          className="mt-1 block w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-zinc-500 uppercase">
                          Modification Reason
                        </label>
                        <input
                          type="text"
                          value={changeReason}
                          onChange={(e) => setChangeReason(e.target.value)}
                          placeholder="e.g. Checked off after track backdrop photo review"
                          className="mt-1 block w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded border border-zinc-850 px-3 py-1 text-[10px] font-medium text-zinc-400 hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSave(b, b.status === "completed" ? "pending" : "completed")
                        }
                        className="rounded bg-zinc-100 px-3 py-1 text-[10px] font-bold text-zinc-950 hover:bg-zinc-200"
                      >
                        Confirm Check
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
