"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, Loader2 } from "lucide-react";

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export default function QrScanner({ onScanSuccess }: QrScannerProps) {
  const [hasCamera, setHasCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Initialize html5QrCode
    const html5QrCode = new Html5Qrcode("qr-scanner-element");
    html5QrCodeRef.current = html5QrCode;
    setLoading(false);

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch((err) => console.log("Stop failed", err));
      }
    };
  }, []);

  const startScan = async () => {
    if (!html5QrCodeRef.current) return;
    setLoading(true);

    try {
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          },
        },
        (decodedText) => {
          onScanSuccess(decodedText);
          stopScan();
        },
        () => {
          // Silent catch of scan failures
        }
      );
      setScanning(true);
      setHasCamera(true);
    } catch (err) {
      console.error("Camera start error", err);
      alert("Unable to access camera. Please check permissions.");
    } finally {
      setLoading(false);
    }
  };

  const stopScan = async () => {
    if (!html5QrCodeRef.current || !html5QrCodeRef.current.isScanning) return;
    setLoading(true);
    try {
      await html5QrCodeRef.current.stop();
      setScanning(false);
    } catch (err) {
      console.error("Stop failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      {/* Scanner Viewport Box */}
      <div className="relative w-full aspect-square rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl flex items-center justify-center">
        <div id="qr-scanner-element" className="absolute inset-0 w-full h-full object-cover" />

        {!scanning && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-555 text-zinc-500 gap-2 px-6 text-center">
            <CameraOff className="h-8 w-8 text-zinc-650" />
            <p className="text-xs">Camera is offline</p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        )}

        {scanning && (
          /* Scanner Target Overlay overlay */
          <div className="absolute inset-0 border-2 border-dashed border-emerald-500/30 pointer-events-none z-10 m-8 animate-pulse rounded-xl flex items-center justify-center">
            <div className="h-full w-0.5 bg-emerald-500/20 absolute left-1/2 animate-ping" />
          </div>
        )}
      </div>

      <div className="flex justify-center w-full">
        {scanning ? (
          <button
            onClick={stopScan}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-red-900 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 transition-colors"
          >
            <CameraOff className="h-4 w-4" /> Stop Camera
          </button>
        ) : (
          <button
            onClick={startScan}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-zinc-100 px-6 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors shadow-lg"
          >
            <Camera className="h-4 w-4" /> Initialize Scanner
          </button>
        )}
      </div>
    </div>
  );
}
