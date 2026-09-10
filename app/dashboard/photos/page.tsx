import React from "react";
import { createClient } from "@/lib/supabase/server";
import AIPhotoFinderView from "@/components/photos/AIPhotoFinderView";

export const revalidate = 0; // Fresh data on each request

export default async function PhotosPage() {
  const supabase = await createClient();

  // Retrieve user session & role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole = "viewer";
  let userProfile: any = null;

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role, full_name, avatar_url")
      .eq("id", user.id)
      .single();
    if (profile) {
      userRole = profile.role;
      userProfile = profile;
    }
  }

  // Retrieve event photos
  let photos: any[] = [];
  try {
    const { data: photoData } = await supabase
      .from("event_photos")
      .select("*")
      .order("created_at", { ascending: false });
    if (photoData) photos = photoData;
  } catch {}

  return (
    <div className="space-y-6">
      <AIPhotoFinderView
        initialPhotos={photos}
        userProfile={userProfile}
        userRole={userRole}
      />
    </div>
  );
}
