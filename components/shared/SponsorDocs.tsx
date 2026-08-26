"use client";

import React, { useEffect, useState, useTransition } from "react";
import { FileText, Upload, Download, Loader2, FileCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SponsorDocsProps {
  sponsorId: string;
  isWritable: boolean;
}

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  size: number;
}

export default function SponsorDocs({ sponsorId, isWritable }: SponsorDocsProps) {
  const supabase = createClient();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const docTypes = [
    { id: "logo", name: "Company Logo" },
    { id: "mou", name: "Signed MoU" },
    { id: "agreement", name: "Sponsorship Agreement" },
    { id: "invoice", name: "Finance Invoice" },
    { id: "po", name: "Purchase Order (PO)" },
    { id: "proof", name: "Payment Proof" },
  ];

  const fetchFiles = async () => {
    setLoading(true);
    // List files in the sponsor's folder
    const { data, error } = await supabase.storage
      .from("sponsor_docs")
      .list(sponsorId);

    if (data) {
      // Exclude placeholder folders
      setFiles(data.filter((f) => f.name !== ".emptyFolderPlaceholder") as any[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, [sponsorId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingType(type);
    startTransition(async () => {
      // Create prefix name: e.g. logo_mycompany.png
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const storagePath = `${sponsorId}/${type}_${sanitizedName}`;

      const { error } = await supabase.storage
        .from("sponsor_docs")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        alert("Upload failed: " + error.message);
      } else {
        // Log action in audit logs by writing a dummy profile update or let triggers catch it?
        // Storage events are logged, but we can also trigger a re-fetch
        await fetchFiles();
      }
      setUploadingType(null);
    });
  };

  const handleDownload = async (fileName: string) => {
    const storagePath = `${sponsorId}/${fileName}`;
    const { data, error } = await supabase.storage
      .from("sponsor_docs")
      .createSignedUrl(storagePath, 60); // 60 seconds expiry

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      alert("Error generating download link: " + error?.message);
    }
  };

  // Find file matching type prefix
  const getFileForType = (typeId: string) => {
    return files.find((f) => f.name.startsWith(`${typeId}_`));
  };

  return (
    <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-6 space-y-4">
      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
        <FileText className="h-4.5 w-4.5 text-zinc-500" /> Document Repository
      </h3>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {docTypes.map((doc) => {
            const file = getFileForType(doc.id);
            const isUploading = uploadingType === doc.id;

            return (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg border border-zinc-900 bg-zinc-950/20 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate mr-2">
                  {file ? (
                    <FileCheck className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <FileText className="h-4.5 w-4.5 text-zinc-650 text-zinc-600 flex-shrink-0" />
                  )}
                  <div className="truncate">
                    <p className="font-semibold text-zinc-300">{doc.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {file ? file.name.substring(doc.id.length + 1) : "Not uploaded"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {file && (
                    <button
                      onClick={() => handleDownload(file.name)}
                      className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-900 rounded bg-zinc-950"
                      title="Download Document"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {isWritable && (
                    <label className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-900 rounded bg-zinc-950 cursor-pointer flex items-center justify-center">
                      {isUploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      <input
                        type="file"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => handleFileUpload(e, doc.id)}
                        accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv"
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
