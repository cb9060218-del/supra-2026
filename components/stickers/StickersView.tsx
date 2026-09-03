"use client";

import React, { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, ChevronRight, Check, Search, Plus, ShieldAlert, Trash2, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

interface Team {
  num: string;
  name: string;
}

interface StickerCompany {
  id: string;
  company_name: string;
  sticker_size: string | null;
}

interface StickerPlacement {
  company_id: string;
  team_number: string;
  is_placed: boolean;
}

interface TeamStickerStatus {
  team_number: string;
  is_placed: boolean;
}

interface StickersViewProps {
  initialTeams: Team[];
  initialCompanies: StickerCompany[];
  initialPlacements: StickerPlacement[];
  initialOverallStatus: TeamStickerStatus[];
  userRole: string;
}

export default function StickersView({
  initialTeams,
  initialCompanies,
  initialPlacements,
  initialOverallStatus,
  userRole,
}: StickersViewProps) {
  const [companies, setCompanies] = useState<StickerCompany[]>(initialCompanies);
  const [placements, setPlacements] = useState<StickerPlacement[]>(initialPlacements);
  const [overallStatus, setOverallStatus] = useState<TeamStickerStatus[]>(initialOverallStatus);

  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
  const [companySearch, setCompanySearch] = useState<Record<string, string>>({});
  const [overallSearch, setOverallSearch] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newStickerSize, setNewStickerSize] = useState("");

  const [isPending, startTransition] = useTransition();
  const isWritable = ["super_admin", "admin", "coordinator"].includes(userRole);
  const supabase = createClient();

  const handleDeleteCompany = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete ${name} from the sticker placement tracker? This will remove all its checklists.`
      )
    )
      return;

    startTransition(async () => {
      const { error } = await supabase.from("sticker_companies").delete().eq("id", id);
      if (!error) {
        setCompanies((prev) => prev.filter((c) => c.id !== id));
        setPlacements((prev) => prev.filter((p) => p.company_id !== id));
      }
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedCompanies((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTogglePlacement = async (companyId: string, teamNumber: string) => {
    if (!isWritable) return;

    const current = placements.find(
      (p) => p.company_id === companyId && p.team_number === teamNumber
    );
    const nextVal = current ? !current.is_placed : true;
    const prevVal = current ? current.is_placed : false;

    setPlacements((prev) => {
      const exists = prev.some((p) => p.company_id === companyId && p.team_number === teamNumber);
      if (exists) {
        return prev.map((p) =>
          p.company_id === companyId && p.team_number === teamNumber ? { ...p, is_placed: nextVal } : p
        );
      } else {
        return [...prev, { company_id: companyId, team_number: teamNumber, is_placed: nextVal }];
      }
    });

    startTransition(async () => {
      const { error } = await supabase.from("sticker_placements").upsert(
        {
          company_id: companyId,
          team_number: teamNumber,
          is_placed: nextVal,
        },
        { onConflict: "company_id, team_number" }
      );

      if (error) {
        setPlacements((prev) =>
          prev.map((p) =>
            p.company_id === companyId && p.team_number === teamNumber ? { ...p, is_placed: prevVal } : p
          )
        );
        alert("Failed to update sticker placement: " + error.message);
      }
    });
  };

  const handleToggleOverall = async (teamNumber: string) => {
    if (!isWritable) return;

    const current = overallStatus.find((o) => o.team_number === teamNumber);
    const nextVal = current ? !current.is_placed : true;
    const prevVal = current ? current.is_placed : false;

    setOverallStatus((prev) => {
      const exists = prev.some((o) => o.team_number === teamNumber);
      if (exists) {
        return prev.map((o) => (o.team_number === teamNumber ? { ...o, is_placed: nextVal } : o));
      } else {
        return [...prev, { team_number: teamNumber, is_placed: nextVal }];
      }
    });

    startTransition(async () => {
      const { error } = await supabase.from("team_sticker_status").upsert(
        {
          team_number: teamNumber,
          is_placed: nextVal,
        },
        { onConflict: "team_number" }
      );

      if (error) {
        setOverallStatus((prev) =>
          prev.map((o) => (o.team_number === teamNumber ? { ...o, is_placed: prevVal } : o))
        );
        alert("Failed to update overall status: " + error.message);
      }
    });
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;

    const tempId = "temp-" + Date.now();
    const tempCompany = {
      id: tempId,
      company_name: newCompanyName.trim(),
      sticker_size: newStickerSize.trim() || null,
      created_at: new Date().toISOString()
    };

    setCompanies((prev) => [...prev, tempCompany]);
    setNewCompanyName("");
    setNewStickerSize("");
    setShowAddForm(false);

    startTransition(async () => {
      const { data, error } = await supabase
        .from("sticker_companies")
        .insert({
          company_name: tempCompany.company_name,
          sticker_size: tempCompany.sticker_size,
        })
        .select()
        .single();

      if (error || !data) {
        setCompanies((prev) => prev.filter((c) => c.id !== tempId));
        alert("Failed to add company: " + (error?.message || "Unknown error"));
      } else {
        setCompanies((prev) =>
          prev.map((c) => (c.id === tempId ? data : c))
        );
      }
    });
  };

  const handleExportExcel = () => {
    // 1. Team Placement Matrix
    const matrixData = initialTeams.map((t, idx) => {
      const overall = overallStatus.find((o) => o.team_number === t.num)?.is_placed;
      const row: Record<string, any> = {
        "Sr No": idx + 1,
        "Team Number": t.num,
        "Team Name": t.name,
        "Overall Stickering Completed": overall ? "YES" : "NO",
      };

      companies.forEach((c) => {
        const isPlaced = placements.some(
          (p) => p.company_id === c.id && p.team_number === t.num && p.is_placed
        );
        row[`${c.company_name} (${c.sticker_size || "Standard"})`] = isPlaced ? "PLACED" : "PENDING";
      });

      return row;
    });

    // 2. Company Summary
    const companySummary = companies.map((c, idx) => {
      const compPlacements = placements.filter((p) => p.company_id === c.id && p.is_placed).length;
      const pct = initialTeams.length ? Math.round((compPlacements / initialTeams.length) * 100) : 0;
      return {
        "Sr No": idx + 1,
        "Sponsor Company": c.company_name,
        "Sticker Size": c.sticker_size || "-",
        "Teams Stickered": `${compPlacements} / ${initialTeams.length}`,
        "Completion %": `${pct}%`,
        "Pending Teams": initialTeams.length - compPlacements,
      };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(matrixData), "Placement Matrix");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(companySummary), "Company Summary");

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `SUPRA_2026_Vehicle_Sticker_Placement_Report_${dateStr}.xlsx`);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Vehicle Sticker Placement Tracker
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Check off which sponsors' stickers have been placed on which competing teams' formula cars.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 transition-all shadow-sm"
            title="Download Vehicle Sticker Placement Matrix in Excel format"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Download Excel</span>
          </button>

          {isWritable && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-950 font-bold text-xs px-4 py-2.5 transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add company for stickers
            </button>
          )}
        </div>
      </div>

      {/* Add Company Form */}
      {showAddForm && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 p-5 space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Register sticker company
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Company name (e.g. MSIL)"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700"
            />
            <input
              type="text"
              placeholder="Sticker size / notes (e.g. Large 15x15cm)"
              value={newStickerSize}
              onChange={(e) => setNewStickerSize(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700"
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCompany}
              disabled={isPending || !newCompanyName.trim()}
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-950 font-bold text-xs px-4 py-2 disabled:opacity-50 transition-all"
            >
              Register
            </button>
          </div>
        </div>
      )}

      {/* Companies sticker lists */}
      <div className="space-y-4">
        {companies.map((company) => {
          const isOpen = !!expandedCompanies[company.id];
          const search = (companySearch[company.id] || "").toLowerCase();

          const companyPlacements = placements.filter(
            (p) => p.company_id === company.id && p.is_placed
          );
          const pct = Math.round((companyPlacements.length / initialTeams.length) * 100) || 0;

          const filteredTeams = initialTeams.filter(
            (t) =>
              !search || t.num.toLowerCase().includes(search) || t.name.toLowerCase().includes(search)
          );

          return (
            <div
              key={company.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/10 overflow-hidden shadow-sm"
            >
              {/* Card Header */}
              <div
                onClick={() => toggleExpand(company.id)}
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <ChevronDown className="h-4.5 w-4.5 text-zinc-400" />
                  ) : (
                    <ChevronRight className="h-4.5 w-4.5 text-zinc-400" />
                  )}
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {company.company_name}
                  </span>
                  {company.sticker_size && (
                    <span className="rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] px-2 py-0.5 font-bold tracking-wider uppercase">
                      {company.sticker_size}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500">
                  <span>
                    {companyPlacements.length} of {initialTeams.length} stickered
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                    {pct}% done
                  </span>
                  {isWritable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCompany(company.id, company.company_name);
                      }}
                      className="text-zinc-400 hover:text-red-500 p-1.5 rounded transition-all focus:outline-none"
                      title="Delete company"
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsed body */}
              {isOpen && (
                <div className="px-5 pb-5 border-t border-zinc-200 dark:border-zinc-900/50 pt-4 space-y-4">
                  {/* Progress tracker */}
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search team number or team name..."
                      value={companySearch[company.id] || ""}
                      onChange={(e) =>
                        setCompanySearch((prev) => ({ ...prev, [company.id]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-850 bg-transparent pl-9 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700"
                    />
                  </div>

                  {/* Teams Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {filteredTeams.map((t) => {
                      const placement = placements.find(
                        (p) => p.company_id === company.id && p.team_number === t.num
                      );
                      const isPlaced = placement ? placement.is_placed : false;

                      return (
                        <div
                          key={t.num}
                          onClick={() => handleTogglePlacement(company.id, t.num)}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                            isPlaced
                              ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                              : "bg-transparent border-zinc-200 dark:border-zinc-850/60 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                          }`}
                        >
                          <div
                            className={`h-4.5 w-4.5 rounded flex items-center justify-center border transition-all ${
                              isPlaced
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800"
                            }`}
                          >
                            {isPlaced && <Check className="h-3 w-3 stroke-[3px]" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold tracking-wider block font-mono">
                              {t.num}
                            </span>
                            <span className="text-xs truncate font-semibold block mt-0.5 leading-tight">
                              {t.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {filteredTeams.length === 0 && (
                      <div className="col-span-full py-4 text-center text-xs text-zinc-500 italic">
                        No competing teams match search criteria.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. Team overall sticker checklist */}
      <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-900/60">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Team Vehicle Sticker Status (All companies combined)
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Check off whether the car has completed sticker application overall, separate from the checklists above.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search overall team number or name..."
            value={overallSearch}
            onChange={(e) => setOverallSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-850 bg-transparent pl-9 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700"
          />
        </div>

        {/* Overall checklist grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
          {initialTeams
            .filter(
              (t) =>
                !overallSearch ||
                t.num.toLowerCase().includes(overallSearch.toLowerCase()) ||
                t.name.toLowerCase().includes(overallSearch.toLowerCase())
            )
            .map((t) => {
              const status = overallStatus.find((o) => o.team_number === t.num);
              const isPlaced = status ? status.is_placed : false;

              return (
                <div
                  key={t.num}
                  onClick={() => handleToggleOverall(t.num)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                    isPlaced
                      ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      : "bg-transparent border-zinc-200 dark:border-zinc-850/60 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div
                    className={`h-4.5 w-4.5 rounded flex items-center justify-center border transition-all ${
                      isPlaced
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800"
                    }`}
                  >
                    {isPlaced && <Check className="h-3 w-3 stroke-[3px]" />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold tracking-wider block font-mono">{t.num}</span>
                    <span className="text-xs truncate font-semibold block mt-0.5 leading-tight">
                      {t.name}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
