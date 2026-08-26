"use client";

import React, { useState } from "react";
import { History, Search, Eye, Download, Info } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import DiffViewer from "@/components/shared/DiffViewer";

interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_values: any;
  new_values: any;
  changed_by?: string;
  ip_address?: string;
  device?: string;
  change_reason?: string;
  created_at: string;
  users?: {
    full_name: string;
  };
}

interface AuditCenterProps {
  logs: AuditLog[];
}

export default function AuditCenter({ logs }: AuditCenterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [activeLog, setActiveLog] = useState<AuditLog | null>(null);

  // Filters logic
  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter;
    const matchesSearch =
      (log.users?.full_name && log.users.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.change_reason && log.change_reason.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesAction && matchesEntity && matchesSearch;
  });

  // Export logs to CSV
  const handleExportCSV = () => {
    const headers = ["Timestamp", "Editor Name", "Action", "Table Name", "Record ID", "IP Address", "Device UA", "Change Reason"];
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map((log) =>
        [
          `"${log.created_at}"`,
          `"${log.users?.full_name || "System"}"`,
          `"${log.action}"`,
          `"${log.entity_type}"`,
          `"${log.entity_id}"`,
          `"${log.ip_address || ""}"`,
          `"${log.device || ""}"`,
          `"${log.change_reason || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "SUPRA_2026_AuditLogs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-zinc-900/10 border border-zinc-900 p-4 rounded-xl">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-600" />
          <input
            type="text"
            placeholder="Search by editor / comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-10 pr-4 py-2 text-xs text-zinc-150 focus:outline-none focus:border-zinc-700"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="create">Creates</option>
            <option value="update">Updates</option>
            <option value="delete">Deletes</option>
            <option value="restore">Restores</option>
            <option value="purge">Purges</option>
          </select>

          {/* Table Entity Filter */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="all">All Tables</option>
            <option value="users">Users Profiles</option>
            <option value="sponsors">Sponsors CRM</option>
            <option value="sponsor_benefits">Sponsor Benefits</option>
            <option value="guests">Guests CRM</option>
            <option value="gatepasses">Gatepasses</option>
            <option value="event_tasks">Event Tasks</option>
          </select>

          {/* Export */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition-colors"
          >
            <Download className="h-4 w-4" /> Export CSV Report
          </button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-900/30 text-zinc-500 font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Editor Name</th>
                <th className="px-6 py-3.5">Action</th>
                <th className="px-6 py-3.5">Table (Entity)</th>
                <th className="px-6 py-3.5">IP / Connection</th>
                <th className="px-6 py-3.5">Reason for change</th>
                <th className="px-6 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No change records found matching current query parameters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/20 transition-colors">
                    <td className="px-6 py-4 text-zinc-350">{formatDateTime(log.created_at)}</td>
                    <td className="px-6 py-4 font-semibold text-zinc-200">
                      {log.users?.full_name || "System"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded px-1.5 py-0.5 border text-[9px] font-bold uppercase tracking-wider ${
                          log.action === "create"
                            ? "bg-blue-950 text-blue-400 border-blue-900"
                            : log.action === "delete"
                            ? "bg-red-950 text-red-400 border-red-900"
                            : log.action === "restore"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-900"
                            : "bg-zinc-800 text-zinc-300 border-zinc-700"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-medium capitalize">
                      {log.entity_type.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 font-mono text-[10px]">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-4 text-zinc-300 max-w-xs truncate">
                      {log.change_reason || <span className="text-zinc-650 text-zinc-600 font-normal italic">None provided</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setActiveLog(log)}
                        className="text-zinc-550 hover:text-zinc-300 transition-colors p-1"
                        title="Compare Diffs"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Difference comparison modal */}
      {activeLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <History className="h-4.5 w-4.5 text-zinc-400" /> Trace Change Details
              </h3>
              <button
                onClick={() => setActiveLog(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ✕ Close comparison
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900 text-xs text-zinc-400">
              <div>
                <span className="text-[10px] text-zinc-600 uppercase font-semibold block">Who Changed It</span>
                <span className="font-bold text-zinc-200 mt-0.5 block">{activeLog.users?.full_name || "System"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-600 uppercase font-semibold block">Device / User-Agent</span>
                <span className="mt-0.5 block truncate" title={activeLog.device}>{activeLog.device || "N/A"}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-600 uppercase font-semibold block">Change Remarks</span>
                <span className="mt-0.5 block italic text-zinc-300">
                  &ldquo;{activeLog.change_reason || "No comments entered"}&rdquo;
                </span>
              </div>
            </div>

            <DiffViewer oldValues={activeLog.old_values} newValues={activeLog.new_values} />
          </div>
        </div>
      )}
    </div>
  );
}
