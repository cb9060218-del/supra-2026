"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Trash2,
  Check,
  Loader2,
  Lock,
  Calendar,
  Film,
  Image as ImageIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  computeGuestDateBreakdown,
  isGuestAttendingOnDate,
  DateBreakdownItem,
} from "@/lib/dateUtils";
import SponsorMediaGallery, { MediaItem } from "./SponsorMediaGallery";
import {
  createSponsorAction,
  updateBenefitStatusAction,
  createBenefitAction,
  deleteBenefitAction,
  updateSponsorPaymentStatusAction,
  deleteSponsorAction,
} from "@/app/dashboard/sponsors/actions";
import {
  createGuestAction,
  deleteGuestAction,
  updateGuestFieldInlineAction,
  toggleGuestGatepassAction,
} from "@/app/dashboard/guests/actions";

interface Sponsor {
  id: string;
  sponsor_name: string;
  sponsor_tier: string;
  sponsor_tier_label?: string;
  sponsorship_amount: number;
  payment_status: string;
  lead_status: string;
  contact_person: string;
  email: string;
  phone: string;
  notes: string;
}

interface Guest {
  id: string;
  sponsor_id: string;
  guest_name: string;
  designation?: string;
  email?: string;
  phone?: string;
  remarks?: string;
  attendance_status: string;
  gatepass_status: string;
  guest_role: string;
}

interface Benefit {
  id: string;
  sponsor_id: string;
  benefit_name: string;
  status: string;
}

interface SponsorListProps {
  initialSponsors: Sponsor[];
  initialGuests: Guest[];
  initialBenefits: Benefit[];
  initialMedia?: MediaItem[];
  userRole: string;
}

export default function SponsorList({
  initialSponsors,
  initialGuests,
  initialBenefits,
  initialMedia = [],
  userRole,
}: SponsorListProps) {
  const router = useRouter();
  const [sponsors, setSponsors] = useState<Sponsor[]>(initialSponsors);
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [benefits, setBenefits] = useState<Benefit[]>(initialBenefits);
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);

  useEffect(() => {
    setSponsors(initialSponsors);
  }, [initialSponsors]);

  useEffect(() => {
    setGuests(initialGuests);
  }, [initialGuests]);

  useEffect(() => {
    setBenefits(initialBenefits);
  }, [initialBenefits]);

  useEffect(() => {
    setMedia(initialMedia);
  }, [initialMedia]);

  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");
  const [openSponsors, setOpenSponsors] = useState<Set<string>>(new Set());
  const [isAddSponsorOpen, setIsAddSponsorOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // New Sponsor Form state
  const [nsName, setNsName] = useState("");
  const [nsTier, setNsTier] = useState("Principal");
  const [nsTierLabel, setNsTierLabel] = useState("");
  const [nsAmount, setNsAmount] = useState("");
  const [nsPay, setNsPay] = useState("-");
  const [nsNonMon, setNsNonMon] = useState("");
  const [sponsorError, setSponsorError] = useState<string | null>(null);

  // New Guest Form states (mapped by sponsor ID)
  const [newGuestName, setNewGuestName] = useState<Record<string, string>>({});
  const [newGuestDesig, setNewGuestDesig] = useState<Record<string, string>>({});
  const [newGuestPhone, setNewGuestPhone] = useState<Record<string, string>>({});
  const [newGuestEmail, setNewGuestEmail] = useState<Record<string, string>>({});
  const [newGuestDate, setNewGuestDate] = useState<Record<string, string>>({});
  const [newBenefitName, setNewBenefitName] = useState<Record<string, string>>({});

  const isWritable = ["super_admin", "admin", "coordinator"].includes(userRole);

  const handleDeleteSponsor = (sponsorId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will remove the sponsor and its associated data.`)) return;

    startTransition(async () => {
      const res = await deleteSponsorAction(sponsorId, `Deleted sponsor: ${name}`);
      if (res?.error) {
        alert("Failed to delete sponsor: " + res.error);
      } else {
        setSponsors((prev) => prev.filter((s) => s.id !== sponsorId));
      }
    });
  };

  const handlePaymentStatusChange = (sponsorId: string, value: string) => {
    const prevPayment = sponsors.find(s => s.id === sponsorId)?.payment_status || "-";
    setSponsors((prev) =>
      prev.map((s) => (s.id === sponsorId ? { ...s, payment_status: value } : s))
    );
    startTransition(async () => {
      const res = await updateSponsorPaymentStatusAction(sponsorId, value, `Updated payment status to ${value}`);
      if (res?.error) {
        setSponsors((prev) =>
          prev.map((s) => (s.id === sponsorId ? { ...s, payment_status: prevPayment } : s))
        );
        alert("Failed to update payment status: " + res.error);
      }
    });
  };

  const handleAddBenefit = (sponsorId: string) => {
    const name = newBenefitName[sponsorId]?.trim();
    if (!name) return;

    const tempId = "temp-" + Date.now();
    const newBenefitObj: Benefit = {
      id: tempId,
      sponsor_id: sponsorId,
      benefit_name: name,
      status: "pending",
    };

    setBenefits((prev) => [...prev, newBenefitObj]);
    setNewBenefitName((prev) => ({ ...prev, [sponsorId]: "" }));

    startTransition(async () => {
      const res = await createBenefitAction(sponsorId, name, `Added benefit: ${name}`);
      if (res?.error) {
        setBenefits((prev) => prev.filter((b) => b.id !== tempId));
        alert("Failed to add benefit: " + res.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleDeleteBenefit = (benefitId: string, sponsorId: string, benefitName: string) => {
    if (!confirm(`Are you sure you want to remove benefit "${benefitName}"?`)) return;
    startTransition(async () => {
      const res = await deleteBenefitAction(benefitId, sponsorId, `Deleted benefit: ${benefitName}`);
      if (!res.error) {
        setBenefits((prev) => prev.filter((b) => b.id !== benefitId));
      }
    });
  };

  const handleToggleSponsor = (sponsorName: string) => {
    const next = new Set(openSponsors);
    if (next.has(sponsorName)) {
      next.delete(sponsorName);
    } else {
      next.add(sponsorName);
    }
    setOpenSponsors(next);
  };

  // 1. Calculations
  const getGuestStatus = (g: Guest) => {
    const status = g.attendance_status;
    const hasGP = g.gatepass_status === "issued" || g.gatepass_status === "scanned";
    return {
      confirmed: status === "confirmed" || status === "Confirmed" || status === "attended" ? "Confirmed" : status === "Not" || status === "not" || status === "declined" ? "Not" : "Pending",
      gatePass: hasGP,
    };
  };

  const dateBreakdown = computeGuestDateBreakdown(guests);

  const filteredGuests = guests.filter((g) => {
    const st = getGuestStatus(g);
    const matchesDate = isGuestAttendingOnDate(g.remarks, null, null, selectedDateFilter);
    if (!matchesDate) return false;

    if (activeFilter === "Confirmed") return st.confirmed === "Confirmed";
    if (activeFilter === "Pending") return st.confirmed === "Pending";
    if (activeFilter === "Not") return st.confirmed === "Not";
    if (activeFilter === "gp-yes") return st.gatePass === true;
    if (activeFilter === "gp-no") return st.gatePass !== true;
    return true;
  });

  const getSponsorGuests = (sponsorId: string) => {
    return filteredGuests.filter((g) => g.sponsor_id === sponsorId);
  };

  const getSponsorAllGuests = (sponsorId: string) => {
    return guests.filter((g) => g.sponsor_id === sponsorId);
  };

  // Search & Filter
  const finalSponsors = sponsors.filter((sp) => {
    const spGuests = getSponsorGuests(sp.id);
    const spAllGuests = getSponsorAllGuests(sp.id);
    const matchesTier = !tierFilter || sp.sponsor_tier.toLowerCase() === tierFilter.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      sp.sponsor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spAllGuests.some((g) => g.guest_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilterState = (activeFilter === "all" && selectedDateFilter === "all") || spGuests.length > 0;

    return matchesTier && matchesSearch && matchesFilterState;
  });

  // Total stats counters
  const totalGuestsCount = guests.length;
  const confirmedCount = guests.filter((g) => getGuestStatus(g).confirmed === "Confirmed").length;
  const pendingCount = guests.filter((g) => getGuestStatus(g).confirmed === "Pending").length;
  const notCount = guests.filter((g) => getGuestStatus(g).confirmed === "Not").length;
  const gpYesCount = guests.filter((g) => getGuestStatus(g).gatePass).length;
  const gpNoCount = guests.filter((g) => !getGuestStatus(g).gatePass).length;
  const totalSponsorsCount = sponsors.length;

  // Form Submissions
  const handleAddSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nsName.trim()) return;

    setSponsorError(null);
    startTransition(async () => {
      const res = await createSponsorAction({
        sponsor_name: nsName,
        sponsor_tier: nsTier.toLowerCase(),
        sponsorship_amount: parseFloat(nsAmount) || 0,
        payment_status: nsPay === "-" ? "-" : nsPay,
        lead_status: "confirmed",
        contact_person: nsName + " Coordinator",
        notes: nsNonMon || null,
        change_reason: `Added sponsor: ${nsName} via tracker`,
      });

      if (res?.error) {
        setSponsorError(res.error);
      } else {
        setNsName("");
        setNsTierLabel("");
        setNsAmount("");
        setNsPay("-");
        setNsNonMon("");
        setIsAddSponsorOpen(false);
        router.refresh();
      }
    });
  };

  const handleAddGuest = (sponsorId: string, sponsorName: string) => {
    const name = newGuestName[sponsorId]?.trim();
    if (!name) return;

    const tempId = "temp-" + Date.now();
    const gDesig = newGuestDesig[sponsorId]?.trim() || "";
    const gPhone = newGuestPhone[sponsorId]?.trim() || "";
    const gEmail = newGuestEmail[sponsorId]?.trim() || "";
    const gDate = newGuestDate[sponsorId]?.trim() || "";

    const tempGuest: Guest = {
      id: tempId,
      guest_name: name,
      sponsor_id: sponsorId,
      designation: gDesig,
      email: gEmail,
      phone: gPhone,
      remarks: gDate,
      attendance_status: "Pending",
      gatepass_status: "not_issued",
      guest_role: "sponsor",
    };

    setGuests((p) => [...p, tempGuest]);

    setNewGuestName((p) => ({ ...p, [sponsorId]: "" }));
    setNewGuestDesig((p) => ({ ...p, [sponsorId]: "" }));
    setNewGuestPhone((p) => ({ ...p, [sponsorId]: "" }));
    setNewGuestEmail((p) => ({ ...p, [sponsorId]: "" }));
    setNewGuestDate((p) => ({ ...p, [sponsorId]: "" }));

    startTransition(async () => {
      const res = await createGuestAction({
        sponsor_id: sponsorId,
        guest_name: name,
        designation: gDesig,
        company: sponsorName,
        email: gEmail,
        phone: gPhone,
        remarks: gDate,
        attendance_status: "Pending",
        guest_role: "sponsor",
        accommodation_required: false,
        change_reason: `Added guest: ${name} directly under ${sponsorName}`,
      });

      if (res?.error) {
        setGuests((prev) => prev.filter((g) => g.id !== tempId));
        alert("Failed to add guest: " + res.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleInlineEdit = (guestId: string, field: string, value: string) => {
    let guestField = "";
    if (field === "name") guestField = "guest_name";
    else if (field === "designation") guestField = "designation";
    else if (field === "contact") guestField = "phone";
    else if (field === "email") guestField = "email";
    else if (field === "date") guestField = "remarks";

    if (!guestField) return;

    const prevValue = guests.find((g) => g.id === guestId)?.[guestField as keyof Guest] || "";

    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, [guestField]: value } : g))
    );

    startTransition(async () => {
      const res = await updateGuestFieldInlineAction(
        guestId,
        field,
        value,
        `Inline edited guest ${field} value`
      );
      if (res?.error) {
        setGuests((prev) =>
          prev.map((g) => (g.id === guestId ? { ...g, [guestField]: prevValue } : g))
        );
        alert("Failed to save: " + res.error);
      }
    });
  };

  const handleRSVPChange = (guestId: string, value: string) => {
    const prevRSVP = guests.find(g => g.id === guestId)?.attendance_status || "Pending";
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, attendance_status: value } : g))
    );
    startTransition(async () => {
      const res = await updateGuestFieldInlineAction(
        guestId,
        "attendance_status",
        value,
        `Updated RSVP status to ${value}`
      );
      if (res?.error) {
        setGuests((prev) =>
          prev.map((g) => (g.id === guestId ? { ...g, attendance_status: prevRSVP } : g))
        );
        alert("Failed to update RSVP: " + res.error);
      }
    });
  };

  const handleToggleGatepass = (guestId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "issued" || currentStatus === "scanned" ? "not_issued" : "issued";
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, gatepass_status: nextStatus } : g))
    );
    startTransition(async () => {
      const res = await toggleGuestGatepassAction(
        guestId,
        currentStatus,
        `Toggled gatepass ticket status`
      );
      if (res?.error) {
        setGuests((prev) =>
          prev.map((g) => (g.id === guestId ? { ...g, gatepass_status: currentStatus } : g))
        );
        alert("Failed to update gatepass: " + res.error);
      }
    });
  };

  const handleDeleteGuest = (guestId: string, guestName: string) => {
    if (!confirm(`Are you sure you want to remove guest ${guestName}?`)) return;
    startTransition(async () => {
      const res = await deleteGuestAction(guestId, `Deleted guest: ${guestName}`);
      if (!res.error) {
        setGuests((prev) => prev.filter((g) => g.id !== guestId));
      }
    });
  };

  const handleToggleBenefit = (benefitId: string, sponsorId: string, currentStatus: string) => {
    if (!isWritable) return;
    const nextStatus = currentStatus === "completed" ? "pending" : "completed";
    setBenefits((prev) =>
      prev.map((b) => (b.id === benefitId ? { ...b, status: nextStatus } : b))
    );
    startTransition(async () => {
      const res = await updateBenefitStatusAction(
        benefitId,
        sponsorId,
        nextStatus,
        "",
        "Toggled benefit completion"
      );
      if (res?.error) {
        setBenefits((prev) =>
          prev.map((b) => (b.id === benefitId ? { ...b, status: currentStatus } : b))
        );
        alert("Failed to update benefit status: " + res.error);
      }
    });
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "principal":
        return "bg-rose-950/40 text-rose-400 border-rose-900";
      case "platinum":
        return "bg-slate-900 text-slate-350 border-slate-800";
      case "gold":
        return "bg-yellow-950/40 text-yellow-400 border-yellow-900";
      case "lunch":
        return "bg-emerald-950/40 text-emerald-400 border-emerald-900";
      case "silver":
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
      case "bronze":
        return "bg-amber-900/20 text-amber-400 border-amber-900/40";
      default:
        return "bg-zinc-950 text-zinc-400 border-zinc-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Deck */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Total Guests</span>
          <span className="text-xl font-bold text-zinc-200 mt-1 block">{totalGuestsCount}</span>
        </div>
        <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 border-emerald-900/25 bg-emerald-950/5">
          <span className="text-[10px] text-emerald-500 font-semibold uppercase block">Confirmed</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">{confirmedCount}</span>
        </div>
        <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 border-amber-900/25 bg-amber-950/5">
          <span className="text-[10px] text-amber-500 font-semibold uppercase block">Pending</span>
          <span className="text-xl font-bold text-amber-400 mt-1 block">{pendingCount}</span>
        </div>
        <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 border-red-950/25 bg-red-950/5">
          <span className="text-[10px] text-red-500 font-semibold uppercase block">Not coming</span>
          <span className="text-xl font-bold text-red-400 mt-1 block">{notCount}</span>
        </div>
        <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4">
          <span className="text-[10px] text-zinc-555 text-zinc-500 font-semibold uppercase block">Pass Done</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">{gpYesCount}</span>
        </div>
        <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4">
          <span className="text-[10px] text-zinc-555 text-zinc-500 font-semibold uppercase block">Pass Pending</span>
          <span className="text-xl font-bold text-amber-400 mt-1 block">{gpNoCount}</span>
        </div>
        <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4">
          <span className="text-[10px] text-zinc-555 text-zinc-500 font-semibold uppercase block">Total Sponsors</span>
          <span className="text-xl font-bold text-zinc-200 mt-1 block">{totalSponsorsCount}</span>
        </div>
      </div>

      {/* Event Dates & Guest Attendance Schedule */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Expected Guest Attendance by Event Date
            </span>
          </div>
          <span className="text-[11px] text-zinc-500">
            Click any date to view which sponsors & guests are attending on that day
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedDateFilter("all")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
              selectedDateFilter === "all"
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold"
                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>All Dates</span>
            <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
              {totalGuestsCount}
            </span>
          </button>

          {dateBreakdown.map((item) => {
            const isSelected = selectedDateFilter === item.dateKey;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedDateFilter(isSelected ? "all" : item.dateKey)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold"
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
                title={`${item.displayLabel}: ${item.description}`}
              >
                <span>{item.shortLabel}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    item.count > 0
                      ? isSelected
                        ? "bg-amber-400 text-zinc-950 font-black"
                        : "bg-zinc-800 text-amber-400"
                      : "bg-zinc-800/60 text-zinc-600"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {selectedDateFilter !== "all" && (
          <div className="flex items-center justify-between rounded-lg bg-amber-950/20 border border-amber-900/30 px-3 py-2 text-xs text-amber-300">
            <span>
              Filtering by: <strong>{dateBreakdown.find((d) => d.dateKey === selectedDateFilter)?.displayLabel || selectedDateFilter}</strong> ({filteredGuests.length} guests across {finalSponsors.length} sponsors)
            </span>
            <button
              onClick={() => setSelectedDateFilter("all")}
              className="text-[11px] underline font-bold hover:text-white"
            >
              Reset to All Dates
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-zinc-900/10 border border-zinc-900 p-4 rounded-xl">
        <div className="flex flex-1 gap-2 max-w-lg">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-650" />
            <input
              type="text"
              placeholder="Search guest or sponsor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-10 pr-4 py-2 text-xs text-zinc-150 focus:outline-none focus:border-zinc-700"
            />
          </div>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="">All Tiers</option>
            <option value="Principal">Principal</option>
            <option value="Platinum">Platinum</option>
            <option value="Gold">Gold</option>
            <option value="Lunch">Lunch</option>
            <option value="Silver">Silver</option>
            <option value="Bronze">Bronze</option>
            <option value="Other">Other / Custom</option>
          </select>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "all", label: "All guests" },
            { id: "Confirmed", label: "Confirmed" },
            { id: "Pending", label: "Pending" },
            { id: "Not", label: "Not coming" },
            { id: "gp-yes", label: "Gate pass done" },
            { id: "gp-no", label: "Gate pass pending" },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                activeFilter === chip.id
                  ? "bg-zinc-100 border-zinc-100 text-zinc-950"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Sponsor Button & Form */}
      {isWritable && (
        <div className="space-y-4">
          <button
            onClick={() => setIsAddSponsorOpen(!isAddSponsorOpen)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 px-4 py-2.5 text-xs text-zinc-200 font-bold transition-all"
          >
            <Plus className="h-4 w-4" /> Add New Sponsor
          </button>

          {isAddSponsorOpen && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                New Sponsor Form
              </h3>
              {sponsorError && (
                <div className="rounded bg-red-950/20 border border-red-900/40 p-2.5 text-xs text-red-400">
                  {sponsorError}
                </div>
              )}
              <form onSubmit={handleAddSponsor} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Sponsor name (e.g. MSIL)"
                    value={nsName}
                    onChange={(e) => setNsName(e.target.value)}
                    className="rounded border border-zinc-800 bg-zinc-900 px-3 py-2 focus:outline-none"
                  />
                  <select
                    value={nsTier}
                    onChange={(e) => setNsTier(e.target.value)}
                    className="rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-300 focus:outline-none"
                  >
                    <option value="Principal">Principal</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Gold">Gold</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Silver">Silver</option>
                    <option value="Bronze">Bronze</option>
                    <option value="Other">Other / Custom</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Custom label (optional, e.g. Kit Partner)"
                    value={nsTierLabel}
                    onChange={(e) => setNsTierLabel(e.target.value)}
                    className="rounded border border-zinc-800 bg-zinc-900 px-3 py-2 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
                  <input
                    type="number"
                    placeholder="Amount in Rs (0 if non-monetary)"
                    value={nsAmount}
                    onChange={(e) => setNsAmount(e.target.value)}
                    className="rounded border border-zinc-800 bg-zinc-900 px-3 py-2 focus:outline-none"
                  />
                  <select
                    value={nsPay}
                    onChange={(e) => setNsPay(e.target.value)}
                    className="rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-300 focus:outline-none"
                  >
                    <option value="-">No payment tracked</option>
                    <option value="Pending">Pending</option>
                    <option value="Payment Received">Payment received</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Non-monetary support details (optional)"
                    value={nsNonMon}
                    onChange={(e) => setNsNonMon(e.target.value)}
                    className="rounded border border-zinc-800 bg-zinc-900 px-3 py-2 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold px-4 py-2 text-xs transition-colors"
                >
                  Create Sponsor
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Sponsors Deck */}
      <div className="space-y-4">
        {finalSponsors.map((sp) => {
          const isCardOpen = openSponsors.has(sp.sponsor_name);
          const spGuests = getSponsorGuests(sp.id);
          const spAllGuests = getSponsorAllGuests(sp.id);

          const spBenefits = benefits.filter((b) => b.sponsor_id === sp.id);
          const completedBenefits = spBenefits.filter((b) => b.status === "completed").length;
          const pct = spBenefits.length ? Math.round((completedBenefits / spBenefits.length) * 100) : 0;

          const isPayReceived = sp.payment_status === "Payment Received" || sp.payment_status === "paid";
          const payPillClass = isPayReceived
            ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/40"
            : sp.payment_status === "-"
            ? "bg-zinc-900 text-zinc-500 border-zinc-800"
            : "bg-amber-950/20 text-amber-400 border-amber-900/40";

          return (
            <div key={sp.id} className="rounded-xl border border-zinc-900 bg-zinc-900/10 overflow-hidden">
              {/* Header */}
              <div
                onClick={() => handleToggleSponsor(sp.sponsor_name)}
                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4.5 cursor-pointer hover:bg-zinc-900/20 transition-colors select-none ${
                  isCardOpen ? "border-b border-zinc-900 bg-zinc-950/10" : ""
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {isCardOpen ? (
                    <ChevronDown className="h-4.5 w-4.5 text-zinc-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4.5 w-4.5 text-zinc-500 flex-shrink-0" />
                  )}
                  <span className={`rounded border px-2 py-0.5 text-[9px] uppercase font-black tracking-wide ${getTierColor(sp.sponsor_tier)}`}>
                    {sp.sponsor_tier_label || sp.sponsor_tier}
                  </span>
                  <h3 className="font-bold text-zinc-200">{sp.sponsor_name}</h3>
                </div>

                <div className="flex items-center gap-4 flex-wrap text-xs text-zinc-400">
                  <span className="font-bold text-zinc-250">
                    {sp.sponsorship_amount > 0 ? formatCurrency(sp.sponsorship_amount) : "Non-monetary"}
                  </span>
                  {sp.payment_status && (
                    <select
                      value={sp.payment_status}
                      disabled={!isWritable}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handlePaymentStatusChange(sp.id, e.target.value)}
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold tracking-wider bg-zinc-950 focus:outline-none cursor-pointer ${payPillClass}`}
                    >
                      <option value="-">-</option>
                      <option value="Pending">Pending</option>
                      <option value="Payment Received">Payment Received</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                    </select>
                  )}
                  <span className="rounded bg-zinc-900/50 border border-zinc-850 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                    {spAllGuests.length} guest{spAllGuests.length !== 1 ? "s" : ""}
                  </span>
                  <span className="rounded bg-zinc-900/50 border border-zinc-850 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                    {completedBenefits}/{spBenefits.length} benefits
                  </span>
                  <span className="rounded bg-zinc-900/50 border border-zinc-850 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 flex items-center gap-1">
                    <Film className="h-3 w-3" />
                    {media.filter((m) => m.sponsor_id === sp.id).length} media
                  </span>
                  {isWritable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSponsor(sp.id, sp.sponsor_name);
                      }}
                      className="text-zinc-550 hover:text-red-550 p-1.5 rounded transition-all focus:outline-none"
                      title="Delete Sponsor"
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Card Body */}
              {isCardOpen && (
                <div className="p-6 space-y-6">
                  {/* Benefits */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-zinc-550 text-zinc-500 uppercase tracking-wider block">
                      Entitled benefits — Click to toggle completion status
                    </span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                      {spBenefits.map((b) => {
                        const isDone = b.status === "completed";
                        return (
                          <div
                            key={b.id}
                            onClick={() => handleToggleBenefit(b.id, sp.id, b.status)}
                            className={`flex items-center justify-between border rounded-lg px-3 py-2 text-xs transition-all cursor-pointer ${
                              isDone
                                ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
                                : "bg-zinc-950/40 border-zinc-900 text-zinc-450 hover:border-zinc-800 hover:text-zinc-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`h-4.5 w-4.5 border rounded flex items-center justify-center ${
                                isDone ? "bg-emerald-500 border-emerald-500 text-black font-black" : "border-zinc-700 bg-zinc-900"
                              }`}>
                                {isDone && <Check className="h-3 w-3" />}
                              </div>
                              <span className="font-medium truncate max-w-[180px]" title={b.benefit_name}>
                                {b.benefit_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <span className={`text-[9px] font-bold uppercase ${isDone ? "text-emerald-500" : "text-zinc-600"}`}>
                                {isDone ? "Completed" : "Pending"}
                              </span>
                              {isWritable && (
                                <button
                                  onClick={() => handleDeleteBenefit(b.id, sp.id, b.benefit_name)}
                                  className="text-zinc-550 hover:text-red-400 font-bold px-1.5 py-0.5"
                                  title="Delete Benefit"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {isWritable && (
                      <div className="flex gap-2 max-w-sm mt-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          placeholder="Add custom benefit..."
                          value={newBenefitName[sp.id] || ""}
                          onChange={(e) => setNewBenefitName(prev => ({ ...prev, [sp.id]: e.target.value }))}
                          className="rounded border border-zinc-850 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none w-full"
                        />
                        <button
                          onClick={() => handleAddBenefit(sp.id)}
                          disabled={isPending || !newBenefitName[sp.id]?.trim()}
                          className="rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs px-3 py-1.5 disabled:opacity-50 transition-all flex-shrink-0"
                        >
                          Add Benefit
                        </button>
                      </div>
                    )}

                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                        <span>{completedBenefits} of {spBenefits.length} benefits delivered</span>
                        <span>{pct}% Completed</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Non monetary details */}
                  {sp.notes && sp.notes !== "-" && (
                    <div className="bg-zinc-950/20 border border-zinc-900 p-3 rounded-lg text-xs">
                      <span className="block text-[10px] text-zinc-500 uppercase font-semibold">Non-monetary details</span>
                      <p className="mt-1 text-zinc-400">{sp.notes}</p>
                    </div>
                  )}

                  {/* Guests Table */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-zinc-550 text-zinc-500 uppercase tracking-wider block">
                      Registered Guests (Edit inline)
                    </span>
                    <div className="rounded-lg border border-zinc-900 bg-zinc-950/20 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs">
                          <thead>
                            <tr className="border-b border-zinc-900 bg-zinc-900/30 text-zinc-500 font-semibold uppercase tracking-wider">
                              <th className="px-4 py-2.5">Guest Name</th>
                              <th className="px-4 py-2.5">Designation</th>
                              <th className="px-4 py-2.5">Contact</th>
                              <th className="px-4 py-2.5">Email</th>
                              <th className="px-4 py-2.5">Expected Dates</th>
                              <th className="px-4 py-2.5">Confirmation</th>
                              <th className="px-4 py-2.5">Gate Pass</th>
                              <th className="px-4 py-2.5 text-right"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900">
                            {spGuests.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-4 py-6 text-center text-zinc-600 font-medium">
                                  No guests matched current chips filters.
                                </td>
                              </tr>
                            ) : (
                              spGuests.map((g) => {
                                const st = getGuestStatus(g);
                                return (
                                  <tr key={g.id} className="hover:bg-zinc-900/10">
                                    <td className="px-3 py-2">
                                      <input
                                        type="text"
                                        defaultValue={g.guest_name}
                                        disabled={!isWritable}
                                        onBlur={(e) => handleInlineEdit(g.id, "name", e.target.value)}
                                        className="bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-zinc-700 rounded px-1.5 py-0.5 text-zinc-250 hover:bg-zinc-800/40 w-full font-semibold"
                                      />
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="text"
                                        defaultValue={g.designation || ""}
                                        disabled={!isWritable}
                                        placeholder="—"
                                        onBlur={(e) => handleInlineEdit(g.id, "designation", e.target.value)}
                                        className="bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-zinc-700 rounded px-1.5 py-0.5 text-zinc-400 hover:bg-zinc-800/40 w-full"
                                      />
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="text"
                                        defaultValue={g.phone || ""}
                                        disabled={!isWritable}
                                        placeholder="—"
                                        onBlur={(e) => handleInlineEdit(g.id, "contact", e.target.value)}
                                        className="bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-zinc-700 rounded px-1.5 py-0.5 text-zinc-400 hover:bg-zinc-800/40 w-full"
                                      />
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="text"
                                        defaultValue={g.email || ""}
                                        disabled={!isWritable}
                                        placeholder="—"
                                        onBlur={(e) => handleInlineEdit(g.id, "email", e.target.value)}
                                        className="bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-zinc-700 rounded px-1.5 py-0.5 text-zinc-400 hover:bg-zinc-800/40 w-full"
                                      />
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="text"
                                        defaultValue={g.remarks || ""}
                                        disabled={!isWritable}
                                        placeholder="—"
                                        onBlur={(e) => handleInlineEdit(g.id, "date", e.target.value)}
                                        className="bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-zinc-700 rounded px-1.5 py-0.5 text-zinc-400 hover:bg-zinc-800/40 w-full"
                                      />
                                    </td>
                                    <td className="px-3 py-2">
                                      <select
                                        value={st.confirmed}
                                        disabled={!isWritable}
                                        onChange={(e) => handleRSVPChange(g.id, e.target.value)}
                                        className={`rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] font-bold focus:outline-none ${
                                          st.confirmed === "Confirmed"
                                            ? "text-emerald-400 border-emerald-950"
                                            : st.confirmed === "Not"
                                            ? "text-red-400 border-red-950"
                                            : "text-amber-400 border-amber-950"
                                        }`}
                                      >
                                        <option value="Pending">Pending</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Not">Not coming</option>
                                      </select>
                                    </td>
                                    <td className="px-3 py-2">
                                      <button
                                        onClick={() => handleToggleGatepass(g.id, g.gatepass_status)}
                                        disabled={!isWritable}
                                        className={`rounded border px-2.5 py-1 text-[11px] font-bold tracking-wider transition-colors ${
                                          st.gatePass
                                            ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
                                            : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-350"
                                        }`}
                                      >
                                        {st.gatePass ? "✓ Issued" : "Not issued"}
                                      </button>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {isWritable && (
                                        <button
                                          onClick={() => handleDeleteGuest(g.id, g.guest_name)}
                                          className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Inline Add Guest Row */}
                    {isWritable && (
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-6 border-t border-zinc-900 pt-3">
                        <input
                          type="text"
                          placeholder="Guest name"
                          value={newGuestName[sp.id] || ""}
                          onChange={(e) => setNewGuestName((p) => ({ ...p, [sp.id]: e.target.value }))}
                          className="rounded border border-zinc-850 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Designation"
                          value={newGuestDesig[sp.id] || ""}
                          onChange={(e) => setNewGuestDesig((p) => ({ ...p, [sp.id]: e.target.value }))}
                          className="rounded border border-zinc-850 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Contact"
                          value={newGuestPhone[sp.id] || ""}
                          onChange={(e) => setNewGuestPhone((p) => ({ ...p, [sp.id]: e.target.value }))}
                          className="rounded border border-zinc-850 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Email"
                          value={newGuestEmail[sp.id] || ""}
                          onChange={(e) => setNewGuestEmail((p) => ({ ...p, [sp.id]: e.target.value }))}
                          className="rounded border border-zinc-850 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Expected date / comments"
                          value={newGuestDate[sp.id] || ""}
                          onChange={(e) => setNewGuestDate((p) => ({ ...p, [sp.id]: e.target.value }))}
                          className="rounded border border-zinc-850 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none"
                        />
                        <button
                          onClick={() => handleAddGuest(sp.id, sp.sponsor_name)}
                          disabled={isPending || !newGuestName[sp.id]?.trim()}
                          className="rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs py-1.5 disabled:opacity-50 transition-colors"
                        >
                          Add Guest
                        </button>
                      </div>
                    )}

                    {/* Photos & Videos Media Gallery */}
                    <SponsorMediaGallery
                      sponsorId={sp.id}
                      sponsorName={sp.sponsor_name}
                      initialMedia={media.filter((m) => m.sponsor_id === sp.id)}
                      isWritable={isWritable}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
