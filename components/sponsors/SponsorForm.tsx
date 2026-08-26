"use client";

import React, { useState, useTransition } from "react";
import { SponsorInput } from "@/lib/validators";
import { createSponsorAction, updateSponsorAction } from "@/app/dashboard/sponsors/actions";

interface SponsorFormProps {
  initialData?: SponsorInput & { version: number; id: string };
  onClose: () => void;
  onSuccess: () => void;
}

export default function SponsorForm({ initialData, onClose, onSuccess }: SponsorFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [sponsorName, setSponsorName] = useState(initialData?.sponsor_name || "");
  const [sponsorTier, setSponsorTier] = useState(initialData?.sponsor_tier || "silver");
  const [amount, setAmount] = useState(initialData?.sponsorship_amount || 0);
  const [paymentStatus, setPaymentStatus] = useState(initialData?.payment_status || "pending");
  const [leadStatus, setLeadStatus] = useState(initialData?.lead_status || "prospect");
  const [contactPerson, setContactPerson] = useState(initialData?.contact_person || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [changeReason, setChangeReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (initialData && !changeReason.trim()) {
      setError("Please provide a reason for editing this record.");
      return;
    }

    const payload = {
      id: initialData?.id,
      sponsor_name: sponsorName,
      sponsor_tier: sponsorTier,
      sponsorship_amount: Number(amount),
      payment_status: paymentStatus,
      lead_status: leadStatus,
      contact_person: contactPerson,
      email,
      phone,
      notes,
      version: initialData?.version,
      change_reason: changeReason || undefined,
    };

    startTransition(async () => {
      let res;
      if (initialData) {
        res = await updateSponsorAction(payload);
      } else {
        res = await createSponsorAction(payload);
      }

      if (res?.error) {
        if (res.error === "conflict") {
          setError("This record was updated by another user. Please close this form, refresh the page, and try again.");
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
            Sponsor Company Name
          </label>
          <input
            type="text"
            required
            value={sponsorName}
            onChange={(e) => setSponsorName(e.target.value)}
            placeholder="e.g. Bosch India"
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:border-zinc-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Sponsor Tier
          </label>
          <select
            value={sponsorTier}
            onChange={(e) => setSponsorTier(e.target.value as any)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-700 focus:outline-none"
          >
            <option value="principal">Principal Sponsor</option>
            <option value="platinum">Platinum Sponsor</option>
            <option value="gold">Gold Sponsor</option>
            <option value="lunch">Lunch Sponsor</option>
            <option value="silver">Silver Sponsor</option>
            <option value="bronze">Bronze Sponsor</option>
            <option value="custom">Custom Sponsor</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Sponsorship Amount (INR)
          </label>
          <input
            type="number"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="e.g. 500000"
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:border-zinc-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Payment Status
          </label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as any)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-700 focus:outline-none"
          >
            <option value="pending">Pending</option>
            <option value="partial">Partial Payment</option>
            <option value="paid">Paid Full</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Lead / Pipeline Status
          </label>
          <select
            value={leadStatus}
            onChange={(e) => setLeadStatus(e.target.value as any)}
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-700 focus:outline-none"
          >
            <option value="prospect">Prospect</option>
            <option value="contacted">Contacted</option>
            <option value="meeting_scheduled">Meeting Scheduled</option>
            <option value="proposal_sent">Proposal Sent</option>
            <option value="negotiation">Negotiation</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Contact Person Name
          </label>
          <input
            type="text"
            required
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="e.g. Anand Kumar"
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:border-zinc-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="anand@bosch.com"
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:border-zinc-700 focus:outline-none"
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
            placeholder="+91 98989 89898"
            className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:border-zinc-700 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Sponsorship Notes
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Entitlement remarks or details of discussions..."
          className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:border-zinc-700 focus:outline-none resize-none"
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
            placeholder="e.g. Updated amount based on revised MoU"
            className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:border-zinc-700 focus:outline-none"
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
          {isPending ? "Saving..." : initialData ? "Update Sponsor" : "Add Sponsor"}
        </button>
      </div>
    </form>
  );
}
