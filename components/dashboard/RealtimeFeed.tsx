"use client";

import React, { useEffect, useState } from "react";
import { Activity, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ChangeLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  created_at: string;
  changed_by: string;
  change_reason?: string;
  users?: {
    full_name: string;
  };
}

interface RealtimeFeedProps {
  initialLogs: ChangeLog[];
}

export default function RealtimeFeed({ initialLogs }: RealtimeFeedProps) {
  const [logs, setLogs] = useState<ChangeLog[]>(initialLogs);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("realtime-feed-timeline")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "change_history",
        },
        async (payload) => {
          const newLog = payload.new as any;

          // Fetch the user's name for this log
          let userDetails = { full_name: "System" };
          if (newLog.changed_by) {
            const { data } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", newLog.changed_by)
              .single();
            if (data) userDetails = data;
          }

          const completeLog: ChangeLog = {
            ...newLog,
            users: userDetails,
          };

          setLogs((prev) => [completeLog, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  function getActionText(log: ChangeLog) {
    const editor = log.users?.full_name || "Someone";
    const entity = log.entity_type.replace("_", " ").slice(0, -1); // remove plural 's' at end roughly
    const action = log.action;

    if (action === "create") {
      return `${editor} added a new ${entity}`;
    } else if (action === "update") {
      return `${editor} updated a ${entity}`;
    } else if (action === "delete") {
      return `${editor} soft-deleted a ${entity}`;
    } else if (action === "restore") {
      return `${editor} restored a ${entity}`;
    } else if (action === "purge") {
      return `${editor} purged a ${entity}`;
    }
    return `${editor} modified a ${entity}`;
  }

  return (
    <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-emerald-400" />
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Realtime Team Activity Feed
        </h3>
      </div>

      <div className="flow-root">
        <ul className="-mb-8">
          {logs.length === 0 ? (
            <div className="text-xs text-zinc-500 py-4 text-center">
              No recent team actions logged yet.
            </div>
          ) : (
            logs.map((log, logIdx) => (
              <li key={log.id}>
                <div className="relative pb-8">
                  {logIdx !== logs.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-800"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-850 text-zinc-400 ring-4 ring-zinc-950">
                        <Clock className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-xs text-zinc-300 font-medium">
                          {getActionText(log)}
                        </p>
                        {log.change_reason && (
                          <p className="text-[10px] text-zinc-500 italic mt-0.5">
                            Reason: {log.change_reason}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-[10px] text-zinc-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString("en-IN", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
