"use client";

import React, { useState, useTransition } from "react";
import QrScanner from "@/components/shared/QrScanner";
import { verifyGatepassScanAction } from "@/app/dashboard/guests/actions";
import { CheckCircle2, XCircle, Search, Clock, Award } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface ScanLog {
  id: string;
  qr_code: string;
  scanned_at: string;
  guests: {
    guest_name: string;
    guest_role: string;
    company?: string;
  };
}

interface GatepassScannerViewProps {
  initialScans: ScanLog[];
}

export default function GatepassScannerView({ initialScans }: GatepassScannerViewProps) {
  const [scans, setScans] = useState<ScanLog[]>(initialScans);
  const [result, setResult] = useState<{ success?: string; error?: string; guest?: any } | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleScanSuccess = (code: string) => {
    setResult(null);
    startTransition(async () => {
      const res = await verifyGatepassScanAction(code);
      if (res.error) {
        setResult({ error: res.error, guest: res.guest });
      } else {
        setResult({ success: `Guest Checked In Successfully!`, guest: res.guest });
        // Add to local scan list
        const newScanLog: ScanLog = {
          id: Math.random().toString(),
          qr_code: code,
          scanned_at: new Date().toISOString(),
          guests: {
            guest_name: res.guest.guest_name,
            guest_role: res.guest.guest_role,
            company: res.guest.company || undefined,
          },
        };
        setScans((prev) => [newScanLog, ...prev.slice(0, 14)]);
      }
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScanSuccess(manualCode.trim().toUpperCase());
    setManualCode("");
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left Columns - Scanner View */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6 flex flex-col items-center">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">
            Gatepass QR Scanner
          </h2>
          <QrScanner onScanSuccess={handleScanSuccess} />
        </div>

        {/* Results banner box */}
        {result && (
          <div className="animate-fade-in">
            {result.success ? (
              <div className="rounded-xl border border-emerald-900 bg-emerald-950/20 p-6 flex items-start gap-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 flex-shrink-0" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-emerald-400">{result.success}</h3>
                  <div className="text-xs text-zinc-300 space-y-0.5 pt-1">
                    <p>
                      <strong>Guest:</strong> {result.guest?.guest_name}
                    </p>
                    <p>
                      <strong>Role:</strong>{" "}
                      <span className="capitalize text-emerald-500 font-semibold">
                        {result.guest?.guest_role}
                      </span>
                    </p>
                    <p>
                      <strong>Company/Sponsor:</strong> {result.guest?.company || "Independent"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-red-900 bg-red-950/20 p-6 flex items-start gap-4">
                <XCircle className="h-8 w-8 text-red-400 flex-shrink-0" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-red-400">Scan Error</h3>
                  <p className="text-xs text-zinc-300 leading-normal">{result.error}</p>
                  {result.guest && (
                    <div className="text-xs text-zinc-400 pt-2 border-t border-red-900/30 mt-2 space-y-0.5">
                      <p>
                        <strong>Registered Guest:</strong> {result.guest.guest_name}
                      </p>
                      <p>
                        <strong>Company:</strong> {result.guest.company || "Independent"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fallback Manual entry form */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6 space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Search className="h-4.5 w-4.5 text-zinc-555 text-zinc-500" /> Manual Pass Verification
          </h3>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            If the device camera has permission or resolution issues, input the guest ticket code (e.g.
            SUPRA2026_XXXX) manually to verify entry check-in.
          </p>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="e.g. SUPRA2026_E1F4B8"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-150 placeholder-zinc-700 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 px-4 py-1.5 text-xs text-zinc-200 font-bold transition-colors disabled:opacity-50"
            >
              Verify Code
            </button>
          </form>
        </div>
      </div>

      {/* Right Column - Recent checkins history */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6 space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-3">
          <Clock className="h-4.5 w-4.5 text-zinc-500" /> Recent Track Entries
        </h3>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {scans.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-8">No guest checkins recorded yet.</p>
          ) : (
            scans.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-lg bg-zinc-950/20 border border-zinc-900 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between font-semibold text-zinc-300">
                  <span>{s.guests?.guest_name}</span>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {new Date(s.scanned_at).toLocaleTimeString("en-IN", {
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span className="capitalize">{s.guests?.guest_role}</span>
                  <span className="font-mono">{s.qr_code.substring(0, 15)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
