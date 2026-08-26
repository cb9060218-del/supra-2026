"use client";

import React, { useState, useTransition } from "react";
import { MessageSquare, Phone, Users, Mail, Plus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { addSponsorInteractionAction } from "@/app/dashboard/sponsors/actions";

interface Interaction {
  id: string;
  type: string;
  summary: string;
  details?: string;
  created_at: string;
  users?: {
    full_name: string;
  };
}

interface InteractionListProps {
  sponsorId: string;
  interactions: Interaction[];
  isWritable: boolean;
}

export default function InteractionList({ sponsorId, interactions, isWritable }: InteractionListProps) {
  const [list, setList] = useState<Interaction[]>(interactions);
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [type, setType] = useState<any>("call");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!summary.trim()) {
      setError("Summary is required.");
      return;
    }

    startTransition(async () => {
      const res = await addSponsorInteractionAction({
        sponsor_id: sponsorId,
        type,
        summary,
        details,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        // Optimistically add to list
        const newItem: Interaction = {
          id: Math.random().toString(),
          type,
          summary,
          details,
          created_at: new Date().toISOString(),
          users: { full_name: "You (refreshing)" },
        };
        setList((prev) => [newItem, ...prev]);
        setIsAdding(false);
        setSummary("");
        setDetails("");
        window.location.reload(); // Hard refresh to fetch proper user names
      }
    });
  };

  function getIcon(type: string) {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4 text-sky-400" />;
      case "meeting":
        return <Users className="h-4 w-4 text-emerald-400" />;
      case "email":
        return <Mail className="h-4 w-4 text-amber-400" />;
      default:
        return <MessageSquare className="h-4 w-4 text-indigo-400" />;
    }
  }

  return (
    <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="h-4.5 w-4.5 text-zinc-500" /> Communication Log
        </h3>
        {isWritable && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 text-[10px] font-semibold rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 px-2 py-1 text-zinc-300 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Log Touchpoint
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-850 space-y-3">
          {error && (
            <div className="text-[10px] text-red-400 bg-red-950/30 border border-red-900/30 p-2 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase">Touchpoint Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="mt-1 block w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="call">Phone Call</option>
                <option value="meeting">In-Person Meeting</option>
                <option value="email">Email Sent/Received</option>
                <option value="whatsapp">WhatsApp Text</option>
                <option value="proposal_sent">Proposal Dispatched</option>
                <option value="payment_reminder">Payment Reminder</option>
                <option value="follow_up">General Follow-Up</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase">Summary</label>
              <input
                type="text"
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g. Discussed final logo dimensions"
                className="mt-1 block w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase">Conversation Details</label>
            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Anand agreed to send the high-res SVG vectors by tomorrow morning..."
              className="mt-1 block w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setError(null);
              }}
              className="rounded border border-zinc-850 px-3 py-1 text-[10px] font-medium text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-zinc-100 px-3 py-1 text-[10px] font-bold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
            >
              {isPending ? "Logging..." : "Save Touchpoint"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">No communications logged yet.</p>
        ) : (
          list.map((item) => (
            <div key={item.id} className="flex gap-3 text-xs p-3 rounded-lg bg-zinc-950/20 border border-zinc-900">
              <div className="mt-0.5">{getIcon(item.type)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200 capitalize">{item.type.replace("_", " ")}</span>
                  <span className="text-[10px] text-zinc-500">{formatDateTime(item.created_at)}</span>
                </div>
                <p className="text-zinc-300 font-medium">{item.summary}</p>
                {item.details && <p className="text-[11px] text-zinc-500 mt-1 leading-normal">{item.details}</p>}
                <p className="text-[9px] text-zinc-500 italic">Logged by {item.users?.full_name}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
