"use client";

import React, { useState, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, ShieldCheck, ShieldAlert, Award, FileDown } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { generateGatepassAction } from "@/app/dashboard/guests/actions";

interface Gatepass {
  id: string;
  qr_code: string;
  status: string;
  issued_at: string;
  scanned_at?: string;
  scanner?: {
    full_name: string;
  };
}

interface PassCardProps {
  guestId: string;
  guestName: string;
  guestRole: string;
  company?: string;
  gatepassStatus: string;
  initialGatepass: Gatepass | null;
  isWritable: boolean;
}

export default function PassCard({
  guestId,
  guestName,
  guestRole,
  company,
  gatepassStatus,
  initialGatepass,
  isWritable,
}: PassCardProps) {
  const [gatepass, setGatepass] = useState<Gatepass | null>(initialGatepass);
  const [status, setStatus] = useState(gatepassStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      const res = await generateGatepassAction(guestId, "Generated secure entry gatepass");
      if (res?.error) {
        setError(res.error);
      } else {
        setGatepass({
          id: Math.random().toString(),
          qr_code: res.qr_code || "",
          status: "active",
          issued_at: new Date().toISOString(),
        });
        setStatus("issued");
      }
    });
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const qrSvg = document.getElementById("qr-code-svg")?.outerHTML || "";

    printWindow.document.write(`
      <html>
        <head>
          <title>SUPRA SAEINDIA 2026 - Gatepass</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; color: #000; }
            .card { border: 2px solid #000; border-radius: 12px; padding: 30px; display: inline-block; max-width: 380px; }
            h2 { margin: 0 0 10px 0; font-size: 20px; text-transform: uppercase; }
            .role { background: #000; color: #fff; padding: 4px 12px; border-radius: 4px; display: inline-block; font-size: 11px; text-transform: uppercase; font-weight: bold; margin-bottom: 20px; }
            .qr { margin: 20px 0; }
            .token { font-family: monospace; font-size: 14px; font-weight: bold; }
            .footer { font-size: 10px; color: #666; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>SUPRA SAEINDIA 2026</h2>
            <div class="role">${guestRole}</div>
            <div class="name"><strong>${guestName}</strong></div>
            <div class="company">${company || ""}</div>
            <div class="qr">${qrSvg}</div>
            <div class="token">${gatepass?.qr_code}</div>
            <div class="footer">
              BUDDH INTERNATIONAL CIRCUIT, GREATER NOIDA<br>
              VALIDITY: 2–5 SEPTEMBER 2026
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6 space-y-4 flex flex-col items-center text-center">
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 w-full justify-center">
        <QrCode className="h-4.5 w-4.5 text-zinc-500" />
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Gatepass Pass Ticket
        </h3>
      </div>

      {error && (
        <div className="rounded-lg bg-red-950/50 border border-red-900/50 p-3 text-xs text-red-400 w-full">
          {error}
        </div>
      )}

      {status === "not_issued" ? (
        <div className="py-6 space-y-4 w-full">
          <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
            This guest does not have an active gatepass yet. Generate a secure pass to enable track access.
          </p>
          {isWritable && (
            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="rounded-lg bg-zinc-100 px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {isPending ? "Generating Ticket..." : "Generate QR Gatepass"}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4 w-full flex flex-col items-center">
          {/* QR Render */}
          <div className="bg-white p-4 rounded-xl shadow-md inline-block" id="qr-code-svg">
            <QRCodeSVG
              value={gatepass?.qr_code || ""}
              size={150}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-mono font-bold text-zinc-300">{gatepass?.qr_code}</p>
            <p className="text-[10px] text-zinc-550 text-zinc-500">
              Issued at: {gatepass ? formatDateTime(gatepass.issued_at) : ""}
            </p>
          </div>

          {/* Ticket Security Status */}
          {status === "scanned" ? (
            <div className="rounded-lg bg-purple-950/20 border border-purple-900/40 p-3 text-xs text-purple-400 flex items-center gap-2 justify-center w-full">
              <ShieldAlert className="h-4.5 w-4.5 text-purple-400 flex-shrink-0" />
              <div className="text-left leading-normal">
                <p className="font-semibold">Checked In & Scanned</p>
                <p className="text-[10px] text-purple-500 mt-0.5">
                  Scanned: {gatepass?.scanned_at ? formatDateTime(gatepass.scanned_at) : "N/A"}{" "}
                  by {gatepass?.scanner?.full_name || "Coordinator"}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-emerald-950/20 border border-emerald-900/40 p-3 text-xs text-emerald-400 flex items-center gap-2 justify-center w-full">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0" />
              <div className="text-left leading-normal">
                <p className="font-semibold">Ticket Active</p>
                <p className="text-[10px] text-emerald-500 mt-0.5">
                  Valid for track entry scan. Duplicate usage is locked.
                </p>
              </div>
            </div>
          )}

          {/* Printable Layout */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 hover:text-zinc-200 transition-colors pt-2"
          >
            <FileDown className="h-3.5 w-3.5" /> Print / Export Ticket PDF
          </button>
        </div>
      )}
    </div>
  );
}
