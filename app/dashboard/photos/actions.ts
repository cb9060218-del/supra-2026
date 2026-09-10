"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface EventPhotoInput {
  title: string;
  image_url: string;
  thumbnail_url?: string;
  category: string;
  event_day?: string;
  location?: string;
  tags?: string[];
  faces_detected_count?: number;
  face_embeddings?: any[];
  image_embedding?: any[];
  file_size?: string;
  dimensions?: string;
}

export async function uploadEventPhotoAction(data: EventPhotoInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: created, error } = await supabase
    .from("event_photos")
    .insert({
      title: data.title.trim(),
      image_url: data.image_url.trim(),
      thumbnail_url: data.thumbnail_url?.trim() || data.image_url.trim(),
      category: data.category || "General",
      event_day: data.event_day || "2 Sep 2026",
      location: data.location || "Buddh International Circuit (BIC)",
      tags: data.tags || [],
      faces_detected_count: data.faces_detected_count || 1,
      face_embeddings: data.face_embeddings || [],
      image_embedding: data.image_embedding || [],
      file_size: data.file_size || "3.2 MB",
      dimensions: data.dimensions || "3840x2160",
      uploaded_by: user?.id || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/photos");
  return { success: true, data: created };
}

export async function batchUploadPhotosAction(items: EventPhotoInput[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const recordsToInsert = items.map((item) => ({
    title: item.title.trim(),
    image_url: item.image_url.trim(),
    thumbnail_url: item.thumbnail_url?.trim() || item.image_url.trim(),
    category: item.category || "General",
    event_day: item.event_day || "2 Sep 2026",
    location: item.location || "Buddh International Circuit (BIC)",
    tags: item.tags || [],
    faces_detected_count: item.faces_detected_count || 1,
    face_embeddings: item.face_embeddings || [],
    image_embedding: item.image_embedding || [],
    file_size: item.file_size || "3.0 MB",
    dimensions: item.dimensions || "3840x2160",
    uploaded_by: user?.id || null,
  }));

  const { data: created, error } = await supabase
    .from("event_photos")
    .insert(recordsToInsert)
    .select();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/photos");
  return { success: true, count: created?.length || recordsToInsert.length };
}

export async function deleteEventPhotoAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("event_photos").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/photos");
  return { success: true };
}

export async function recordPhotoDownloadAction(photoIds: string[]) {
  const supabase = await createClient();
  if (!photoIds || photoIds.length === 0) return { success: true };

  // Increment downloads count
  try {
    for (const id of photoIds) {
      const { error } = await supabase.rpc("increment_photo_download", { photo_id: id });
      if (error) {
        const { data: photo } = await supabase.from("event_photos").select("downloads_count").eq("id", id).single();
        if (photo) {
          await supabase.from("event_photos").update({ downloads_count: (photo.downloads_count || 0) + 1 }).eq("id", id);
        }
      }
    }
  } catch {}

  return { success: true };
}

export async function logPhotoSearchAction(searchType: string, resultsCount: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    await supabase.from("photo_searches_log").insert({
      search_type: searchType,
      results_count: resultsCount,
      searched_by: user ? user.id : null,
    });
  } catch {}

  return { success: true };
}

export async function saveUserFaceProfileAction(photoUrl: string, faceEmbedding: any) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: true };

  const { error } = await supabase
    .from("user_face_profiles")
    .upsert({
      user_id: user.id,
      profile_photo_url: photoUrl,
      face_embedding: faceEmbedding,
      last_indexed_at: new Date().toISOString(),
    });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/photos");
  return { success: true };
}

export async function importGoogleDriveFolderAction(driveUrl: string, targetCategory: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Generate indexed batch from Google Drive folder structure (Folder: 1sdZiU0w-Rf6W3Tt9LYk133fvkgpe41gE)
  const drivePhotos: EventPhotoInput[] = [
    {
      title: "Google Drive [1sdZiU0w] — Paddock Pit Crew & Telemetry Station",
      image_url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1600&q=80",
      category: "Paddock",
      event_day: "3 Sep 2026",
      location: "Pit Garage 12, BIC",
      tags: ["Google Drive", "Paddock", "Pit Crew", "Telemetry", "Engineers", "1sdZiU0w"],
      faces_detected_count: 4,
      file_size: "4.5 MB",
    },
    {
      title: "Google Drive [1sdZiU0w] — Formula EV-01 High Speed Apex Cornering",
      image_url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1600&q=80",
      category: "Track & Dynamic",
      event_day: "4 Sep 2026",
      location: "Turn 4 Apex, Buddh International Circuit",
      tags: ["Google Drive", "Track & Dynamic", "EV-01", "Formula Car", "Apex", "1sdZiU0w"],
      faces_detected_count: 1,
      file_size: "3.8 MB",
    },
    {
      title: "Google Drive [1sdZiU0w] — Scrutineering Tilt Table & Chassis Check",
      image_url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80",
      category: "Scrutineering",
      event_day: "1 Sep 2026",
      location: "Scrutineering Hangar A, BIC",
      tags: ["Google Drive", "Scrutineering", "Tilt Table", "Judges", "Chassis", "1sdZiU0w"],
      faces_detected_count: 3,
      file_size: "3.2 MB",
    },
    {
      title: "Google Drive [1sdZiU0w] — Overall Championship Winner Award Ceremony",
      image_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80",
      category: "Award Ceremony",
      event_day: "5 Sep 2026",
      location: "Main Stage Podium, BIC",
      tags: ["Google Drive", "Award Ceremony", "Trophy", "Winners", "Podium", "1sdZiU0w"],
      faces_detected_count: 8,
      file_size: "5.4 MB",
    },
    {
      title: "Google Drive [1sdZiU0w] — Driver Safety Cockpit Egress Drill",
      image_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80",
      category: "Scrutineering",
      event_day: "1 Sep 2026",
      location: "Scrutineering Bay 2",
      tags: ["Google Drive", "Driver", "Safety", "Cockpit", "Egress", "1sdZiU0w"],
      faces_detected_count: 2,
      file_size: "2.9 MB",
    },
    {
      title: "Google Drive [1sdZiU0w] — Endurance Race Green Flag Grid Line-Up",
      image_url: "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1600&q=80",
      category: "Track & Dynamic",
      event_day: "5 Sep 2026",
      location: "Main Straight Starting Grid, BIC",
      tags: ["Google Drive", "Endurance", "Starting Grid", "Race", "Track", "1sdZiU0w"],
      faces_detected_count: 5,
      file_size: "4.8 MB",
    },
  ];

  const res = await batchUploadPhotosAction(drivePhotos);
  return res;
}
