-- Migration: 20260901000000_fix_rls.sql
-- Description: Enables RLS on all public tables and adds appropriate access policies to resolve Supabase linter errors

-- ========================================================
-- 1. FIX RLS ON USERS TABLE
-- ========================================================

-- Ensure helper functions are security definer with explicit search_path
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text AS $$
  SELECT role FROM public.users WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_user_verified(user_uuid uuid)
RETURNS boolean AS $$
  SELECT COALESCE((SELECT is_verified FROM public.users WHERE id = user_uuid), false);
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing user policies to prevent duplicate errors
DROP POLICY IF EXISTS "Users can view their own profile or administrators view all" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Super admins can update profiles" ON public.users;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.users;

-- Recreate clean user policies
CREATE POLICY "Authenticated users can view users"
  ON public.users FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile or super admin manage all"
  ON public.users FOR UPDATE
  USING (auth.uid() = id OR public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can delete profiles"
  ON public.users FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'super_admin');


-- ========================================================
-- 2. FIX RLS ON TEAMS TABLE
-- ========================================================

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


-- ========================================================
-- 3. FIX RLS ON STICKER COMPANIES TABLE
-- ========================================================

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


-- ========================================================
-- 4. FIX RLS ON STICKER PLACEMENTS TABLE
-- ========================================================

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


-- ========================================================
-- 5. FIX RLS ON TEAM STICKER STATUS TABLE
-- ========================================================

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


-- ========================================================
-- 6. FIX RLS ON FULFILLMENT ITEMS TABLE
-- ========================================================

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
