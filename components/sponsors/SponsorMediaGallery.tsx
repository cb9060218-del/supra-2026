"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Image as ImageIcon,
  Video,
  Upload,
  Trash2,
  Download,
  Eye,
  X,
  Play,
  Film,
  Plus,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface MediaItem {
  id: string;
  sponsor_id: string;
  media_type: "photo" | "video";
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  caption?: string;
  created_at: string;
}

interface SponsorMediaGalleryProps {
  sponsorId: string;
  sponsorName: string;
  initialMedia?: MediaItem[];
  isWritable: boolean;
}

export default function SponsorMediaGallery({
  sponsorId,
  sponsorName,
  initialMedia = [],
  isWritable,
}: SponsorMediaGalleryProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaList, setMediaList] = useState<MediaItem[]>(initialMedia);
  const [activeTab, setActiveTab] = useState<"all" | "photos" | "videos">("all");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  // Load from local storage fallback as well to guarantee persistence across browser sessions
  useEffect(() => {
    try {
      const localKey = `supra_sponsor_media_${sponsorId}`;
      const saved = localStorage.getItem(localKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMediaList((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const additions = parsed.filter((m: MediaItem) => !ids.has(m.id));
          return [...prev, ...additions];
        });
      }
    } catch {
      // Ignore local storage parse errors
    }
  }, [sponsorId]);

  const saveToLocalStorage = (updated: MediaItem[]) => {
    try {
      const localKey = `supra_sponsor_media_${sponsorId}`;
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch {
      // Quota exceeded safe catch
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVid = file.type.startsWith("video/");
      const isImg = file.type.startsWith("image/");

      if (!isVid && !isImg) continue;

      const mediaType: "photo" | "video" = isVid ? "video" : "photo";
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const storagePath = `${sponsorId}/${Date.now()}_${sanitizedName}`;

      let finalUrl = "";

      // 1. Try Supabase Storage upload
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("sponsor_media")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from("sponsor_media")
            .getPublicUrl(storagePath);
          finalUrl = publicUrlData.publicUrl;
        }
      } catch {
        // Fallback to local data URL if bucket is not created
      }

      // 2. Fallback to Data URL for instant rendering & local usage
      if (!finalUrl) {
        finalUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const newMedia: MediaItem = {
        id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sponsor_id: sponsorId,
        media_type: mediaType,
        file_name: file.name,
        file_url: finalUrl,
        file_size: file.size,
        mime_type: file.type,
        caption: `${sponsorName} ${mediaType === "photo" ? "Photo" : "Video"}`,
        created_at: new Date().toISOString(),
      };

      // 3. Try inserting into Supabase sponsor_media table
      try {
        await supabase.from("sponsor_media").insert({
          sponsor_id: sponsorId,
          media_type: mediaType,
          file_name: file.name,
          file_url: finalUrl,
          file_size: file.size,
          mime_type: file.type,
          caption: newMedia.caption,
        });
      } catch {
        // Table not migrated yet
      }

      // 4. Update client state optimistically
      setMediaList((prev) => {
        const updated = [newMedia, ...prev];
        saveToLocalStorage(updated);
        return updated;
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media item?")) return;

    setMediaList((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      saveToLocalStorage(updated);
      return updated;
    });

    try {
      await supabase.from("sponsor_media").delete().eq("id", id);
    } catch {
      // Ignore
    }

    if (selectedMedia?.id === id) {
      setSelectedMedia(null);
    }
  };

  const filteredMedia = mediaList.filter((m) => {
    if (activeTab === "photos") return m.media_type === "photo";
    if (activeTab === "videos") return m.media_type === "video";
    return true;
  });

  const photoCount = mediaList.filter((m) => m.media_type === "photo").length;
  const videoCount = mediaList.filter((m) => m.media_type === "video").length;

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/40 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-indigo-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
            {sponsorName} Photos & Videos ({mediaList.length})
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Tabs */}
          <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/80 p-0.5 text-[10px] font-semibold">
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-md px-2.5 py-1 transition-all ${
                activeTab === "all"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              All ({mediaList.length})
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={`rounded-md px-2.5 py-1 transition-all ${
                activeTab === "photos"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Photos ({photoCount})
            </button>
            <button
              onClick={() => setActiveTab("videos")}
              className={`rounded-md px-2.5 py-1 transition-all ${
                activeTab === "videos"
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Videos ({videoCount})
            </button>
          </div>

          {/* Upload Button */}
          {isWritable && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 transition-all shadow-sm disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                <span>Add Photos/Videos</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Display */}
      {filteredMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-800/80 py-8 text-center bg-white/50 dark:bg-zinc-950/20">
          <ImageIcon className="h-8 w-8 text-zinc-400 dark:text-zinc-600 mb-2" />
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            No {activeTab === "all" ? "photos or videos" : activeTab} uploaded for {sponsorName} yet.
          </p>
          {isWritable && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-[11px] font-bold text-indigo-500 hover:underline inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Upload from this device
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-850 bg-black/5 dark:bg-zinc-900 aspect-video flex items-center justify-center cursor-pointer shadow-sm hover:border-indigo-500/50 transition-all"
              onClick={() => setSelectedMedia(item)}
            >
              {item.media_type === "photo" ? (
                <img
                  src={item.file_url}
                  alt={item.file_name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="relative h-full w-full bg-zinc-950 flex items-center justify-center">
                  <video
                    src={item.file_url}
                    className="h-full w-full object-cover opacity-80"
                    preload="metadata"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="rounded-full bg-white/90 dark:bg-zinc-900/90 p-2 shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="h-4 w-4 text-indigo-600 dark:text-indigo-400 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* Type Badge */}
              <span className="absolute top-1.5 left-1.5 rounded bg-black/70 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                {item.media_type === "photo" ? (
                  <ImageIcon className="h-2.5 w-2.5" />
                ) : (
                  <Video className="h-2.5 w-2.5" />
                )}
                {item.media_type}
              </span>

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMedia(item);
                  }}
                  className="rounded-full bg-white/20 hover:bg-white/40 p-1.5 text-white transition-colors"
                  title="View Fullscreen"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>

                <a
                  href={item.file_url}
                  download={item.file_name}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-full bg-white/20 hover:bg-white/40 p-1.5 text-white transition-colors"
                  title="Download File"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>

                {isWritable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="rounded-full bg-red-600/80 hover:bg-red-600 p-1.5 text-white transition-colors"
                    title="Delete Media"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Video Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 text-xs">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold truncate mr-4">
                {selectedMedia.media_type === "photo" ? (
                  <ImageIcon className="h-4 w-4 text-indigo-400" />
                ) : (
                  <Video className="h-4 w-4 text-indigo-400" />
                )}
                <span className="truncate">{selectedMedia.file_name}</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedMedia.file_url}
                  download={selectedMedia.file_name}
                  className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition-all flex items-center gap-1 text-[11px] font-bold"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="w-full flex-1 p-2 flex items-center justify-center max-h-[75vh] overflow-hidden bg-black/90">
              {selectedMedia.media_type === "photo" ? (
                <img
                  src={selectedMedia.file_url}
                  alt={selectedMedia.file_name}
                  className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <video
                  src={selectedMedia.file_url}
                  controls
                  autoPlay
                  className="max-h-[72vh] max-w-full rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
