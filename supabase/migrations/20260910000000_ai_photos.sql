-- Migration: 20260910000000_ai_photos.sql
-- Description: Creates schema, tables, RLS policies, and seed data for the AI Photo Finder module

-- ========================================================
-- 1. EVENT PHOTOS TABLE
-- ========================================================
CREATE TABLE IF NOT EXISTS public.event_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  thumbnail_url text,
  category text NOT NULL CHECK (category IN ('Paddock', 'Track & Dynamic', 'Scrutineering', 'Pit Setup', 'Award Ceremony', 'Formula Cars', 'Team & Crew', 'VIP & Guests', 'General')) DEFAULT 'General',
  event_day text DEFAULT '2 Sep 2026',
  location text DEFAULT 'Buddh International Circuit (BIC)',
  tags text[] DEFAULT '{}',
  faces_detected_count integer DEFAULT 0,
  face_embeddings jsonb DEFAULT '[]'::jsonb,
  image_embedding jsonb DEFAULT '[]'::jsonb,
  file_size text DEFAULT '2.4 MB',
  dimensions text DEFAULT '3840x2160',
  views_count integer DEFAULT 0,
  downloads_count integer DEFAULT 0,
  uploaded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view event photos" ON public.event_photos;
DROP POLICY IF EXISTS "Staff can manage event photos" ON public.event_photos;

CREATE POLICY "Authenticated users can view event photos"
  ON public.event_photos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage event photos"
  ON public.event_photos FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'));


-- ========================================================
-- 2. PHOTO SEARCH LOGS
-- ========================================================
CREATE TABLE IF NOT EXISTS public.photo_searches_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_type text NOT NULL CHECK (search_type IN ('face', 'image_similarity', 'my_photos', 'tag', 'keyword')),
  results_count integer DEFAULT 0,
  searched_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.photo_searches_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view photo search logs" ON public.photo_searches_log;
DROP POLICY IF EXISTS "Staff can manage photo search logs" ON public.photo_searches_log;

CREATE POLICY "Authenticated users can view photo search logs"
  ON public.photo_searches_log FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage photo search logs"
  ON public.photo_searches_log FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'));


-- ========================================================
-- 3. USER FACE PROFILES FOR "MY PHOTOS"
-- ========================================================
CREATE TABLE IF NOT EXISTS public.user_face_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profile_photo_url text NOT NULL,
  face_embedding jsonb NOT NULL,
  last_indexed_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id)
);

ALTER TABLE public.user_face_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own face profile" ON public.user_face_profiles;

CREATE POLICY "Users can manage their own face profile"
  ON public.user_face_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ========================================================
-- 4. SEED INITIAL EVENT GALLERY PHOTOS
-- ========================================================
INSERT INTO public.event_photos (title, image_url, category, event_day, location, tags, faces_detected_count, file_size, dimensions, views_count, downloads_count) VALUES
  (
    'Formula EV-01 High Speed Apex Turn - Buddh Circuit',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1600&q=80',
    'Track & Dynamic',
    '3 Sep 2026',
    'Turn 4, Buddh International Circuit',
    ARRAY['Formula Car', 'EV-01', 'Track', 'Dynamic', 'Race', 'Electric Vehicle', 'Apex'],
    1,
    '3.8 MB',
    '3840x2160',
    142,
    38
  ),
  (
    'Team Amrita Racing Paddock Pit Tuning & Telemetry',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1600&q=80',
    'Paddock',
    '2 Sep 2026',
    'Pit Lane Garage 12, BIC',
    ARRAY['Paddock', 'Team', 'Pit Setup', 'Engineers', 'Tuning', 'Formula Car'],
    4,
    '4.1 MB',
    '4000x2667',
    98,
    24
  ),
  (
    'Technical Scrutineering & Tilt Table Inspection',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
    'Scrutineering',
    '1 Sep 2026',
    'Scrutineering Hangar A, BIC',
    ARRAY['Scrutineering', 'Inspection', 'Judges', 'Technical', 'Chassis', 'Safety'],
    3,
    '3.2 MB',
    '3840x2160',
    115,
    19
  ),
  (
    'Valedictory Trophy & Overall Winner Award Ceremony',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80',
    'Award Ceremony',
    '5 Sep 2026',
    'Main Podium Stage, BIC',
    ARRAY['Award Ceremony', 'Trophy', 'Podium', 'Winners', 'Celebration', 'OC', 'Jury'],
    8,
    '5.4 MB',
    '4200x2800',
    240,
    86
  ),
  (
    'ICV-09 Combustion Prototype Hot Lap on Main Straight',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    'Track & Dynamic',
    '4 Sep 2026',
    'Main Straight, Buddh Circuit',
    ARRAY['Formula Car', 'Combustion', 'ICV-09', 'Speed', 'Main Straight', 'Track'],
    1,
    '3.6 MB',
    '3840x2160',
    89,
    15
  ),
  (
    'SAEINDIA Organising Committee & Chief Judges Briefing',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80',
    'VIP & Guests',
    '31 Aug 2026',
    'Conference Hall, BIC Paddock Club',
    ARRAY['OC', 'Jury', 'Judges', 'Briefing', 'Leadership', 'SAEINDIA'],
    6,
    '3.9 MB',
    '3840x2160',
    130,
    31
  ),
  (
    'Driver Safety Cockpit & Egress Test Drill',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80',
    'Scrutineering',
    '1 Sep 2026',
    'Scrutineering Bay 2',
    ARRAY['Driver', 'Safety', 'Egress Test', 'Helmet', 'Racing Suit', 'Cockpit'],
    2,
    '2.9 MB',
    '3840x2160',
    76,
    12
  ),
  (
    'Endurance Race Grid Line-Up & Green Flag Start',
    'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1600&q=80',
    'Track & Dynamic',
    '5 Sep 2026',
    'Starting Grid, Buddh Circuit',
    ARRAY['Endurance', 'Grid', 'Start', 'Race', 'Formula Cars', 'Track'],
    5,
    '4.8 MB',
    '4000x2500',
    312,
    104
  ),
  (
    'Electric Powertrain Battery Pack & Inverter Tech Review',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=80',
    'Formula Cars',
    '2 Sep 2026',
    'EV Paddock Bay 8',
    ARRAY['Battery', 'EV', 'Powertrain', 'Tech', 'Inverter', 'Formula Car'],
    2,
    '3.1 MB',
    '3840x2160',
    64,
    11
  ),
  (
    'Team Mascot & Pit Banner Celebration',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80',
    'Team & Crew',
    '5 Sep 2026',
    'Team Pit Garage 5, BIC',
    ARRAY['Team', 'Celebration', 'Banner', 'Pit Setup', 'Students', 'Crew'],
    7,
    '4.5 MB',
    '3840x2160',
    188,
    45
  )
ON CONFLICT DO NOTHING;
