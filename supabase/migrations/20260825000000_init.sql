-- Supabase Migration File: 20260825000000_init.sql
-- Description: Core Schema, Triggers, RLS, Audit Tracking, and Seed Data for SUPRA SAEINDIA 2026

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 0. Clean Existing Tables (Ensure Clean Rebuild)
-- ==========================================
drop table if exists public.audit_logs cascade;
drop table if exists public.change_history cascade;
drop table if exists public.notifications cascade;
drop table if exists public.event_tasks cascade;
drop table if exists public.gatepasses cascade;
drop table if exists public.guests cascade;
drop table if exists public.sponsor_interactions cascade;
drop table if exists public.sponsor_benefits cascade;
drop table if exists public.sponsors cascade;
drop table if exists public.users cascade;

-- ==========================================
-- 1. Create Core Tables
-- ==========================================

-- Table: public.users (Profile linked to auth.users)
create table public.users (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role text not null check (role in ('super_admin', 'admin', 'coordinator', 'viewer')) default 'viewer',
  organization text,
  is_verified boolean not null default false,
  is_active boolean not null default true,
  is_founder boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  deleted_at timestamp with time zone,
  deleted_by uuid references public.users
);

-- Table: public.sponsors
create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  sponsor_name text not null,
  sponsor_tier text not null check (lower(sponsor_tier) in ('principal', 'platinum', 'gold', 'lunch', 'silver', 'bronze', 'custom', 'other')),
  sponsor_tier_label text,
  sponsorship_amount numeric not null default 0,
  payment_status text not null check (payment_status in ('pending', 'partial', 'paid', 'Payment Received', 'Pending', 'Partial', 'Paid', '-')) default 'pending',
  lead_status text not null check (lead_status in ('prospect', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'confirmed', 'rejected')) default 'prospect',
  contact_person text,
  email text,
  phone text,
  notes text,
  version integer not null default 1,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_by uuid references public.users,
  deleted_at timestamp with time zone,
  deleted_by uuid references public.users
);

-- Table: public.sponsor_benefits
create table public.sponsor_benefits (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors on delete cascade,
  benefit_name text not null,
  benefit_description text,
  status text not null check (status in ('pending', 'in_progress', 'completed')) default 'pending',
  completed_at timestamp with time zone,
  proof_url text,
  remarks text,
  version integer not null default 1,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_by uuid references public.users,
  deleted_at timestamp with time zone,
  deleted_by uuid references public.users
);

-- Table: public.sponsor_interactions (CRM log)
create table public.sponsor_interactions (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors on delete cascade,
  type text not null check (type in ('call', 'meeting', 'email', 'whatsapp', 'follow_up', 'proposal_sent', 'payment_reminder')),
  summary text not null,
  details text,
  logged_by uuid references public.users on delete set null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Table: public.guests
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid references public.sponsors on delete set null,
  guest_name text not null,
  designation text,
  company text,
  email text,
  phone text,
  attendance_status text not null check (attendance_status in ('invited', 'confirmed', 'declined', 'attended', 'Pending', 'Confirmed', 'Not')) default 'Pending',
  gatepass_status text not null check (gatepass_status in ('not_issued', 'issued', 'scanned')) default 'not_issued',
  guest_role text not null check (lower(guest_role) in ('vip', 'sponsor', 'judge', 'faculty', 'media', 'volunteer', 'team_member')) default 'sponsor',
  arrival_date date,
  departure_date date,
  accommodation_required boolean not null default false,
  remarks text,
  version integer not null default 1,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_by uuid references public.users,
  deleted_at timestamp with time zone,
  deleted_by uuid references public.users
);

-- Table: public.gatepasses
create table public.gatepasses (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null unique references public.guests on delete cascade,
  qr_code text not null unique,
  issued_by uuid references public.users on delete set null,
  issued_at timestamp with time zone not null default timezone('utc'::text, now()),
  status text not null check (status in ('active', 'scanned', 'expired')) default 'active',
  scanned_at timestamp with time zone,
  scanned_by uuid references public.users on delete set null,
  version integer not null default 1,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_by uuid references public.users,
  deleted_at timestamp with time zone,
  deleted_by uuid references public.users
);

-- Table: public.event_tasks
create table public.event_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_to uuid references public.users on delete set null,
  priority text not null check (priority in ('low', 'medium', 'high', 'critical')) default 'medium',
  deadline timestamp with time zone,
  status text not null check (status in ('todo', 'in_progress', 'completed')) default 'todo',
  version integer not null default 1,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_by uuid references public.users,
  deleted_at timestamp with time zone,
  deleted_by uuid references public.users
);

-- Table: public.notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users on delete cascade,
  title text not null,
  message text not null,
  read_status boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Table: public.change_history (Visual Diff Timeline)
create table public.change_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null check (action in ('create', 'update', 'delete', 'restore', 'purge')),
  old_values jsonb,
  new_values jsonb,
  changed_by uuid references public.users on delete set null,
  ip_address text,
  device text,
  change_reason text,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Table: public.audit_logs (Immutable system logs)
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  user_id uuid references public.users on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  ip_address text,
  timestamp timestamp with time zone not null default timezone('utc'::text, now()),
  details jsonb
);

-- ==========================================
-- 2. Indexes for Performance
-- ==========================================
create index idx_users_email on public.users(email);
create index idx_sponsors_tier on public.sponsors(sponsor_tier);
create index idx_sponsors_lead on public.sponsors(lead_status);
create index idx_sponsor_benefits_sponsor on public.sponsor_benefits(sponsor_id);
create index idx_guests_sponsor on public.guests(sponsor_id);
create index idx_guests_role on public.guests(guest_role);
create index idx_guests_rsvp on public.guests(attendance_status);
create index idx_gatepasses_guest on public.gatepasses(guest_id);
create index idx_gatepasses_code on public.gatepasses(qr_code);
create index idx_change_history_entity on public.change_history(entity_type, entity_id);
create index idx_notifications_user on public.notifications(user_id, read_status);

-- ==========================================
-- 3. Trigger Functions & Triggers
-- ==========================================

create or replace function public.set_change_reason(reason text)
returns void as $$
begin
  perform set_config('app.change_reason', reason, true);
end;
$$ language plpgsql security definer;

create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
begin
  select not exists (select 1 from public.users) into is_first_user;
  
  if is_first_user then
    insert into public.users (id, full_name, email, role, is_verified, is_active, is_founder)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', 'System Founder'),
      new.email,
      'super_admin',
      true,
      true,
      true
    );
  else
    insert into public.users (id, full_name, email, role, is_verified, is_active, is_founder)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
      new.email,
      'viewer',
      false,
      true,
      false
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.check_founder_protection_trigger()
returns trigger as $$
begin
  if (TG_OP = 'DELETE') then
    if (old.is_founder = true) then
      raise exception 'Founder account cannot be deleted or purged.';
    end if;
    return old;
  elsif (TG_OP = 'UPDATE') then
    if (old.is_founder = true) then
      if (new.role != 'super_admin' or new.is_verified = false or new.is_active = false or new.is_founder = false or new.deleted_at is not null) then
        raise exception 'Founder role, verification status, active state, and founder status are protected.';
      end if;
    end if;
    return new;
  end if;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_founder_users on public.users;
create trigger protect_founder_users
  before update or delete on public.users
  for each row execute procedure public.check_founder_protection_trigger();

create or replace function public.auto_create_sponsor_benefits_trigger()
returns trigger as $$
begin
  if (lower(new.sponsor_tier) = 'principal') then
    insert into public.sponsor_benefits (sponsor_id, benefit_name, benefit_description) values
      (new.id, 'Stall setup 18x3 mtr', 'Allocated stall size in expo hangar'),
      (new.id, 'Event branding in company name', 'Branding on main arches and credentials'),
      (new.id, 'Student engagement (webinars/training)', 'Post-event academic webinars or trainings'),
      (new.id, 'Official seat at valedictory', 'Valedictory stage seat invitation'),
      (new.id, 'Non-track branding — 25 spots', '25 banners placed across BIC venue'),
      (new.id, 'Branding on student vehicles (large)', 'Large size sticker logo on all student formulas'),
      (new.id, 'Database of participating teams', 'Access to team registration records'),
      (new.id, 'Lunch/refreshments for officials', 'Catering pass for delegation'),
      (new.id, 'Logo on website/event site/valedictory', 'Official portal logo placement'),
      (new.id, 'Promotional activities onsite', 'Onsite expo branding rights'),
      (new.id, 'Materials in student kits', 'Sponsor pamphlets inside student registration kits'),
      (new.id, 'Award cheque & trophy branding', 'Sponsor logo printed on select trophies'),
      (new.id, 'Customized branding options', 'Bespoke customization options'),
      (new.id, 'Participation in HR meet', 'Direct access to Formula recruitment drive');
  elsif (lower(new.sponsor_tier) = 'platinum') then
    insert into public.sponsor_benefits (sponsor_id, benefit_name, benefit_description) values
      (new.id, 'Stall setup 9x3 mtr', 'Allocated stall space'),
      (new.id, 'Student engagement (webinars/training)', 'Academic webinars'),
      (new.id, 'Official seat at valedictory', 'Valedictory stage seat'),
      (new.id, 'Non-track branding — 15 spots', '15 banners across BIC'),
      (new.id, 'Branding on student vehicles (medium)', 'Medium size sticker logo on student formulas'),
      (new.id, 'Database of participating teams', 'Access to team database'),
      (new.id, 'Lunch/refreshments for officials', 'Catering pass'),
      (new.id, 'Logo on website/event site/valedictory', 'Logo placements'),
      (new.id, 'Promotional activities onsite', 'Onsite expo promo rights'),
      (new.id, 'Materials in student kits', 'Kit brochure insertion'),
      (new.id, 'Award cheque & trophy branding', 'Logo on trophies'),
      (new.id, 'Customized branding options', 'Custom options'),
      (new.id, 'Participation in HR meet', 'Access to recruitment drive');
  elsif (lower(new.sponsor_tier) = 'gold') then
    insert into public.sponsor_benefits (sponsor_id, benefit_name, benefit_description) values
      (new.id, 'Stall setup 6x3 mtr', 'Allocated stall space'),
      (new.id, 'Student engagement (webinars/training)', 'Student engagement'),
      (new.id, 'Non-track branding — 15 spots', '15 banners'),
      (new.id, 'Branding on student vehicles (medium)', 'Medium size logo on student formulas'),
      (new.id, 'Database of participating teams', 'Access to team database'),
      (new.id, 'Lunch/refreshments for officials', 'Catering pass'),
      (new.id, 'Logo on website/event site/valedictory', 'Logo placements'),
      (new.id, 'Promotional activities onsite', 'Onsite expo promo rights'),
      (new.id, 'Materials in student kits', 'Kit insertion'),
      (new.id, 'Award cheque & trophy branding', 'Logo on trophies'),
      (new.id, 'Customized branding options', 'Custom options'),
      (new.id, 'Participation in HR meet', 'Access to recruitment drive');
  elsif (lower(new.sponsor_tier) = 'lunch') then
    insert into public.sponsor_benefits (sponsor_id, benefit_name, benefit_description) values
      (new.id, 'Stall setup 4x3 mtr', 'Allocated stall space'),
      (new.id, 'Student engagement (webinars/training)', 'Student webinars'),
      (new.id, 'Non-track branding — 10 spots', '10 banners'),
      (new.id, 'Branding on student vehicles (7x7cm)', '7x7cm logo on student formulas'),
      (new.id, 'Database of participating teams', 'Access to team database'),
      (new.id, 'Lunch/refreshments for officials', 'Catering pass'),
      (new.id, 'Logo on website/event site/valedictory', 'Logo placements'),
      (new.id, 'Promotional activities onsite', 'Onsite promo rights'),
      (new.id, 'Materials in student kits', 'Kit insertion'),
      (new.id, 'Award cheque & trophy branding', 'Logo on trophies'),
      (new.id, 'Customized branding options', 'Custom options'),
      (new.id, 'Participation in HR meet', 'Access to recruitment drive');
  elsif (lower(new.sponsor_tier) = 'silver') then
    insert into public.sponsor_benefits (sponsor_id, benefit_name, benefit_description) values
      (new.id, 'Stall setup 3x3 mtr', 'Allocated stall space'),
      (new.id, 'Student engagement (webinars/training)', 'Student webinars'),
      (new.id, 'Non-track branding — 10 spots', '10 banners'),
      (new.id, 'Branding on student vehicles (7x7cm)', '7x7cm logo on student formulas'),
      (new.id, 'Database of participating teams', 'Access to team database'),
      (new.id, 'Lunch/refreshments for officials', 'Catering pass'),
      (new.id, 'Logo on website/event site/valedictory', 'Logo placements'),
      (new.id, 'Promotional activities onsite', 'Onsite promo rights'),
      (new.id, 'Materials in student kits', 'Kit insertion'),
      (new.id, 'Award cheque & trophy branding', 'Logo on trophies'),
      (new.id, 'Customized branding options', 'Custom options'),
      (new.id, 'Participation in HR meet', 'Access to recruitment drive');
  elsif (lower(new.sponsor_tier) = 'bronze') then
    insert into public.sponsor_benefits (sponsor_id, benefit_name, benefit_description) values
      (new.id, 'Non-track branding — 5 spots', '5 banners'),
      (new.id, 'Lunch/refreshments for officials', 'Catering pass'),
      (new.id, 'Logo on website/event site/valedictory', 'Logo placements'),
      (new.id, 'Promotional activities onsite', 'Onsite promo rights'),
      (new.id, 'Materials in student kits', 'Kit insertion'),
      (new.id, 'Award cheque & trophy branding', 'Logo on trophies'),
      (new.id, 'Customized branding options', 'Custom options'),
      (new.id, 'Participation in HR meet', 'Access to recruitment drive');
  else
    insert into public.sponsor_benefits (sponsor_id, benefit_name, benefit_description) values
      (new.id, 'Lunch/refreshments for officials', 'Catering pass'),
      (new.id, 'Logo on website/event site/valedictory', 'Logo placements'),
      (new.id, 'Promotional activities onsite', 'Onsite promo rights'),
      (new.id, 'Materials in student kits', 'Kit insertion'),
      (new.id, 'Participation in HR meet', 'Access to recruitment drive');
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists auto_assign_benefits on public.sponsors;
create trigger auto_assign_benefits
  after insert on public.sponsors
  for each row execute procedure public.auto_create_sponsor_benefits_trigger();

create or replace function public.track_change_history_trigger()
returns trigger as $$
declare
  old_val jsonb := null;
  new_val jsonb := null;
  act text;
  ent_id uuid;
  ip text;
  ua text;
  reason text;
  user_uuid uuid;
begin
  user_uuid := auth.uid();
  
  begin
    ip := coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', 'direct-db-access');
    ua := coalesce(current_setting('request.headers', true)::json->>'user-agent', 'unknown-client');
  exception when others then
    ip := 'direct-db-access';
    ua := 'unknown-client';
  end;

  begin
    reason := current_setting('app.change_reason', true);
  exception when others then
    reason := null;
  end;

  if (TG_OP = 'INSERT') then
    act := 'create';
    new_val := to_jsonb(new);
    ent_id := new.id;
  elsif (TG_OP = 'UPDATE') then
    act := 'update';
    old_val := to_jsonb(old);
    new_val := to_jsonb(new);
    ent_id := new.id;
    
    if (old.deleted_at is null and new.deleted_at is not null) then
      act := 'delete';
    elsif (old.deleted_at is not null and new.deleted_at is null) then
      act := 'restore';
    end if;
  elsif (TG_OP = 'DELETE') then
    act := 'purge';
    old_val := to_jsonb(old);
    ent_id := old.id;
  end if;

  insert into public.change_history (
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    changed_by,
    ip_address,
    device,
    change_reason
  ) values (
    TG_TABLE_NAME,
    ent_id,
    act,
    old_val,
    new_val,
    user_uuid,
    ip,
    ua,
    reason
  );

  insert into public.audit_logs (
    action,
    user_id,
    entity_type,
    entity_id,
    ip_address,
    details
  ) values (
    TG_TABLE_NAME || '_' || act,
    user_uuid,
    TG_TABLE_NAME,
    ent_id,
    ip,
    jsonb_build_object(
      'action', act,
      'device', ua,
      'change_reason', reason
    )
  );

  if (TG_OP = 'DELETE') then
    return old;
  else
    return new;
  end if;
end;
$$ language plpgsql security definer;

drop trigger if exists audit_sponsors_changes on public.sponsors;
create trigger audit_sponsors_changes
  after insert or update or delete on public.sponsors
  for each row execute procedure public.track_change_history_trigger();

drop trigger if exists audit_benefits_changes on public.sponsor_benefits;
create trigger audit_benefits_changes
  after insert or update or delete on public.sponsor_benefits
  for each row execute procedure public.track_change_history_trigger();

drop trigger if exists audit_guests_changes on public.guests;
create trigger audit_guests_changes
  after insert or update or delete on public.guests
  for each row execute procedure public.track_change_history_trigger();

drop trigger if exists audit_gatepasses_changes on public.gatepasses;
create trigger audit_gatepasses_changes
  after insert or update or delete on public.gatepasses
  for each row execute procedure public.track_change_history_trigger();

drop trigger if exists audit_tasks_changes on public.event_tasks;
create trigger audit_tasks_changes
  after insert or update or delete on public.event_tasks
  for each row execute procedure public.track_change_history_trigger();

drop trigger if exists audit_users_changes on public.users;
create trigger audit_users_changes
  after insert or update on public.users
  for each row execute procedure public.track_change_history_trigger();

-- ==========================================
-- 4. Role Verification Helpers
-- ==========================================
create or replace function public.get_user_role(user_uuid uuid)
returns text as $$
  select role from public.users where id = user_uuid;
$$ language sql security definer;

create or replace function public.is_user_verified(user_uuid uuid)
returns boolean as $$
  select is_verified from public.users where id = user_uuid;
$$ language sql security definer;

-- ==========================================
-- 5. Row Level Security Policies
-- ==========================================

alter table public.users enable row level security;
alter table public.sponsors enable row level security;
alter table public.sponsor_benefits enable row level security;
alter table public.sponsor_interactions enable row level security;
alter table public.guests enable row level security;
alter table public.gatepasses enable row level security;
alter table public.event_tasks enable row level security;
alter table public.notifications enable row level security;
alter table public.change_history enable row level security;
alter table public.audit_logs enable row level security;

-- Policies
create policy "Users can view their own profile or administrators view all"
  on public.users for select
  using (auth.uid() = id or public.get_user_role(auth.uid()) in ('super_admin', 'admin'));

create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Super admins can update profiles"
  on public.users for update
  using (public.get_user_role(auth.uid()) = 'super_admin');

create policy "Verified users can view active sponsors"
  on public.sponsors for select
  using (public.is_user_verified(auth.uid()));

create policy "Admins can insert sponsors"
  on public.sponsors for insert
  with check (public.get_user_role(auth.uid()) in ('super_admin', 'admin'));

create policy "Admins can update sponsors"
  on public.sponsors for update
  using (public.get_user_role(auth.uid()) in ('super_admin', 'admin'));

create policy "Super Admins can delete sponsors"
  on public.sponsors for delete
  using (public.get_user_role(auth.uid()) = 'super_admin');

create policy "Verified users can view benefits"
  on public.sponsor_benefits for select
  using (public.is_user_verified(auth.uid()));

create policy "Admins can insert benefits"
  on public.sponsor_benefits for insert
  with check (public.get_user_role(auth.uid()) in ('super_admin', 'admin'));

create policy "Admins and Coordinators can update benefits"
  on public.sponsor_benefits for update
  using (public.get_user_role(auth.uid()) in ('super_admin', 'admin', 'coordinator'));

create policy "Super Admins can delete benefits"
  on public.sponsor_benefits for delete
  using (public.get_user_role(auth.uid()) = 'super_admin');

create policy "Verified users can view interactions"
  on public.sponsor_interactions for select
  using (public.is_user_verified(auth.uid()));

create policy "Admins and Coordinators can insert interactions"
  on public.sponsor_interactions for insert
  with check (public.get_user_role(auth.uid()) in ('super_admin', 'admin', 'coordinator'));

create policy "Admins and Coordinators can update interactions"
  on public.sponsor_interactions for update
  using (public.get_user_role(auth.uid()) in ('super_admin', 'admin', 'coordinator'));

create policy "Super Admins can delete interactions"
  on public.sponsor_interactions for delete
  using (public.get_user_role(auth.uid()) = 'super_admin');

create policy "Verified users can view active guests"
  on public.guests for select
  using (public.is_user_verified(auth.uid()));

create policy "Admins can insert guests"
  on public.guests for insert
  with check (public.get_user_role(auth.uid()) in ('super_admin', 'admin'));

create policy "Admins and Coordinators can update guests"
  on public.guests for update
  using (public.get_user_role(auth.uid()) in ('super_admin', 'admin', 'coordinator'));

create policy "Super Admins can delete guests"
  on public.guests for delete
  using (public.get_user_role(auth.uid()) = 'super_admin');

create policy "Verified users can view gatepasses"
  on public.gatepasses for select
  using (public.is_user_verified(auth.uid()));

create policy "Admins and Coordinators can generate gatepasses"
  on public.gatepasses for insert
  with check (public.get_user_role(auth.uid()) in ('super_admin', 'admin', 'coordinator'));

create policy "Admins and Coordinators can update gatepasses"
  on public.gatepasses for update
  using (public.get_user_role(auth.uid()) in ('super_admin', 'admin', 'coordinator'));

create policy "Super Admins can delete gatepasses"
  on public.gatepasses for delete
  using (public.get_user_role(auth.uid()) = 'super_admin');

create policy "Verified users can view tasks"
  on public.event_tasks for select
  using (public.is_user_verified(auth.uid()));

create policy "Admins can create tasks"
  on public.event_tasks for insert
  with check (public.get_user_role(auth.uid()) in ('super_admin', 'admin'));

create policy "Admins and Coordinators can update tasks"
  on public.event_tasks for update
  using (public.get_user_role(auth.uid()) in ('super_admin', 'admin', 'coordinator'));

create policy "Super Admins can delete tasks"
  on public.event_tasks for delete
  using (public.get_user_role(auth.uid()) = 'super_admin');

create policy "Users can select their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Verified users can select change history"
  on public.change_history for select
  using (public.is_user_verified(auth.uid()));

create policy "Administrators can select audit logs"
  on public.audit_logs for select
  using (public.get_user_role(auth.uid()) in ('super_admin', 'admin'));

create policy "Block audit log inserts" on public.audit_logs for insert with check (false);
create policy "Block audit log updates" on public.audit_logs for update using (false);
create policy "Block audit log deletes" on public.audit_logs for delete using (false);

-- ==========================================
-- 6. Seed Data (Sponsors & Guests)
-- ==========================================

-- Seed Sponsors
INSERT INTO public.sponsors (id, sponsor_name, sponsor_tier, sponsor_tier_label, sponsorship_amount, payment_status, lead_status, contact_person, notes) VALUES
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000001', 'MSIL', 'Principal', NULL, 3000000, 'Payment Received', 'confirmed', 'Maruti Suzuki Rep', '-'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000002', 'Envision India', 'Other', 'EV Zone Sponsor', 700000, 'Payment Received', 'confirmed', 'Envision Rep', 'Showcase F1 vehicle'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000003', 'BPCL', 'Gold', 'Gold Sponsor', 700000, 'Pending', 'confirmed', 'BPCL Rep', '-'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000004', 'Dassault Systems', 'Silver', NULL, 500000, 'Pending', 'confirmed', 'Dassault Rep', '-'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000005', 'Munjal Kiriu', 'Silver', NULL, 500000, 'Pending', 'confirmed', 'Munjal Rep', '-'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000006', 'ICAT', 'Silver', NULL, 500000, 'Payment Received', 'confirmed', 'ICAT Rep', '-'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000007', 'JK Tyre', 'Silver', NULL, 500000, 'Pending', 'confirmed', 'JK Tyre Rep', '-'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000008', 'Ansys', 'Bronze', NULL, 300000, 'Pending', 'confirmed', 'Ansys Rep', '-'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000009', 'AVL', 'Bronze', NULL, 300000, 'Pending', 'confirmed', 'AVL Rep', '-'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000010', 'CEAT', 'Bronze', NULL, 300000, 'Payment Received', 'confirmed', 'CEAT Rep', '-'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000011', 'MRF', 'Bronze', NULL, 300000, 'Pending', 'confirmed', 'MRF Rep', '-'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000012', 'Validate', 'Bronze', NULL, 300000, 'Pending', 'confirmed', 'Validate Rep', '-'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000013', 'APOLLO', 'Bronze', NULL, 300000, 'Pending', 'confirmed', 'Apollo Rep', '-'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000014', 'ETAS', 'Bronze', NULL, 250000, 'Pending', 'confirmed', 'ETAS Rep', '-'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000015', 'Migatronic', 'Bronze', 'Bronze · Hot Pit Partner', 200000, 'Pending', 'confirmed', 'Migatronic Rep', 'Hot Pit Partner'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000016', 'EKA Mobility', 'Other', 'Customised Sponsor', 100000, 'Pending', 'confirmed', 'EKA Rep', '-'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000017', 'KIET', 'Other', 'Host Partner', 0, '-', 'confirmed', 'KIET Rep', 'Hostel facility for volunteers'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000018', 'Morphine Motorsports', 'Other', 'Kit Partner', 0, '-', 'confirmed', 'Morphine Rep', 'SUPRA kits'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000019', 'ETAuto', 'Other', 'Media Partner', 0, '-', 'confirmed', 'ETAuto Rep', 'Media coverage'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000020', 'AutoCar', 'Other', 'Media Partner', 0, '-', 'confirmed', 'AutoCar Rep', 'Media coverage'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000021', 'EV Tech News', 'Other', 'Media Partner', 0, '-', 'confirmed', 'EV Tech Rep', 'Media coverage'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000022', 'ARAI', 'Other', 'Supporting Partner', 0, '-', 'confirmed', 'ARAI Rep', 'Support'),
  ('a0e0a0e0-a0e0-4a0e-a0e0-000000000023', 'ACMA', 'Other', 'Supporting Partner', 0, '-', 'confirmed', 'ACMA Rep', 'Support')
ON CONFLICT (id) DO NOTHING;

-- Seed Guests
INSERT INTO public.guests (guest_name, sponsor_id, designation, company, email, phone, remarks, attendance_status, guest_role) VALUES
  ('Mukul', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000020', '-', 'AutoCar', 'mukul.kumar@autocarindia.com', '98736 43293', 'Need to check', 'Pending', 'sponsor'),
  ('Kiran', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000020', '-', 'AutoCar', 'kiran.murali@autocarindia.com', '97464 11023', 'Need to check', 'Pending', 'sponsor'),
  ('Ms. Arushi Rawat', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000019', 'Principal Correspondent', 'ETAuto', 'arushi.rawat@timesinternet.in', '96542 29841', 'Need to check', 'Pending', 'sponsor'),
  ('Himanshu Rautela', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000019', 'Camera Person', 'ETAuto', 'himanshu.rautela@timesinternet.in', '-', 'Need to check', 'Pending', 'sponsor'),
  ('Sudeep Kumar', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000019', '-', 'ETAuto', 'sudeep.kumar@timesinternet.in', '-', 'Need to check — few more will join with him', 'Pending', 'sponsor'),
  ('Mayank Dwivedi', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000008', 'Senior App. Engineer, Synopsys', 'Ansys', 'm.dwivedi@synopsys.com', '63669 49284', '2–5 Sep (need to check)', 'Pending', 'sponsor'),
  ('Rohit Sangwan', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000008', 'Senior App. Engineer, Synopsys', 'Ansys', 'rohit.sangwan@arkinfo.in', '89204 79290', '2–5 Sep (need to check)', 'Pending', 'sponsor'),
  ('Arindam Pal', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000008', 'Application Engineer, CADFEM', 'Ansys', 'arindam.p@cadfem.ai', '80932 80021', '2–5 Sep (need to check)', 'Pending', 'sponsor'),
  ('Vishal Ganore', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000008', 'Academic Program Manager, Synopsys', 'Ansys', 'Not provided', '80077 29958', '2–5 Sep (need to check)', 'Pending', 'sponsor'),
  ('Arup Tyagi', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000008', 'Sr. Manager – Academic Programs, ASEAN, Synopsys', 'Ansys', 'aroop@synopsys.com', '96501 33552', '5 Sep', 'Pending', 'sponsor'),
  ('Amit Kumar Mehta', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000012', 'Director Technical', 'Validate', 'amitkumar.mehta@validateindia.com', '99109 96179', '5 Sep', 'Pending', 'sponsor'),
  ('Irshad Ahmad', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000012', 'Manager', 'Validate', 'irshad.ahmad@validateindia.com', '99993 26820', '2–5 Sep (need to check)', 'Pending', 'sponsor'),
  ('Srishti Sharma', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000012', '-', 'Validate', 'sharshtee.sharma@validateindia.com', '92117 48800', '2–5 Sep (need to check)', 'Pending', 'sponsor'),
  ('Shardool Singh', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000023', 'Regional Secretary – North', 'ACMA', 'shardool.singh@acma.in', 'Not provided', '3 Sep', 'Pending', 'sponsor'),
  ('Mayank Nigam', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000023', 'Dy. Director', 'ACMA', 'mayank.nigam@acma.in', '97111 59124', '3 Sep', 'Pending', 'sponsor'),
  ('Jairaj Kumar', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000023', 'Asst. Director', 'ACMA', 'jairaj.kumar@acma.in', '98734 79790', '3 Sep', 'Pending', 'sponsor'),
  ('Hemant Kumar', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000023', 'Executive Officer', 'ACMA', 'hemant.kumar@acma.in', '88607 91948', '3 Sep', 'Pending', 'sponsor'),
  ('Ashish Jindal', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000005', 'AVP', 'Munjal Kiriu', 'ajindal@munjalkiriu.co.in', '99711 49417', '2–5 Sep (need to check)', 'Pending', 'sponsor'),
  ('Virender Singh Thakur', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000005', 'GM', 'Munjal Kiriu', 'vsthakur@munjalkiriu.co.in', '98103 59859', '2–5 Sep (need to check)', 'Pending', 'sponsor'),
  ('Soutan Patra', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000005', 'AM', 'Munjal Kiriu', 'marketing@munjalkiriu.co.in', '95470 45057', '2–5 Sep (need to check)', 'Pending', 'sponsor'),
  ('Azmat Hussain', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000018', 'Founder and Director', 'Morphine Motorsports', 'director@gomorphine.com', '84607 06779', '31 Aug – 5 Sep', 'Pending', 'sponsor'),
  ('Yash Agrawal', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000018', 'Co-founder and Director', 'Morphine Motorsports', 'mms@gomorphine.com', '90219 83311', '31 Aug – 5 Sep', 'Pending', 'sponsor'),
  ('Ritanshu Vishwakarma', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000018', 'Operations Manager', 'Morphine Motorsports', 'vishwakarmaritanshu@gmail.com', '93593 34153', '31 Aug – 5 Sep', 'Pending', 'sponsor'),
  ('Amol Bhosale', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', '-', 'BPCL', 'amolb@bharatpetroleum.in', '-', '9 May 2026 (as entered — please confirm)', 'Pending', 'sponsor'),
  ('Mukherjee Sourav', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', '-', 'BPCL', 'souravm@bharatpetroleum.in', '-', '9 May 2026 (as entered — please confirm)', 'Pending', 'sponsor'),
  ('Pardeep Goyal', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', 'Business Head (Retail)', 'BPCL', 'pardeepg@bharatpetroleum.in', '-', 'Need to check', 'Pending', 'sponsor'),
  ('Gorav', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', 'CGM, Marketing (Retail)', 'BPCL', 'gorav@bharatpetroleum.in', '-', 'Need to check', 'Pending', 'sponsor'),
  ('Charu Yadav', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', 'Head, Customer Experience (Retail)', 'BPCL', 'yadavc@bharatpetroleum.in', '-', 'Need to check', 'Pending', 'sponsor'),
  ('Sameet Pai', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', 'CGM Finance (Retail)', 'BPCL', 'sameetpai@bharatpetroleum.in', '-', 'Need to check', 'Pending', 'sponsor'),
  ('Achman Trehan', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', 'Head Retail North', 'BPCL', 'trehanaah@bharatpetroleum.in', '-', 'Need to check', 'Pending', 'sponsor'),
  ('Amol Bhosale (State Head)', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000003', 'State Head (Retail), UP West & Uttarakhand', 'BPCL', 'amolb@bharatpetroleum.in', '-', 'Need to check', 'Pending', 'sponsor'),
  ('Thomas Mathew', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000015', 'AGM – Automation & Application', 'Migatronic', 'thomas@migatronic.in', '81309 12380', '1–5 Sep 2026', 'Pending', 'sponsor'),
  ('Harsh Vardhan Jain', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000015', 'Head – Automation & Application', 'Migatronic', 'hvjain@migatronic.in', '99719 98257', '2–5 Sep 2026', 'Pending', 'sponsor'),
  ('Sameer Ansari', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000015', 'Sr. Service Engineer', 'Migatronic', 'sameer@migatronic.in', '70117 24899', '1–5 Sep 2026', 'Pending', 'sponsor'),
  ('Dharmender', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000015', 'Service Engineer', 'Migatronic', 'dharmender@migatronic.in', '90271 55676', '1–5 Sep 2026', 'Pending', 'sponsor'),
  ('Harsh Vardhan Tyagi', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000015', 'GM – North', 'Migatronic', 'harsh@migatronic.in', '99719 98258', '9 May 2026 (as entered — please confirm)', 'Pending', 'sponsor'),
  ('Varun Mukhi', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000015', 'RM – North & East', 'Migatronic', 'varun@migatronic.in', '99719 98260', '9 May 2026 (as entered — please confirm)', 'Pending', 'sponsor'),
  ('Manu Gulati', 'a0e0a0e0-a0e0-4a0e-a0e0-000000000015', 'CEO, Migatronic India', 'Migatronic', 'manu@migatronic.in', '99719 98256', '9 May 2026 (as entered — please confirm)', 'Pending', 'sponsor')
ON CONFLICT DO NOTHING;
