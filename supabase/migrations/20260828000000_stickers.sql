-- Migration: 20260828000000_stickers.sql
-- Description: Creates tables and seeds for Vehicle Sticker Tracker and Benefit Fulfillment Overview

-- 1. Create Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  num text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view teams" ON public.teams;
DROP POLICY IF EXISTS "Staff can manage teams" ON public.teams;

CREATE POLICY "Authenticated users can view teams"
  ON public.teams FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage teams"
  ON public.teams FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'));

-- Seed Teams (61 competing teams)
INSERT INTO public.teams (num, name) VALUES
  ('EV-01', 'Amrita Racing'),
  ('EV-02', 'Team Nequit Electric'),
  ('EV-04', 'Acceleracers Electric'),
  ('EV-05', 'Pegasus Racing Electric'),
  ('EV-06', 'Veerracerss Electric'),
  ('EV-07', 'Veloce Racing Electric'),
  ('EV-10', 'NIT-B Racing'),
  ('EV-14', '4ZE Racing'),
  ('EV-15', 'Phoenix Racing Electric'),
  ('EV-16', 'Invincibles'),
  ('EV-18', 'CRCE Formula Racing Electric'),
  ('EV-19', 'Team Fateh'),
  ('EV-20', 'Team Defianz Racing Electric'),
  ('ICV-01', 'Team Abhedya Racers'),
  ('ICV-02', 'Praheti Racing'),
  ('ICV-03', 'Madbolt Formula Racing'),
  ('ICV-04', 'Sahayadri Formula Racers'),
  ('ICV-05', 'Team Srijan'),
  ('ICV-06', 'Team Godavari'),
  ('ICV-07', 'Team Mechnext Racing'),
  ('ICV-08', 'DSCE Motorsports'),
  ('ICV-09', 'Ares Motorsports'),
  ('ICV-10', 'Team Adrenaline Racing'),
  ('ICV-11', 'Team Malaviyans'),
  ('ICV-12', 'The Elite Racers'),
  ('ICV-13', 'Yodha Racing'),
  ('ICV-15', 'Team Brahmastra Formula'),
  ('ICV-17', 'Bullz Racing'),
  ('ICV-19', 'Wrench Wielders Racing'),
  ('ICV-20', 'Javitron Racing'),
  ('ICV-22', 'Godspeed Racing'),
  ('ICV-23', 'Team VITian Formula Racing'),
  ('ICV-24', 'Team Vegadooth Racing'),
  ('ICV-25', 'Overdrive Racing'),
  ('ICV-26', 'Team Eminent Racing'),
  ('ICV-29', 'Team Ashwamedh'),
  ('ICV-30', 'GTU Motorsports'),
  ('ICV-31', 'Yeti Racing'),
  ('ICV-32', 'Hadron Motorsports'),
  ('ICV-33', 'Team Acceleracers ICV'),
  ('ICV-34', 'Team Infinity Racers'),
  ('ICV-36', 'Team Saranyu Racing'),
  ('ICV-37', 'PetronARC'),
  ('ICV-38', 'IIITDMJ Racing'),
  ('ICV-39', 'Force Racing'),
  ('ICV-40', 'Camber Racing'),
  ('ICV-42', 'Team Arion'),
  ('ICV-43', 'Team Lightning'),
  ('ICV-44', 'Team Thrusters'),
  ('ICV-45', 'Team Screwdrivers'),
  ('ICV-46', 'Tarkshya Racing'),
  ('ICV-47', 'Devbhoomi Dynamo'),
  ('ICV-49', 'XLR8 Formula Student Team'),
  ('ICV-50', 'Hermes Racing'),
  ('ICV-51', 'Speedtail Racing'),
  ('ICV-53', 'Formula Team Pegasus'),
  ('ICV-55', 'AIOUS Formula Student'),
  ('ICV-56', 'Pravega Racing'),
  ('ICV-57', 'Vishwaracers'),
  ('ICV-58', 'Team Sakthi Racing'),
  ('ICV-59', 'Velocita Racing')
ON CONFLICT (num) DO NOTHING;


-- 2. Create Fulfillment Items Table (Cubicles)
CREATE TABLE IF NOT EXISTS public.fulfillment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('stall', 'stickers', 'kits')),
  company_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.fulfillment_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view fulfillment items" ON public.fulfillment_items;
DROP POLICY IF EXISTS "Staff can manage fulfillment items" ON public.fulfillment_items;

CREATE POLICY "Authenticated users can view fulfillment items"
  ON public.fulfillment_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage fulfillment items"
  ON public.fulfillment_items FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'));


-- 3. Create Sticker Companies Table
CREATE TABLE IF NOT EXISTS public.sticker_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL UNIQUE,
  sticker_size text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.sticker_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view sticker companies" ON public.sticker_companies;
DROP POLICY IF EXISTS "Staff can manage sticker companies" ON public.sticker_companies;

CREATE POLICY "Authenticated users can view sticker companies"
  ON public.sticker_companies FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage sticker companies"
  ON public.sticker_companies FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'));

-- Seed Sticker Companies
INSERT INTO public.sticker_companies (company_name, sticker_size) VALUES
  ('MSIL', 'Large (15x15cm)'),
  ('BPCL', 'Medium (12x10cm)'),
  ('Dassault Systems', '7x7cm'),
  ('Munjal Kiriu', '7x7cm'),
  ('ICAT', '7x7cm'),
  ('JK Tyre', '7x7cm')
ON CONFLICT (company_name) DO NOTHING;


-- 4. Create Sticker Placements Table
CREATE TABLE IF NOT EXISTS public.sticker_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.sticker_companies(id) ON DELETE CASCADE,
  team_number text NOT NULL REFERENCES public.teams(num) ON DELETE CASCADE,
  is_placed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(company_id, team_number)
);

ALTER TABLE public.sticker_placements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view sticker placements" ON public.sticker_placements;
DROP POLICY IF EXISTS "Staff can manage sticker placements" ON public.sticker_placements;

CREATE POLICY "Authenticated users can view sticker placements"
  ON public.sticker_placements FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage sticker placements"
  ON public.sticker_placements FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'));


-- 5. Create Team Sticker Overall Status Table
CREATE TABLE IF NOT EXISTS public.team_sticker_status (
  team_number text PRIMARY KEY REFERENCES public.teams(num) ON DELETE CASCADE,
  is_placed boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.team_sticker_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view team sticker status" ON public.team_sticker_status;
DROP POLICY IF EXISTS "Staff can manage team sticker status" ON public.team_sticker_status;

CREATE POLICY "Authenticated users can view team sticker status"
  ON public.team_sticker_status FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage team sticker status"
  ON public.team_sticker_status FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'));
