"use client";

import React from "react";
import { formatDateTime } from "@/lib/utils";
import { Clock, User } from "lucide-react";

interface TimelineItem {
  id: string;
  action: string;
  created_at: string;
  changed_by: string;
  change_reason?: string;
  old_values?: any;
  new_values?: any;
  users?: {
    full_name: string;
  };
}

interface ActivityTimelineProps {
  timeline: TimelineItem[];
}

export default function ActivityTimeline({ timeline }: ActivityTimelineProps) {
  function getDiffSummary(item: TimelineItem) {
    if (item.action === "create") {
      return "Record created";
    }
    if (item.action === "delete") {
      return "Record soft-deleted";
    }
    if (item.action === "restore") {
      return "Record restored";
    }
    if (item.action === "purge") {
      return "Record permanently purged";
    }

    // For update, let's extract changed fields
    const oldVal = item.old_values || {};
    const newVal = item.new_values || {};
    const diffs: string[] = [];

    Object.keys(newVal).forEach((key) => {
      // Ignore timestamp keys, version, and matches
      if (["updated_at", "created_at", "version"].includes(key)) return;
      if (oldVal[key] !== newVal[key]) {
        const oldDisplay = oldVal[key] === null || oldVal[key] === undefined ? "none" : String(oldVal[key]);
        const newDisplay = newVal[key] === null || newVal[key] === undefined ? "none" : String(newVal[key]);
        const keyDisplay = key.replace("_", " ");
        diffs.push(`${keyDisplay}: ${oldDisplay} → ${newDisplay}`);
      }
    });

    if (diffs.length === 0) return "Record modified";
    return diffs.join(", ");
  }

  return (
    <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6">
      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Clock className="h-4.5 w-4.5 text-zinc-500" /> Activity History
      </h3>

      <div className="flow-root">
        {timeline.length === 0 ? (
          <p className="text-xs text-zinc-555 text-zinc-500 py-4 text-center">
            No modifications recorded for this entry.
          </p>
        ) : (
          <ul className="-mb-8">
            {timeline.map((item, idx) => (
              <li key={item.id}>
                <div className="relative pb-8">
                  {idx !== timeline.length - 1 && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-800"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-850 text-zinc-400 ring-4 ring-zinc-950">
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-xs text-zinc-300 font-semibold capitalize">
                          {item.action === "update" ? "Status Updated" : `${item.action}d`}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1 leading-normal">
                          {getDiffSummary(item)}
                        </p>
                        {item.change_reason && (
                          <p className="text-[10px] text-zinc-500 italic mt-1 bg-zinc-950/40 p-2 rounded border border-zinc-900">
                            Reason: &ldquo;{item.change_reason}&rdquo;
                          </p>
                        )}
                        <p className="text-[10px] text-zinc-500 mt-1">
                          By {item.users?.full_name || "System"}
                        </p>
                      </div>
                      <div className="text-right text-[10px] text-zinc-500 whitespace-nowrap">
                        {formatDateTime(item.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
