# FindCare UK

UK healthcare practitioner directory — patients search by **condition + location**, compare verified practitioners, and book appointments online (including emergency/same-day slots). Practitioners self-register, get admin-verified, and manage everything from a dashboard.

**Stack:** React 19 + Vite · Supabase (Postgres, Auth, Storage, Edge Functions) · Vercel · Leaflet/OpenStreetMap · postcodes.io

## Features

### Patients
- Condition + postcode search with PostGIS radius matching and best-match ranking
- **Symptom checker** — 2-question triage matching problems to the right specialist type, with red-flag warnings
- List + **map view** of results; filters for type, distance, emergency slots, NHS, video consults, rating, language
- Practitioner profiles: verified credentials (GMC/HCPC/NMC...), moderated reviews, **live Google reviews**, Trustpilot link
- Real-time slot booking (no account needed), email confirmation with cancellation link
- **Waitlist** when a practitioner is fully booked
- Direct enquiry messaging, saved-practitioner shortlist, share profiles

### Practitioners
- Free 5-step registration with credential capture
- Dashboard: profile editor, **weekly recurring schedule → one-click slot generation**, one-off slots, bookings, enquiry inbox, public review replies
- Google Business Profile + Trustpilot integration

### Admin (`/admin`, requires `role: admin` in user metadata)
- Pending application queue with one-click register-checking links
- Review moderation, verified-badge + featured toggles, full practitioner table

### Growth (SEO + GEO)
- Per-page meta/OG/canonical via `useSeo` hook; JSON-LD (WebSite+SearchAction, Physician, FAQPage, Article)
- `sitemap.xml`, `robots.txt` (AI crawlers welcomed), **`llms.txt`** for AI search engines
- 6 evidence-based blog guides in Q&A format, FAQ page with FAQPage schema
- PWA manifest, lazy-loaded routes, on-demand map chunk

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. SQL Editor → run **`schema.sql`** (tables, RLS, PostGIS search, rating triggers, storage bucket, sample data)
3. To make yourself admin: Auth → Users → your user → User Metadata → `{ "role": "admin" }`

### 2. Environment variables
Copy `.env.example` → `.env.local`, fill in:
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (required)
- `GOOGLE_PLACES_API_KEY` (optional — live Google reviews; set in Vercel only)

### 3. Email notifications (optional)
```bash
supabase secrets set RESEND_API_KEY=re_xxx SITE_URL=https://your-domain.com
supabase functions deploy notify
```

### 4. Deploy
Push to GitHub → import in Vercel → add the env vars → deploy. `vercel.json` already handles SPA routing while leaving `/api/*` for the serverless Google-reviews function.

## Local dev
```bash
npm install
npm run dev
```
