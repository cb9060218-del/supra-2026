-- Migration: 20260904000000_kits.sql
-- Description: Creates kits_distribution table for Organising Committee (OC), Jury, and Sponsor kit/shirt tracking

CREATE TABLE IF NOT EXISTS public.kits_distribution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('OC', 'Jury', 'Sponsor', 'Volunteer', 'Custom')) DEFAULT 'OC',
  organization text,
  role_designation text,
  shirt_size text NOT NULL CHECK (shirt_size IN ('XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Custom', '-')) DEFAULT 'L',
  kit_issued boolean NOT NULL DEFAULT false,
  sponsor_tshirt_given boolean NOT NULL DEFAULT false,
  remarks text,
  issued_at timestamp with time zone,
  issued_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.kits_distribution ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view kits" ON public.kits_distribution;
DROP POLICY IF EXISTS "Staff can manage kits" ON public.kits_distribution;

CREATE POLICY "Authenticated users can view kits"
  ON public.kits_distribution FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage kits"
  ON public.kits_distribution FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'));

-- Seed Initial Kits Data
INSERT INTO public.kits_distribution (person_name, category, organization, role_designation, shirt_size, kit_issued, sponsor_tshirt_given, remarks) VALUES
  -- Organising Committee (OC)
  ('Dr. K. C. Vora', 'OC', 'SAEINDIA', 'OC Chairman', 'XL', false, false, 'Main Stage Kit'),
  ('Mr. I. V. Rao', 'OC', 'TERI / Maruti Suzuki', 'Distinguished Fellow & Advisor', 'L', false, false, 'VIP Kit'),
  ('Mr. Sanjay Deshpande', 'OC', 'SAEINDIA', 'Convener SUPRA 2026', 'L', false, false, 'VIP Kit'),
  ('Mr. Rakesh Sood', 'OC', 'SAEINDIA', 'Co-Convener', 'XL', false, false, 'VIP Kit'),
  ('Mr. Saurabh Srivastava', 'OC', 'Senvion', 'Technical Committee Head', 'M', false, false, 'Tech Hangar'),
  ('Mr. Mayank Nigam', 'OC', 'ACMA', 'Logistics & Event Ops', 'L', false, false, 'Ops Room'),
  ('Mr. Hemant Kumar', 'OC', 'ACMA', 'Event Coordinator', 'M', false, false, 'Ops Room'),
  ('Mr. Ashish Jindal', 'OC', 'Munjal Kiriu', 'Industry Liaison', 'L', false, false, 'Paddock Ops'),

  -- Jury / Judges
  ('Dr. Arun Jaura', 'Jury', 'Hero MotoCorp', 'Chief Judge - Design Evaluation', 'XL', false, false, 'Design Bay'),
  ('Mr. B. Srinivas', 'Jury', 'Maruti Suzuki', 'Chief Judge - Cost & Manufacturing', 'L', false, false, 'Cost Hangar'),
  ('Mr. Anand Kulkarni', 'Jury', 'Tata Motors', 'Chief Judge - Business Presentation', 'L', false, false, 'Presentation Room'),
  ('Mr. Rohit Sangwan', 'Jury', 'Synopsys / Ansys', 'Technical Scrutineer', 'M', false, true, 'Scrutineering Bay'),
  ('Mr. Irshad Ahmad', 'Jury', 'Validate India', 'Technical Scrutineer', 'L', false, true, 'Scrutineering Bay'),
  ('Mr. Thomas Mathew', 'Jury', 'Migatronic', 'Hot Pit Safety Judge', 'XL', false, true, 'Hot Pit Area'),
  ('Mr. Azmat Hussain', 'Jury', 'Morphine Motorsports', 'Dynamic Events Judge', 'M', false, true, 'Track Control'),
  ('Mr. Yash Agrawal', 'Jury', 'Morphine Motorsports', 'Track Safety Official', 'L', false, true, 'Track Control'),

  -- Sponsors Kits
  ('Mukul Yudhveer Singh', 'Sponsor', 'AutoCar', 'Media Partner Lead', 'L', false, true, 'Media Center'),
  ('Arushi Rawat', 'Sponsor', 'ETAuto', 'Principal Correspondent', 'M', false, true, 'Media Center'),
  ('Arup Tyagi', 'Sponsor', 'Ansys', 'Sr. Manager Academic Programs', 'L', false, true, 'Sponsor Hangar'),
  ('Amit Kumar Mehta', 'Sponsor', 'Validate', 'Director Technical', 'XL', false, true, 'Sponsor Hangar'),
  ('Shardool Singh', 'Sponsor', 'ACMA', 'Regional Secretary', 'L', false, true, 'VIP Lounge'),
  ('Pardeep Goyal', 'Sponsor', 'BPCL', 'Business Head (Retail)', 'XL', false, true, 'VIP Lounge'),
  ('Achman Trehan', 'Sponsor', 'BPCL', 'Head Retail North', 'L', false, true, 'VIP Lounge'),
  ('Harsh Vardhan Jain', 'Sponsor', 'Migatronic', 'Head - Automation & Application', 'L', false, true, 'Hot Pit Sponsor')
ON CONFLICT DO NOTHING;
