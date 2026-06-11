-- ============================================================
-- FindCare UK — Supabase Database Schema
-- Run this in your Supabase SQL Editor (project > SQL Editor)
-- ============================================================

-- Enable PostGIS extensions for geo search
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;
CREATE EXTENSION IF NOT EXISTS cube CASCADE;

-- ────────────────────────────────────────────────────────────
-- PRACTITIONERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE practitioners (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Identity
  name              text NOT NULL,
  title             text DEFAULT 'Dr',               -- Dr / Mr / Ms / Prof / etc.
  email             text NOT NULL,
  phone             text,
  website           text,
  bio               text,
  photo_url         text,

  -- Classification
  types             text[] DEFAULT '{}',              -- ['GP', 'Physiotherapist', ...]
  specialties       text[] DEFAULT '{}',              -- conditions treated

  -- Location
  location_name     text,                             -- display city/town
  postcode          text,
  lat               float8,
  lng               float8,

  -- Status
  status            text NOT NULL DEFAULT 'pending',  -- pending / approved / rejected

  -- Services
  has_booking       boolean NOT NULL DEFAULT false,   -- uses the availability system
  emergency_available boolean NOT NULL DEFAULT false,
  accepts_nhs       boolean NOT NULL DEFAULT false,
  accepts_private   boolean NOT NULL DEFAULT true,
  languages         text[] DEFAULT '{"English"}',

  -- Admin
  is_featured       boolean NOT NULL DEFAULT false,
  rejection_reason  text,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER practitioners_updated_at
  BEFORE UPDATE ON practitioners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
-- AVAILABILITY SLOTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE availability_slots (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id   uuid NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  date              date NOT NULL,
  start_time        time NOT NULL,
  end_time          time NOT NULL,
  is_booked         boolean NOT NULL DEFAULT false,
  is_emergency      boolean NOT NULL DEFAULT false,
  appointment_type  text DEFAULT 'Consultation',
  price             integer DEFAULT 0,               -- pence; 0 = free/NHS
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON availability_slots(practitioner_id, date);
CREATE INDEX ON availability_slots(date) WHERE NOT is_booked;

-- ────────────────────────────────────────────────────────────
-- BOOKINGS
-- ────────────────────────────────────────────────────────────
CREATE TABLE bookings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id           uuid NOT NULL REFERENCES availability_slots(id) ON DELETE CASCADE,
  practitioner_id   uuid NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  patient_name      text NOT NULL,
  patient_email     text NOT NULL,
  patient_phone     text,
  condition_notes   text,
  status            text NOT NULL DEFAULT 'confirmed',  -- confirmed / cancelled
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON bookings(practitioner_id);
CREATE INDEX ON bookings(slot_id);

-- ────────────────────────────────────────────────────────────
-- GEO SEARCH FUNCTION
-- Returns approved practitioners within radius_km of (lat, lng)
-- filtered by condition text and optional type array
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_practitioners(
  search_lat      float8,
  search_lng      float8,
  radius_km       float8 DEFAULT 25,
  condition_query text   DEFAULT '',
  type_filter     text[] DEFAULT NULL
)
RETURNS TABLE(
  id                uuid,
  name              text,
  title             text,
  email             text,
  phone             text,
  website           text,
  bio               text,
  photo_url         text,
  types             text[],
  specialties       text[],
  location_name     text,
  postcode          text,
  lat               float8,
  lng               float8,
  status            text,
  has_booking       boolean,
  emergency_available boolean,
  accepts_nhs       boolean,
  accepts_private   boolean,
  languages         text[],
  is_featured       boolean,
  distance_km       float8
)
LANGUAGE sql STABLE AS $$
  SELECT
    p.*,
    earth_distance(
      ll_to_earth(search_lat, search_lng),
      ll_to_earth(p.lat, p.lng)
    ) / 1000.0 AS distance_km
  FROM practitioners p
  WHERE
    p.status = 'approved'
    AND p.lat IS NOT NULL
    AND p.lng IS NOT NULL
    AND earth_distance(
          ll_to_earth(search_lat, search_lng),
          ll_to_earth(p.lat, p.lng)
        ) <= radius_km * 1000
    AND (
      condition_query = ''
      OR condition_query ILIKE ANY(
        SELECT '%' || s || '%' FROM unnest(p.specialties) s
      )
      OR EXISTS (
        SELECT 1 FROM unnest(p.specialties) s
        WHERE s ILIKE '%' || condition_query || '%'
      )
    )
    AND (
      type_filter IS NULL
      OR type_filter = '{}'
      OR p.types && type_filter
    )
  ORDER BY distance_km;
$$;

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
ALTER TABLE practitioners       ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings            ENABLE ROW LEVEL SECURITY;

-- Public can read approved practitioners
CREATE POLICY "public_read_approved" ON practitioners
  FOR SELECT USING (status = 'approved');

-- Practitioners can read/update their own record
CREATE POLICY "own_practitioner_select" ON practitioners
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_practitioner_update" ON practitioners
  FOR UPDATE USING (auth.uid() = user_id);

-- Anyone can insert (registration)
CREATE POLICY "public_insert_practitioner" ON practitioners
  FOR INSERT WITH CHECK (true);

-- Availability: public read (unbooked slots)
CREATE POLICY "public_read_slots" ON availability_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practitioners p
      WHERE p.id = practitioner_id AND p.status = 'approved'
    )
  );

-- Practitioners manage their own slots
CREATE POLICY "own_slots_all" ON availability_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM practitioners p
      WHERE p.id = practitioner_id AND p.user_id = auth.uid()
    )
  );

-- Bookings: practitioners see their own
CREATE POLICY "own_bookings_select" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practitioners p
      WHERE p.id = practitioner_id AND p.user_id = auth.uid()
    )
  );

-- Patients can create bookings (no auth required)
CREATE POLICY "public_create_booking" ON bookings
  FOR INSERT WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- ADMIN OVERRIDE (set role = 'admin' in user_metadata)
-- Run in Supabase dashboard: Auth > Users > Edit user > metadata
-- { "role": "admin" }
-- ────────────────────────────────────────────────────────────

-- Admin can do everything
CREATE POLICY "admin_all_practitioners" ON practitioners
  FOR ALL USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');

CREATE POLICY "admin_all_slots" ON availability_slots
  FOR ALL USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');

CREATE POLICY "admin_all_bookings" ON bookings
  FOR ALL USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');

-- ────────────────────────────────────────────────────────────
-- STORAGE BUCKET (run via Supabase dashboard or here)
-- ────────────────────────────────────────────────────────────
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('practitioner-photos', 'practitioner-photos', true)
-- ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- SAMPLE DATA (optional — remove in production)
-- ────────────────────────────────────────────────────────────
INSERT INTO practitioners (
  name, title, email, phone, bio, types, specialties,
  location_name, postcode, lat, lng,
  status, has_booking, emergency_available, accepts_nhs, accepts_private, is_featured
) VALUES
(
  'Dr Sarah Mitchell', 'Dr',
  'sarah.mitchell@example.com', '020 7946 0000',
  'Sports medicine specialist with 15 years experience treating musculoskeletal injuries including ACL tears, knee pain, and running injuries. Former team physician for UK Athletics.',
  ARRAY['Sports Medicine', 'GP'],
  ARRAY['knee injury', 'ACL tear', 'runner knee', 'sports injury', 'back pain', 'shoulder pain'],
  'London', 'SW1A 1AA', 51.5014, -0.1419,
  'approved', true, false, true, true, true
),
(
  'James Thornton', 'Mr',
  'james.thornton@example.com', '0161 496 0000',
  'Chartered physiotherapist specialising in post-surgical rehabilitation and chronic pain management. HCPC registered, MCSP qualified.',
  ARRAY['Physiotherapist'],
  ARRAY['knee rehabilitation', 'post-surgical rehab', 'chronic pain', 'back pain', 'hip pain'],
  'Manchester', 'M1 1AE', 53.4808, -2.2426,
  'approved', true, true, true, true, true
),
(
  'Dr Priya Patel', 'Dr',
  'priya.patel@example.com', '0117 496 0000',
  'GP with specialist interest in musculoskeletal medicine. Offering same-day urgent appointments for acute injuries.',
  ARRAY['GP'],
  ARRAY['knee injury', 'ankle sprain', 'wrist injury', 'general injury', 'musculoskeletal'],
  'Bristol', 'BS1 1AA', 51.4545, -2.5879,
  'approved', false, true, true, false, false
);
