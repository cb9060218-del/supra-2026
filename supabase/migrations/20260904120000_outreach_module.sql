-- Migration: 20260904120000_outreach_module.sql
-- Description: Creates schema, tables, RLS policies, and seed data for the Sponsor Outreach & Bulk Messaging Module

-- ========================================================
-- 1. OUTREACH SPONSOR LEADS DIRECTORY
-- ========================================================
CREATE TABLE IF NOT EXISTS public.outreach_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_person text NOT NULL,
  phone text,
  email text,
  category text NOT NULL CHECK (category IN ('Automotive', 'Manufacturing', 'Electronics', 'Software/IT', 'Logistics', 'Financial', 'Local Business', 'Other')) DEFAULT 'Automotive',
  status text NOT NULL CHECK (status IN ('not_contacted', 'contacted', 'replied', 'meeting_scheduled', 'sponsored', 'rejected')) DEFAULT 'not_contacted',
  target_amount numeric DEFAULT 0,
  secured_amount numeric DEFAULT 0,
  notes text,
  city text,
  state text,
  last_contacted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.outreach_sponsors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view outreach sponsors" ON public.outreach_sponsors;
DROP POLICY IF EXISTS "Staff can manage outreach sponsors" ON public.outreach_sponsors;

CREATE POLICY "Authenticated users can view outreach sponsors"
  ON public.outreach_sponsors FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage outreach sponsors"
  ON public.outreach_sponsors FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'));


-- ========================================================
-- 2. REUSABLE MESSAGE TEMPLATES
-- ========================================================
CREATE TABLE IF NOT EXISTS public.outreach_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp', 'email', 'multi')) DEFAULT 'whatsapp',
  category text NOT NULL CHECK (category IN ('Initial Pitch', 'Brochure Follow-up', 'Meeting Request', 'Sponsorship Deck', 'Payment Follow-up', 'Custom')) DEFAULT 'Initial Pitch',
  subject text,
  body text NOT NULL,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.outreach_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view outreach templates" ON public.outreach_templates;
DROP POLICY IF EXISTS "Staff can manage outreach templates" ON public.outreach_templates;

CREATE POLICY "Authenticated users can view outreach templates"
  ON public.outreach_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage outreach templates"
  ON public.outreach_templates FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'));


-- ========================================================
-- 3. OUTREACH CAMPAIGNS
-- ========================================================
CREATE TABLE IF NOT EXISTS public.outreach_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  target_category text,
  target_sponsorship_goal numeric DEFAULT 0,
  status text NOT NULL CHECK (status IN ('active', 'draft', 'completed', 'paused')) DEFAULT 'active',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view outreach campaigns" ON public.outreach_campaigns;
DROP POLICY IF EXISTS "Staff can manage outreach campaigns" ON public.outreach_campaigns;

CREATE POLICY "Authenticated users can view outreach campaigns"
  ON public.outreach_campaigns FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage outreach campaigns"
  ON public.outreach_campaigns FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'));


-- ========================================================
-- 4. OUTREACH LOGS & DELIVERY HISTORY
-- ========================================================
CREATE TABLE IF NOT EXISTS public.outreach_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid NOT NULL REFERENCES public.outreach_sponsors(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.outreach_campaigns(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.outreach_templates(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp', 'email', 'call', 'meeting')) DEFAULT 'whatsapp',
  message_content text NOT NULL,
  delivery_status text NOT NULL CHECK (delivery_status IN ('queued', 'sent', 'delivered', 'replied', 'failed')) DEFAULT 'sent',
  sent_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.outreach_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view outreach logs" ON public.outreach_logs;
DROP POLICY IF EXISTS "Staff can manage outreach logs" ON public.outreach_logs;

CREATE POLICY "Authenticated users can view outreach logs"
  ON public.outreach_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage outreach logs"
  ON public.outreach_logs FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'));


-- ========================================================
-- 5. ATTACHMENTS & PITCH DECKS
-- ========================================================
CREATE TABLE IF NOT EXISTS public.outreach_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  doc_type text NOT NULL CHECK (doc_type IN ('Brochure', 'Team Profile', 'Proposal Deck', 'Rate Card', 'Image', 'Other')) DEFAULT 'Brochure',
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size text,
  version text NOT NULL DEFAULT 'v1.0',
  description text,
  uploaded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.outreach_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view outreach attachments" ON public.outreach_attachments;
DROP POLICY IF EXISTS "Staff can manage outreach attachments" ON public.outreach_attachments;

CREATE POLICY "Authenticated users can view outreach attachments"
  ON public.outreach_attachments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage outreach attachments"
  ON public.outreach_attachments FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'));


-- ========================================================
-- 6. FOLLOW-UP SCHEDULES & REMINDERS
-- ========================================================
CREATE TABLE IF NOT EXISTS public.outreach_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid NOT NULL REFERENCES public.outreach_sponsors(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  scheduled_time time,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  notes text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.outreach_followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view outreach followups" ON public.outreach_followups;
DROP POLICY IF EXISTS "Staff can manage outreach followups" ON public.outreach_followups;

CREATE POLICY "Authenticated users can view outreach followups"
  ON public.outreach_followups FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage outreach followups"
  ON public.outreach_followups FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'coordinator'));


-- ========================================================
-- 7. SEED DATA FOR OUTREACH MODULE
-- ========================================================

-- Seed Templates
INSERT INTO public.outreach_templates (title, channel, category, subject, body) VALUES
  (
    'Initial Sponsorship Pitch (WhatsApp)',
    'whatsapp',
    'Initial Pitch',
    'Invitation to Partner with SUPRA SAEINDIA 2026',
    'Dear {{name}}, greetings from SUPRA SAEINDIA 2026! 🏎️✨

We are excited to invite {{company}} to partner with India’s premier Formula Student engineering competition held at Buddh International Circuit (BIC), Greater Noida (2–5 Sep 2026).

Over 60+ top engineering university teams and 2,500+ aspiring automotive engineers will compete with Formula-style combustion and electric race cars.

We would love to explore synergy with {{company}} for brand placement, recruitment drives, and tech showcase.

May we share our Official Sponsorship Brochure with you?

Warm regards,
Sponsorship Team
{{event_name}}'
  ),
  (
    'Formal Proposal & Brochure Email',
    'email',
    'Sponsorship Deck',
    'Partnership Opportunity: SUPRA SAEINDIA 2026 at Buddh International Circuit',
    'Dear {{name}},

I hope this email finds you well.

On behalf of the Organizing Committee of {{event_name}}, I am reaching out to explore a potential collaboration with {{company}}.

SUPRA SAEINDIA is the country’s biggest student formula design event, bringing together automotive industry leaders, judges, and exceptional engineering talent.

Our partnership tiers include:
- Principal & Platinum Partner (Main stage branding & stall setup)
- Gold & Silver Sponsor (Track branding & recruitment access)
- Category & Hot Pit Partner (EV Zone, Kit & Tech Awards)

Attached is our comprehensive Sponsorship Brochure and Tier Deliverables.

We would welcome a brief 10-minute discovery call this week at your convenience.

Best regards,
Sponsorship & Corporate Relations Team
SUPRA SAEINDIA 2026'
  ),
  (
    'Quick Follow-Up (No Reply)',
    'whatsapp',
    'Brochure Follow-up',
    'Follow-up regarding SUPRA SAEINDIA 2026 Partnership',
    'Hi {{name}}, gentle follow-up regarding our earlier message about {{company}} partnering with SUPRA SAEINDIA 2026 at Buddh International Circuit.

Stall allocations and track branding slots for the upcoming edition are filling fast. Please let us know if we can schedule a quick 5-minute call or share more details.

Thank you!
Sponsorship Team'
  ),
  (
    'Meeting Confirmation & Agenda',
    'email',
    'Meeting Request',
    'Confirmed: Discovery Call — SUPRA SAEINDIA 2026 & {{company}}',
    'Dear {{name}},

Thank you for your positive response. We look forward to our discussion regarding {{company}}’s partnership with {{event_name}}.

Agenda for our call:
1. Overview of SUPRA 2026 student vehicle competition & BIC venue
2. Brand visibility, recruitment drive, and exhibition stall deliverables
3. Custom package alignment for {{company}}

Feel free to invite your marketing/HR team members.

Warm regards,
Organizing Committee, SUPRA SAEINDIA'
  )
ON CONFLICT DO NOTHING;

-- Seed Campaigns
INSERT INTO public.outreach_campaigns (title, description, target_category, target_sponsorship_goal, status) VALUES
  ('SUPRA 2026 Main Sponsorship Drive', 'National corporate outreach campaign targeting Tier-1 automotive OEMs and component makers.', 'Automotive', 10000000, 'active'),
  ('EV Zone & Clean Mobility Outreach', 'Specialized outreach to electric vehicle startups, battery makers, and powertrain innovators.', 'Electronics', 5000000, 'active'),
  ('NCR & Regional Industry Partner Drive', 'Regional manufacturing, fabrication, tooling, and industrial supplies companies.', 'Manufacturing', 3000000, 'active')
ON CONFLICT DO NOTHING;

-- Seed Attachments
INSERT INTO public.outreach_attachments (title, doc_type, file_name, file_url, file_size, version, description) VALUES
  ('SUPRA 2026 Official Sponsorship Brochure', 'Brochure', 'SUPRA_2026_Sponsorship_Brochure_v2.pdf', '/tracker.html', '4.2 MB', 'v2.1', 'Comprehensive booklet with event statistics, past sponsors, audience demographics, and tier deliverables.'),
  ('Sponsorship Tiers & Deliverables Matrix', 'Rate Card', 'SUPRA_2026_Tiers_Rate_Card.pdf', '/tracker.html', '1.8 MB', 'v1.5', 'Detailed breakdown of Principal, Platinum, Gold, Silver, Bronze, and Custom package pricing and entitlements.'),
  ('SUPRA SAEINDIA Event Profile & History', 'Team Profile', 'SUPRA_SAEINDIA_Profile.pdf', '/tracker.html', '3.1 MB', 'v1.0', 'Background document detailing the 14-year legacy of SUPRA SAEINDIA at BIC.')
ON CONFLICT DO NOTHING;

-- Seed Sample Outreach Leads
INSERT INTO public.outreach_sponsors (company_name, contact_person, phone, email, category, status, target_amount, secured_amount, notes, city, state) VALUES
  ('Tata Motors Commercial Vehicles', 'Mr. Rajesh Kaul', '98101 23456', 'rajesh.kaul@tatamotors.com', 'Automotive', 'meeting_scheduled', 1500000, 0, 'Discussed Platinum tier stall space; demo truck showcase requested.', 'Pune', 'Maharashtra'),
  ('Mahindra & Mahindra EV Tech', 'Ms. Ananya Sharma', '98202 34567', 'sharma.ananya@mahindra.com', 'Automotive', 'contacted', 1000000, 0, 'Sent brochure on WhatsApp; follow up on Thursday.', 'Chennai', 'Tamil Nadu'),
  ('Bosch India Powertrain', 'Mr. Vikram Sen', '98303 45678', 'vikram.sen@in.bosch.com', 'Manufacturing', 'replied', 800000, 0, 'Interested in Tech Inspection bay branding & recruitment meet.', 'Bengaluru', 'Karnataka'),
  ('Schneider Electric Mobility', 'Mr. Deepak Verma', '98404 56789', 'deepak.verma@se.com', 'Electronics', 'not_contacted', 600000, 0, 'Identified via LinkedIn; EV charging infrastructure lead.', 'Gurugram', 'Haryana'),
  ('L&T Technology Services', 'Mr. S. Ramanathan', '98505 67890', 's.ramanathan@ltts.com', 'Software/IT', 'contacted', 500000, 0, 'Shared sponsorship matrix; awaiting budget sign-off.', 'Mumbai', 'Maharashtra'),
  ('Uno Minda Group', 'Mr. Naveen Jain', '98606 78901', 'naveen.jain@unominda.com', 'Manufacturing', 'meeting_scheduled', 700000, 0, 'Meeting scheduled with Corporate Affairs VP on Friday 3 PM.', 'Manesar', 'Haryana'),
  ('TVS Motor Company', 'Mr. Karthik Natarajan', '98707 89012', 'karthik.n@tvsmotor.com', 'Automotive', 'sponsored', 1200000, 1200000, 'Confirmed Gold tier sponsor! MoU signed, invoice dispatched.', 'Hosur', 'Tamil Nadu'),
  ('Hero Electric Vehicles', 'Mr. Gaurav Gupta', '98808 90123', 'gaurav.gupta@heroelectric.in', 'Automotive', 'replied', 500000, 0, 'Requested student resume database access.', 'New Delhi', 'Delhi')
ON CONFLICT DO NOTHING;
