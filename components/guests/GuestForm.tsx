"use client";

import React, { useState, useTransition } from "react";
import { GuestInput } from "@/lib/validators";
import { createGuestAction, updateGuestAction } from "@/app/dashboard/guests/actions";

interface GuestFormProps {
  initialData?: GuestInput & { version: number; id: string };
  sponsors: { id: string; sponsor_name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function GuestForm({ initialData, sponsors, onClose, onSuccess }: GuestFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [guestName, setGuestName] = useState(initialData?.guest_name || "");
  const [sponsorId, setSponsorId] = useState(initialData?.sponsor_id || "");
  const [designation, setDesignation] = useState(initialData?.designation || "");
  const [company, setCompany] = useState(initialData?.company || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [role, setRole] = useState(initialData?.guest_role || "sponsor");
  const [attendance, setAttendance] = useState(initialData?.attendance_status || "invited");
  const [arrivalDate, setArrivalDate] = useState(initialData?.arrival_date || "");
  const [departureDate, setDepartureDate] = useState(initialData?.departure_date || "");
  const [accommodation, setAccommodation] = useState(initialData?.accommodation_required || false);
  const [remarks, setRemarks] = useState(initialData?.remarks || "");
  const [changeReason, setChangeReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (initialData && !changeReason.trim()) {
      setError("Please enter a reason for updating this guest record.");
      return;
    }

    const payload = {
      id: initialData?.id,
      guest_name: guestName,
      sponsor_id: sponsorId || null,
      designation,
      company,
      email,
      phone,
      guest_role: role,
      attendance_status: attendance,
      arrival_date: arrivalDate || null,
      departure_date: departureDate || null,
      accommodation_required: accommodation,
      remarks,
      version: initialData?.version,
      change_reason: changeReason || undefined,
    };

    startTransition(async () => {
      let res;
      if (initialData) {
        res = await updateGuestAction(payload);
      } else {
        res = await createGuestAction(payload);
      }

      if (res?.error) {
        if (res.error === "conflict") {
          setError("Optimistic lock conflict! This guest was updated elsewhere. Refresh and retry.");
        } else {
          setError(res.error);
        }
      } else {
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-950/50 border border-red-900/50 p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Guest Full Name
          </label>
          <input
            type="text"
            required
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="e.g. Dr. Amit Verma"
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Sponsor Organization (Optional)
          </label>
          <select
            value={sponsorId}
            onChange={(e) => setSponsorId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none"
          >
            <option value="">No Sponsor / Independent</option>
            {sponsors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sponsor_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Designation
          </label>
          <input
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="e.g. Technical Judge / Chief Engineer"
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-750 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Company / Institute
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Tata Motors / IIT Delhi"
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-750 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="amit.verma@domain.com"
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Phone Number
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 99999 88888"
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Event Role Category
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none"
          >
            <option value="vip">VIP Guest</option>
            <option value="sponsor">Sponsor Delegate</option>
            <option value="judge">Technical Judge</option>
            <option value="faculty">Faculty Advisor</option>
            <option value="media">Media Personnel</option>
            <option value="volunteer">Event Volunteer</option>
            <option value="team_member">SAEINDIA Organizer</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            RSVP Status
          </label>
          <select
            value={attendance}
            onChange={(e) => setAttendance(e.target.value as any)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none"
          >
            <option value="invited">Invited</option>
            <option value="confirmed">Confirmed</option>
            <option value="declined">Declined</option>
            <option value="attended">Attended (Checked-In)</option>
          </select>
        </div>

        <div className="flex items-center pt-6">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300">
            <input
              type="checkbox"
              checked={accommodation}
              onChange={(e) => setAccommodation(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-800 bg-zinc-950 text-zinc-100 focus:ring-zinc-700"
            />
            Accommodation Required
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Arrival Date (Trackside)
          </label>
          <input
            type="date"
            value={arrivalDate}
            onChange={(e) => setArrivalDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Departure Date (Trackside)
          </label>
          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Dietary or Operations Remarks
        </label>
        <textarea
          rows={2}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="e.g. VIP lunch pass required. Arranged pickup from Delhi airport..."
          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none resize-none"
        />
      </div>

      {initialData && (
        <div className="rounded-lg border border-yellow-900/40 bg-yellow-950/15 p-4 space-y-2">
          <label className="block text-xs font-semibold text-yellow-500 uppercase tracking-wider">
            Reason for Change (Required)
          </label>
          <input
            type="text"
            required
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="e.g. Corrected arrival date to Sept 3"
            className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none"
          />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-zinc-850 px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving..." : initialData ? "Update Guest" : "Add Guest"}
        </button>
      </div>
    </form>
  );
}
