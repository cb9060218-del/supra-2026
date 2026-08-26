# SUPRA SAEINDIA 2026 — Sponsor & Guest Portal

A production-ready, mobile-optimized Event Management and CRM Portal for **SUPRA SAEINDIA 2026**, built with Next.js, Tailwind CSS, and Supabase.

## Features

- **Adaptive Day / Night Themes:** Instant layout theme toggling.
- **Sponsors CRM:** Manage sponsors, sponsorships, custom benefits, and payment tracking (Pending, Payment Received, Paid, Partial, or `-`) in real-time.
- **Guest List Manager:** Inline guest registration forms, expected arrivals log, and role segmentation.
- **Access Management & Self-Healing Profile Verification:** Role-based dashboards for Super Admins and Admins. All registered users are instantly approved and verified upon sign-in.
- **Audit Center & System Logs:** Log trace details for every profile modification.

---

## Local Setup

1. Clone the project.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment keys:
   Configure `.env` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
4. Run migrations:
   Execute the contents of `supabase/migrations/20260825000000_init.sql` in your Supabase SQL Editor.
5. Run the dev server:
   ```bash
   npm run dev
   ```

---

## Deployment to Vercel

1. Push this repository to your GitHub account (automated below).
2. Go to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import the `supra-2026` repository.
4. Configure the environment variables in Vercel settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (Set this to your Vercel deployment domain)
5. Click **Deploy**. Vercel will automatically build and publish the portal.
