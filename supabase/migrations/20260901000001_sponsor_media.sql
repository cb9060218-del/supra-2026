-- Migration: 20260901000001_sponsor_media.sql
-- Description: Creates sponsor_media table and Supabase storage bucket for photos and videos

CREATE TABLE IF NOT EXISTS public.sponsor_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('photo', 'video')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  mime_type text,
  caption text,
  uploaded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.sponsor_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view sponsor media" ON public.sponsor_media;
DROP POLICY IF EXISTS "Authenticated users can insert sponsor media" ON public.sponsor_media;
DROP POLICY IF EXISTS "Staff can delete sponsor media" ON public.sponsor_media;

CREATE POLICY "Authenticated users can view sponsor media"
  ON public.sponsor_media FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert sponsor media"
  ON public.sponsor_media FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Staff can delete sponsor media"
  ON public.sponsor_media FOR DELETE
  USING (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator') OR auth.uid() = uploaded_by);

-- Create storage bucket if not present
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sponsor_media', 'sponsor_media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage bucket access policies
DROP POLICY IF EXISTS "Public Access for Sponsor Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload Sponsor Media" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete Sponsor Media" ON storage.objects;

CREATE POLICY "Public Access for Sponsor Media"
ON storage.objects FOR SELECT
USING (bucket_id = 'sponsor_media');

CREATE POLICY "Authenticated users can upload Sponsor Media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sponsor_media' AND auth.role() = 'authenticated');

CREATE POLICY "Staff can delete Sponsor Media"
ON storage.objects FOR DELETE
USING (bucket_id = 'sponsor_media' AND auth.role() = 'authenticated');
