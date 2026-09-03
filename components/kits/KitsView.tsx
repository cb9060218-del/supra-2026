"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Package,
  CheckCircle2,
  Clock,
  Shirt,
  Search,
  Plus,
  Download,
  Trash2,
  RefreshCw,
  Users,
  Award,
  ShieldAlert,
  Sparkles,
  Filter,
  Check,
  X,
  Edit2,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  createKitItemAction,
  updateKitFieldAction,
  toggleKitIssuedAction,
  toggleSponsorTshirtAction,
  deleteKitItemAction,
  importGuestsToSponsorKitsAction,
  KitItemInput,
} from "@/app/dashboard/kits/actions";

export interface KitItem {
  id: string;
  person_name: string;
  category: "OC" | "Jury" | "Sponsor" | "Volunteer" | "Custom";
  organization?: string | null;
  role_designation?: string | null;
  shirt_size: "XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "Custom" | "-";
  kit_issued: boolean;
  sponsor_tshirt_given: boolean;
  remarks?: string | null;
  issued_at?: string | null;
  created_at: string;
}

interface KitsViewProps {
  initialKits: KitItem[];
  userRole: string;
}

const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "Custom"] as const;
const CATEGORIES = ["OC", "Jury", "Sponsor", "Volunteer", "Custom"] as const;

export default function KitsView({ initialKits, userRole }: KitsViewProps) {
  const [kits, setKits] = useState<KitItem[]>(initialKits);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Add Item State
  const [newPersonName, setNewPersonName] = useState("");
  const [newCategory, setNewCategory] = useState<"OC" | "Jury" | "Sponsor" | "Volunteer" | "Custom">("OC");
  const [newOrg, setNewOrg] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newSize, setNewSize] = useState<"XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "Custom">("L");
  const [newKitIssued, setNewKitIssued] = useState(false);
  const [newSponsorTshirt, setNewSponsorTshirt] = useState(false);
  const [newRemarks, setNewRemarks] = useState("");

  const isWritable = ["super_admin", "admin", "coordinator"].includes(userRole);

  // 1. Calculations & Metrics
  const totalCount = kits.length;
  const issuedCount = kits.filter((k) => k.kit_issued).length;
  const pendingCount = totalCount - issuedCount;
  const completionPct = totalCount > 0 ? Math.round((issuedCount / totalCount) * 100) : 0;
  const sponsorTshirtCount = kits.filter((k) => k.sponsor_tshirt_given).length;

  const ocKits = kits.filter((k) => k.category === "OC");
  const juryKits = kits.filter((k) => k.category === "Jury");
  const sponsorKits = kits.filter((k) => k.category === "Sponsor");
  const volunteerKits = kits.filter((k) => k.category === "Volunteer" || k.category === "Custom");

  // Size breakdown counts
  const sizeBreakdown = useMemo(() => {
    const counts: Record<string, { total: number; issued: number; pending: number }> = {
      XS: { total: 0, issued: 0, pending: 0 },
      S: { total: 0, issued: 0, pending: 0 },
      M: { total: 0, issued: 0, pending: 0 },
      L: { total: 0, issued: 0, pending: 0 },
      XL: { total: 0, issued: 0, pending: 0 },
      "2XL": { total: 0, issued: 0, pending: 0 },
      "3XL": { total: 0, issued: 0, pending: 0 },
      Custom: { total: 0, issued: 0, pending: 0 },
    };

    kits.forEach((k) => {
      const sizeKey = counts[k.shirt_size] ? k.shirt_size : "Custom";
      counts[sizeKey].total += 1;
      if (k.kit_issued) {
        counts[sizeKey].issued += 1;
      } else {
        counts[sizeKey].pending += 1;
      }
    });

    return counts;
  }, [kits]);

  // 2. Filtered Kits List
  const filteredKits = useMemo(() => {
    return kits.filter((k) => {
      // Category filter
      if (categoryFilter !== "all" && k.category !== categoryFilter) return false;

      // Size filter
      if (sizeFilter !== "all" && k.shirt_size !== sizeFilter) return false;

      // Status filter
      if (statusFilter === "issued" && !k.kit_issued) return false;
      if (statusFilter === "pending" && k.kit_issued) return false;
      if (statusFilter === "sponsor_tshirt" && !k.sponsor_tshirt_given) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = k.person_name.toLowerCase().includes(query);
        const matchesOrg = (k.organization || "").toLowerCase().includes(query);
        const matchesRole = (k.role_designation || "").toLowerCase().includes(query);
        const matchesRemarks = (k.remarks || "").toLowerCase().includes(query);
        if (!matchesName && !matchesOrg && !matchesRole && !matchesRemarks) return false;
      }

      return true;
    });
  }, [kits, categoryFilter, sizeFilter, statusFilter, searchTerm]);

  // 3. Handlers with Optimistic Updates (0ms delay)
  const handleToggleKitIssued = (id: string) => {
    if (!isWritable) return;
    const current = kits.find((k) => k.id === id);
    if (!current) return;

    const nextVal = !current.kit_issued;
    setKits((prev) =>
      prev.map((k) =>
        k.id === id
          ? {
              ...k,
              kit_issued: nextVal,
              issued_at: nextVal ? new Date().toISOString() : null,
            }
          : k
      )
    );

    startTransition(async () => {
      const res = await toggleKitIssuedAction(id, current.kit_issued);
      if (res?.error) {
        // Rollback
        setKits((prev) =>
          prev.map((k) => (k.id === id ? { ...k, kit_issued: current.kit_issued } : k))
        );
        alert("Failed to update kit status: " + res.error);
      }
    });
  };

  const handleToggleSponsorTshirt = (id: string) => {
    if (!isWritable) return;
    const current = kits.find((k) => k.id === id);
    if (!current) return;

    const nextVal = !current.sponsor_tshirt_given;
    setKits((prev) =>
      prev.map((k) => (k.id === id ? { ...k, sponsor_tshirt_given: nextVal } : k))
    );

    startTransition(async () => {
      const res = await toggleSponsorTshirtAction(id, current.sponsor_tshirt_given);
      if (res?.error) {
        setKits((prev) =>
          prev.map((k) => (k.id === id ? { ...k, sponsor_tshirt_given: current.sponsor_tshirt_given } : k))
        );
        alert("Failed to update sponsor t-shirt status: " + res.error);
      }
    });
  };

  const handleSizeChange = (id: string, newSizeVal: any) => {
    if (!isWritable) return;
    const current = kits.find((k) => k.id === id);
    if (!current) return;

    const prevSize = current.shirt_size;
    setKits((prev) =>
      prev.map((k) => (k.id === id ? { ...k, shirt_size: newSizeVal } : k))
    );

    startTransition(async () => {
      const res = await updateKitFieldAction(
        id,
        "shirt_size",
        newSizeVal,
        `Updated shirt size to ${newSizeVal}`
      );
      if (res?.error) {
        setKits((prev) =>
          prev.map((k) => (k.id === id ? { ...k, shirt_size: prevSize } : k))
        );
        alert("Failed to update shirt size: " + res.error);
      }
    });
  };

  const handleRemarksBlur = (id: string, value: string) => {
    if (!isWritable) return;
    const current = kits.find((k) => k.id === id);
    if (!current || current.remarks === value) return;

    startTransition(async () => {
      await updateKitFieldAction(id, "remarks", value, `Updated remarks`);
    });
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the Kit distribution list?`)) return;

    setKits((prev) => prev.filter((k) => k.id !== id));

    startTransition(async () => {
      const res = await deleteKitItemAction(id, `Deleted kit record for: ${name}`);
      if (res?.error) {
        alert("Failed to delete record: " + res.error);
      }
    });
  };

  const handleCreateKit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;

    const tempId = "temp_" + Date.now();
    const tempItem: KitItem = {
      id: tempId,
      person_name: newPersonName.trim(),
      category: newCategory,
      organization: newOrg.trim() || null,
      role_designation: newRole.trim() || null,
      shirt_size: newSize,
      kit_issued: newKitIssued,
      sponsor_tshirt_given: newSponsorTshirt,
      remarks: newRemarks.trim() || null,
      issued_at: newKitIssued ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
    };

    setKits((prev) => [tempItem, ...prev]);
    setShowAddModal(false);

    // Reset Form
    setNewPersonName("");
    setNewOrg("");
    setNewRole("");
    setNewRemarks("");
    setNewKitIssued(false);
    setNewSponsorTshirt(false);

    startTransition(async () => {
      const res = await createKitItemAction(
        {
          person_name: tempItem.person_name,
          category: tempItem.category,
          organization: tempItem.organization || undefined,
          role_designation: tempItem.role_designation || undefined,
          shirt_size: tempItem.shirt_size,
          kit_issued: tempItem.kit_issued,
          sponsor_tshirt_given: tempItem.sponsor_tshirt_given,
          remarks: tempItem.remarks || undefined,
        },
        `Added ${tempItem.person_name} to ${tempItem.category} Kits`
      );

      if (res?.error) {
        setKits((prev) => prev.filter((k) => k.id !== tempId));
        alert("Failed to create kit record: " + res.error);
      } else if (res?.data) {
        setKits((prev) => prev.map((k) => (k.id === tempId ? res.data : k)));
      }
    });
  };

  const handleImportGuests = () => {
    if (!confirm("This will import all Corporate Sponsor guests into the Sponsor Kits distribution list. Continue?")) return;

    startTransition(async () => {
      const res = await importGuestsToSponsorKitsAction();
      if (res?.error) {
        alert("Import failed: " + res.error);
      } else if (res?.message) {
        alert(res.message);
      } else if (res?.count) {
        alert(`Successfully imported ${res.count} guests to Sponsor Kits!`);
        window.location.reload();
      }
    });
  };

  // 4. Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const dataToExport = filteredKits.map((item, index) => ({
      "Sr No": index + 1,
      "Person Name": item.person_name,
      Category:
        item.category === "OC"
          ? "Organising Committee (OC)"
          : item.category === "Jury"
          ? "Jury / Judge"
          : item.category === "Sponsor"
          ? "Sponsor Delegate"
          : item.category,
      "Organization / Company": item.organization || "-",
      "Role / Designation": item.role_designation || "-",
      "Shirt Size": item.shirt_size,
      "Kit Issued Status": item.kit_issued ? "ISSUED" : "PENDING",
      "Sponsor T-Shirt Given": item.sponsor_tshirt_given ? "YES" : "NO",
      "Remarks / Notes": item.remarks || "-",
      "Issued Timestamp": item.issued_at ? new Date(item.issued_at).toLocaleString() : "-",
    }));

    // Size Summary Sheet
    const sizeSummary = Object.entries(sizeBreakdown).map(([size, counts]) => ({
      "Shirt Size": size,
      "Total Allocated": counts.total,
      "Kits Issued": counts.issued,
      "Kits Pending": counts.pending,
    }));

    const wb = XLSX.utils.book_new();

    const wsKits = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, wsKits, "Kits Distribution");

    const wsSummary = XLSX.utils.json_to_sheet(sizeSummary);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Shirt Size Summary");

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `SUPRA_2026_Kits_Distribution_Report_${dateStr}.xlsx`);
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "OC":
        return "bg-rose-950/40 text-rose-400 border-rose-900";
      case "Jury":
        return "bg-amber-950/40 text-amber-400 border-amber-900";
      case "Sponsor":
        return "bg-indigo-950/40 text-indigo-400 border-indigo-900";
      case "Volunteer":
        return "bg-emerald-950/40 text-emerald-400 border-emerald-900";
      default:
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <Shirt className="h-5 w-5 text-indigo-400" />
            <span>Kits & Garment Distribution Tracker</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Track and manage kits, shirts & sponsor apparel for Organizing Committee (OC), Jury, and Corporate Sponsors.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 transition-all shadow-sm"
            title="Download Excel Spreadsheet Report"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Download Excel</span>
          </button>

          {isWritable && (
            <>
              <button
                onClick={handleImportGuests}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs px-3.5 py-2 transition-all shadow-sm disabled:opacity-50"
                title="Import corporate guests into Sponsor Kits"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
                <span>Import Guests to Kits</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-950 font-bold text-xs px-4 py-2 transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Person</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/20 p-4">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Total Kits</span>
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 block">{totalCount}</span>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/10 p-4">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase block">Kits Issued</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{issuedCount}</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{completionPct}%</span>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/10 p-4">
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase block">Kits Pending</span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">{pendingCount}</span>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/10 p-4">
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold uppercase block">OC Kits</span>
          <span className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 block">
            {ocKits.filter((k) => k.kit_issued).length} / {ocKits.length}
          </span>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/10 p-4">
          <span className="text-[10px] text-amber-500 font-semibold uppercase block">Jury Kits</span>
          <span className="text-xl font-bold text-amber-500 mt-1 block">
            {juryKits.filter((k) => k.kit_issued).length} / {juryKits.length}
          </span>
        </div>

        <div className="rounded-xl border border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/10 p-4">
          <span className="text-[10px] text-indigo-500 font-semibold uppercase block">Sponsor Kits</span>
          <span className="text-xl font-bold text-indigo-500 mt-1 block">
            {sponsorKits.filter((k) => k.kit_issued).length} / {sponsorKits.length}
          </span>
        </div>
      </div>

      {/* Shirt Size Demand Breakdown */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shirt className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider">
              T-Shirt & Shirt Size Demand Breakdown
            </span>
          </div>
          <span className="text-[11px] text-zinc-500">
            Total count of shirts required per size for manufacturing & distribution
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {SHIRT_SIZES.map((size) => {
            const counts = sizeBreakdown[size] || { total: 0, issued: 0, pending: 0 };
            const isSelected = sizeFilter === size;

            return (
              <button
                key={size}
                onClick={() => setSizeFilter(isSelected ? "all" : size)}
                className={`rounded-lg border p-2.5 text-left transition-all ${
                  isSelected
                    ? "bg-indigo-500/15 border-indigo-500 text-indigo-400 shadow-sm"
                    : "bg-zinc-50/60 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-zinc-900 dark:text-zinc-100">
                    Size {size}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-500">
                    {counts.total} pcs
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-1.5">
                  <span className="text-emerald-500">{counts.issued} given</span>
                  <span className="text-amber-500">{counts.pending} pending</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "all", label: `All Kits (${kits.length})`, icon: Package },
            { id: "OC", label: `Organising Committee (${ocKits.length})`, icon: Award },
            { id: "Jury", label: `Jury / Judges (${juryKits.length})`, icon: Users },
            { id: "Sponsor", label: `Sponsors Kits (${sponsorKits.length})`, icon: Sparkles },
            { id: "Volunteer", label: `Volunteers (${volunteerKits.length})`, icon: ShieldAlert },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold whitespace-nowrap border transition-all ${
                categoryFilter === tab.id
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-transparent shadow-sm"
                  : "bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search, Size, and Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 p-3 rounded-xl">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search person name, organization, designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent pl-9 pr-4 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700"
              />
            </div>

            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="all" className="bg-zinc-900">All Sizes</option>
              {SHIRT_SIZES.map((s) => (
                <option key={s} value={s} className="bg-zinc-900">
                  Size {s}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "all", label: "All Status" },
              { id: "issued", label: `Kit Issued (${issuedCount})` },
              { id: "pending", label: `Pending (${pendingCount})` },
              { id: "sponsor_tshirt", label: `Sponsor T-Shirt (${sponsorTshirtCount})` },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setStatusFilter(chip.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold border transition-all ${
                  statusFilter === chip.id
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-transparent"
                    : "bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kits Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/60 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Person & Designation</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4 text-center">Shirt Size</th>
                <th className="py-3 px-4 text-center">Kit Issued?</th>
                <th className="py-3 px-4 text-center">Sponsor T-Shirt?</th>
                <th className="py-3 px-4">Remarks / Delivery Notes</th>
                {isWritable && <th className="py-3 px-4 w-16 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
              {filteredKits.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-zinc-500 italic">
                    No kit distribution records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredKits.map((item, index) => {
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors ${
                        item.kit_issued ? "bg-emerald-50/20 dark:bg-emerald-950/5" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center text-zinc-400 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                          {item.person_name}
                        </span>
                        {item.role_designation && (
                          <span className="text-[11px] text-zinc-500 block truncate max-w-xs">
                            {item.role_designation}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded border px-2 py-0.5 text-[9px] uppercase font-black tracking-wide ${getCategoryBadgeClass(
                            item.category
                          )}`}
                        >
                          {item.category === "OC"
                            ? "OC Kit"
                            : item.category === "Jury"
                            ? "Jury Kit"
                            : item.category === "Sponsor"
                            ? "Sponsor Kit"
                            : item.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300 font-medium">
                        {item.organization || "-"}
                      </td>

                      {/* Shirt Size Selector */}
                      <td className="py-3.5 px-4 text-center">
                        <select
                          value={item.shirt_size}
                          disabled={!isWritable}
                          onChange={(e) => handleSizeChange(item.id, e.target.value)}
                          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
                        >
                          {SHIRT_SIZES.map((s) => (
                            <option key={s} value={s} className="bg-zinc-900">
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Kit Issued Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleKitIssued(item.id)}
                          disabled={!isWritable}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border transition-all ${
                            item.kit_issued
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                              : "bg-zinc-100 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400"
                          }`}
                        >
                          {item.kit_issued ? (
                            <>
                              <Check className="h-3.5 w-3.5 stroke-[3px]" />
                              <span>Given</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" />
                              <span>Pending</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Sponsor T-Shirt Given Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSponsorTshirt(item.id)}
                          disabled={!isWritable}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border transition-all ${
                            item.sponsor_tshirt_given
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                              : "bg-zinc-100 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400"
                          }`}
                        >
                          <Shirt className="h-3.5 w-3.5" />
                          <span>{item.sponsor_tshirt_given ? "Yes" : "No"}</span>
                        </button>
                      </td>

                      {/* Remarks Field */}
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          defaultValue={item.remarks || ""}
                          placeholder="Add delivery location/notes..."
                          disabled={!isWritable}
                          onBlur={(e) => handleRemarksBlur(item.id, e.target.value)}
                          className="w-full rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-700 bg-transparent px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
                        />
                      </td>

                      {/* Actions */}
                      {isWritable && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteItem(item.id, item.person_name)}
                            className="text-zinc-400 hover:text-red-500 p-1 rounded transition-colors"
                            title="Delete Kit Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Person Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="relative max-w-lg w-full bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Shirt className="h-4 w-4 text-indigo-400" />
                <span>Add Person for Kit Distribution</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateKit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Person Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. K. C. Vora"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Kit Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="OC" className="bg-zinc-900">Organising Committee (OC)</option>
                    <option value="Jury" className="bg-zinc-900">Jury / Judge</option>
                    <option value="Sponsor" className="bg-zinc-900">Corporate Sponsor</option>
                    <option value="Volunteer" className="bg-zinc-900">Volunteer</option>
                    <option value="Custom" className="bg-zinc-900">Custom / VIP</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Shirt Size *
                  </label>
                  <select
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value as any)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    {SHIRT_SIZES.map((s) => (
                      <option key={s} value={s} className="bg-zinc-900">
                        Size {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maruti Suzuki / SAEINDIA"
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Role / Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chief Judge / Vice President"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={newKitIssued}
                    onChange={(e) => setNewKitIssued(e.target.checked)}
                    className="rounded border-zinc-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Kit Already Issued / Given</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={newSponsorTshirt}
                    onChange={(e) => setNewSponsorTshirt(e.target.checked)}
                    className="rounded border-zinc-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Sponsor T-Shirt Given</span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Remarks / Location Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP Hangar, Stage Kit, Delivery Room"
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !newPersonName.trim()}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold transition-all disabled:opacity-50"
                >
                  Add Person & Kit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
