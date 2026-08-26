"use client";

import React, { useState, useTransition, useRef } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { Plus, Search, Edit, Trash2, ArrowUpRight, Upload, Download, Loader2, Contact } from "lucide-react";
import { formatDate } from "@/lib/utils";
import GuestForm from "./GuestForm";
import { deleteGuestAction, bulkImportGuestsAction } from "@/app/dashboard/guests/actions";

interface Guest {
  id: string;
  guest_name: string;
  designation?: string;
  company?: string;
  email?: string;
  phone?: string;
  attendance_status: string;
  gatepass_status: string;
  guest_role: string;
  arrival_date?: string;
  departure_date?: string;
  accommodation_required: boolean;
  remarks?: string;
  version: number;
  sponsor_id?: string;
  sponsors?: {
    sponsor_name: string;
  };
}

interface GuestListProps {
  initialGuests: Guest[];
  sponsors: { id: string; sponsor_name: string }[];
  userRole: string;
}

export default function GuestList({ initialGuests, sponsors, userRole }: GuestListProps) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [activeRoleFilter, setActiveRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, startDelete] = useTransition();

  // CSV Import states
  const [importing, startImport] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importReason, setImportReason] = useState("");
  const [parsedData, setParsedData] = useState<any[] | null>(null);

  const isWritable = ["super_admin", "admin", "coordinator"].includes(userRole);
  const isApprover = ["super_admin", "admin"].includes(userRole);

  // Segment tabs
  const rolesTabs = [
    { id: "all", name: "All Guests" },
    { id: "vip", name: "VIPs" },
    { id: "sponsor", name: "Sponsors" },
    { id: "judge", name: "Judges" },
    { id: "faculty", name: "Faculty" },
    { id: "media", name: "Media" },
    { id: "volunteer", name: "Volunteers" },
    { id: "team_member", name: "Organizers" },
  ];

  // Filtering
  const filteredGuests = guests.filter((g) => {
    const matchesRole = activeRoleFilter === "all" || g.guest_role === activeRoleFilter;
    const matchesSearch =
      g.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.company && g.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.email && g.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const getRoleCount = (roleId: string) => {
    if (roleId === "all") return guests.length;
    return guests.filter((g) => g.guest_role === roleId).length;
  };

  // CSV Parsing and import
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setParsedData(results.data);
        } else {
          alert("CSV is empty or header is misaligned.");
        }
      },
    });
  };

  const submitImport = () => {
    if (!parsedData || !importReason.trim()) return;

    startImport(async () => {
      const res = await bulkImportGuestsAction(parsedData, importReason);
      if (!res.error) {
        setParsedData(null);
        setImportReason("");
        window.location.reload();
      } else {
        alert("Import failed: " + res.error);
      }
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    const exportHeaders = [
      "Guest Name",
      "Role",
      "Designation",
      "Company/Institute",
      "Email",
      "Phone",
      "RSVP Status",
      "Gatepass Status",
      "Accommodation Required",
      "Arrival Date",
      "Departure Date",
      "Remarks",
    ];

    const csvRows = [
      exportHeaders.join(","),
      ...filteredGuests.map((g) =>
        [
          `"${g.guest_name}"`,
          `"${g.guest_role}"`,
          `"${g.designation || ""}"`,
          `"${g.company || ""}"`,
          `"${g.email || ""}"`,
          `"${g.phone || ""}"`,
          `"${g.attendance_status}"`,
          `"${g.gatepass_status}"`,
          `"${g.accommodation_required ? "Yes" : "No"}"`,
          `"${g.arrival_date || ""}"`,
          `"${g.departure_date || ""}"`,
          `"${g.remarks || ""}"`,
        ].join(",")
      ),
    ];

    const csvBlob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const blobUrl = URL.createObjectURL(csvBlob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", `SUPRA_2026_GuestReport_${activeRoleFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Soft Delete
  const handleDelete = () => {
    if (!deletingId) return;
    startDelete(async () => {
      const res = await deleteGuestAction(deletingId, deleteReason);
      if (!res.error) {
        setGuests((prev) => prev.filter((g) => g.id !== deletingId));
        setDeletingId(null);
        setDeleteReason("");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Imports buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-650 text-zinc-650" />
          <input
            type="text"
            placeholder="Search guests by name/company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-900 bg-zinc-900/30 pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-650 focus:border-zinc-800 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* CSV Exporter */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-850 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition-colors"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>

          {isWritable && (
            <>
              {/* CSV Importer */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-850 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition-colors"
              >
                <Upload className="h-4 w-4" /> Import CSV
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv"
                onChange={handleCSVUpload}
              />
            </>
          )}

          {isWritable && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Guest
            </button>
          )}
        </div>
      </div>

      {/* CSV Import justification confirmation popup */}
      {parsedData && (
        <div className="rounded-xl border border-yellow-900/40 bg-yellow-950/15 p-4 space-y-3">
          <p className="text-xs font-semibold text-yellow-500">
            CSV parsed successfully! Loaded {parsedData.length} guest records.
          </p>
          <div className="max-w-md space-y-2">
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase">
              Reason for Bulk Upload (Required)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={importReason}
                onChange={(e) => setImportReason(e.target.value)}
                placeholder="e.g. Uploaded principal sponsor delegation list"
                className="flex-1 rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 focus:outline-none"
              />
              <button
                onClick={submitImport}
                disabled={importing || !importReason.trim()}
                className="rounded bg-yellow-500 text-zinc-950 px-3 py-1.5 text-xs font-bold disabled:opacity-50"
              >
                {importing ? "Importing..." : "Confirm Upload"}
              </button>
              <button
                onClick={() => setParsedData(null)}
                className="rounded border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-zinc-900 overflow-x-auto">
        <nav className="flex space-x-6 min-w-max pb-1">
          {rolesTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveRoleFilter(tab.id)}
              className={`pb-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeRoleFilter === tab.id
                  ? "border-zinc-100 text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.name}
              <span className="rounded-full bg-zinc-900 border border-zinc-850 px-1.5 py-0.2 text-[9px] text-zinc-400 font-medium">
                {getRoleCount(tab.id)}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Table grid */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-900/30 text-zinc-500 font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Guest Name</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Designation & Org</th>
                <th className="px-6 py-3.5">RSVP Status</th>
                <th className="px-6 py-3.5">Gatepass</th>
                <th className="px-6 py-3.5">Accommodation</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No guests matching this role/search criteria found.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((g) => (
                  <tr key={g.id} className="hover:bg-zinc-900/20 group transition-colors">
                    <td className="px-6 py-4 font-semibold text-zinc-100">
                      <Link
                        href={`/dashboard/guests/${g.id}`}
                        className="hover:underline flex items-center gap-1 text-zinc-200 hover:text-white"
                      >
                        {g.guest_name}{" "}
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                    <td className="px-6 py-4 capitalize font-semibold text-zinc-400">
                      {g.guest_role.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4">
                      <div>{g.designation || "Guest"}</div>
                      <div className="text-[10px] text-zinc-500">
                        {g.company || g.sponsors?.sponsor_name || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize font-medium">
                      <span
                        className={
                          g.attendance_status === "attended"
                            ? "text-emerald-500"
                            : g.attendance_status === "confirmed"
                            ? "text-sky-500"
                            : g.attendance_status === "declined"
                            ? "text-red-500"
                            : "text-zinc-500"
                        }
                      >
                        {g.attendance_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 uppercase font-bold text-[10px] tracking-wider">
                      <span
                        className={
                          g.gatepass_status === "scanned"
                            ? "text-purple-500"
                            : g.gatepass_status === "issued"
                            ? "text-emerald-500"
                            : "text-zinc-500"
                        }
                      >
                        {g.gatepass_status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-400">
                      {g.accommodation_required ? (
                        <span className="text-zinc-300">Yes</span>
                      ) : (
                        <span className="text-zinc-600">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2.5">
                        <Link
                          href={`/dashboard/guests/${g.id}`}
                          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                          title="View Profile Details"
                        >
                          <Contact className="h-4.5 w-4.5" />
                        </Link>
                        {isWritable && (
                          <>
                            <button
                              onClick={() => setEditingGuest(g)}
                              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                              title="Edit Guest"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {isApprover && (
                              <button
                                onClick={() => setDeletingId(g.id)}
                                className="text-zinc-550 hover:text-red-400 transition-colors p-1"
                                title="Delete Guest"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest mb-4">
              Add New Guest Profile
            </h3>
            <GuestForm
              sponsors={sponsors}
              onClose={() => setIsAddOpen(false)}
              onSuccess={() => {
                setIsAddOpen(false);
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingGuest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-widest mb-4">
              Edit Guest Profile
            </h3>
            <GuestForm
              initialData={editingGuest as any}
              sponsors={sponsors}
              onClose={() => setEditingGuest(null)}
              onSuccess={() => {
                setEditingGuest(null);
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}

      {/* Delete/Archive Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-850 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider">
              Archive Guest Profile
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to soft-delete this guest? They will be removed from lists and sent to the Restore Center database.
            </p>

            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Reason for deletion (Required)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Guest declined RSVP invitation"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingId(null);
                  setDeleteReason("");
                }}
                className="rounded-lg border border-zinc-850 px-4 py-2 text-[10px] font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || !deleteReason.trim()}
                className="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-[10px] font-semibold transition-colors disabled:opacity-50 text-white"
              >
                {isDeleting ? "Archiving..." : "Confirm Archive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
