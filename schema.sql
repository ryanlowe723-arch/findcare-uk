-- ============================================================
-- FindCare UK — Supabase Database Schema (v2)
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
  title             text DEFAULT 'Dr',
  email             text NOT NULL,
  phone             text,
  website           text,
  bio               text,
  photo_url         text,

  -- Credentials (verification)
  registration_body   text,                           -- GMC / HCPC / NMC / GOsC / GCC / BACP
  registration_number text,
  qualifications      text[],                         -- ['BSc Physiotherapy', 'MSc Sports Medicine']
  years_experience    integer,
  is_verified         boolean NOT NULL DEFAULT false, -- admin sets after checking register

  -- Classification
  types             text[] DEFAULT '{}',
  specialties       text[] DEFAULT '{}',

  -- Location
  location_name     text,
  postcode          text,
  lat               float8,
  lng               float8,

  -- Status
  status            text NOT NULL DEFAULT 'pending',  -- pending / approved / rejected

  -- Services
  has_booking       boolean NOT NULL DEFAULT false,
  emergency_available boolean NOT NULL DEFAULT false,
  accepts_nhs       boolean NOT NULL DEFAULT false,
  accepts_private   boolean NOT NULL DEFAULT true,
  offers_video      boolean NOT NULL DEFAULT false,   -- video consultations
  offers_home_visits boolean NOT NULL DEFAULT false,
  languages         text[] DEFAULT '{"English"}',

  -- Aggregates (maintained by trigger)
  avg_rating        numeric(3,2) DEFAULT 0,
  review_count      integer NOT NULL DEFAULT 0,

  -- External review platforms
  google_place_id   text,                             -- Google Business Profile place ID
  trustpilot_url    text,                             -- link to Trustpilot page

  -- Admin
  is_featured       boolean NOT NULL DEFAULT false,
  rejection_reason  text,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

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
  is_video          boolean NOT NULL DEFAULT false,
  price             integer DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON availability_slots(practitioner_id, date);
CREATE INDEX ON availability_slots(date) WHERE NOT is_booked;

-- ────────────────────────────────────────────────────────────
-- RECURRING SCHEDULES (weekly templates → generate slots)
-- ────────────────────────────────────────────────────────────
CREATE TABLE recurring_schedules (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id   uuid NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  day_of_week       integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0 = Sunday
  start_time        time NOT NULL,
  end_time          time NOT NULL,
  slot_minutes      integer NOT NULL DEFAULT 30,
  appointment_type  text DEFAULT 'Consultation',
  price             integer DEFAULT 0,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON recurring_schedules(practitioner_id);

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
  cancellation_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON bookings(practitioner_id);
CREATE INDEX ON bookings(slot_id);
CREATE INDEX ON bookings(cancellation_token);

-- Patient self-cancellation by token (no auth needed; token is the secret)
CREATE OR REPLACE FUNCTION cancel_booking_by_token(token uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  b RECORD;
BEGIN
  SELECT * INTO b FROM bookings WHERE cancellation_token = token AND status = 'confirmed';
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE bookings SET status = 'cancelled' WHERE id = b.id;
  UPDATE availability_slots SET is_booked = false WHERE id = b.slot_id;
  RETURN true;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- REVIEWS (moderated: pending until admin approves)
-- ────────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id   uuid NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  reviewer_name     text NOT NULL,
  reviewer_email    text NOT NULL,
  rating            integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment           text,
  status            text NOT NULL DEFAULT 'pending',  -- pending / approved / rejected
  practitioner_reply text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON reviews(practitioner_id) WHERE status = 'approved';

-- Maintain avg_rating / review_count on practitioners
CREATE OR REPLACE FUNCTION refresh_practitioner_rating()
RETURNS TRIGGER AS $$
DECLARE
  pid uuid := COALESCE(NEW.practitioner_id, OLD.practitioner_id);
BEGIN
  UPDATE practitioners SET
    avg_rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE practitioner_id = pid AND status = 'approved'), 0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE practitioner_id = pid AND status = 'approved')
  WHERE id = pid;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_refresh_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION refresh_practitioner_rating();

-- ────────────────────────────────────────────────────────────
-- ENQUIRIES (patient → practitioner messages)
-- ────────────────────────────────────────────────────────────
CREATE TABLE enquiries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id   uuid NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  sender_name       text NOT NULL,
  sender_email      text NOT NULL,
  sender_phone      text,
  message           text NOT NULL,
  is_read           boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON enquiries(practitioner_id, is_read);

-- ────────────────────────────────────────────────────────────
-- WAITLIST (patients join when no slots available)
-- ────────────────────────────────────────────────────────────
CREATE TABLE waitlist_entries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id   uuid NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  patient_name      text NOT NULL,
  patient_email     text NOT NULL,
  patient_phone     text,
  notes             text,
  is_notified       boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON waitlist_entries(practitioner_id) WHERE NOT is_notified;

-- ────────────────────────────────────────────────────────────
-- GEO SEARCH FUNCTION
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
  registration_body   text,
  registration_number text,
  qualifications      text[],
  years_experience    integer,
  is_verified         boolean,
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
  offers_video      boolean,
  offers_home_visits boolean,
  languages         text[],
  avg_rating        numeric,
  review_count      integer,
  google_place_id   text,
  trustpilot_url    text,
  is_featured       boolean,
  distance_km       float8
)
LANGUAGE sql STABLE AS $$
  SELECT
    p.id, p.name, p.title, p.email, p.phone, p.website, p.bio, p.photo_url,
    p.registration_body, p.registration_number, p.qualifications, p.years_experience, p.is_verified,
    p.types, p.specialties, p.location_name, p.postcode, p.lat, p.lng, p.status,
    p.has_booking, p.emergency_available, p.accepts_nhs, p.accepts_private,
    p.offers_video, p.offers_home_visits, p.languages,
    p.avg_rating, p.review_count, p.google_place_id, p.trustpilot_url, p.is_featured,
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
      OR EXISTS (
        SELECT 1 FROM unnest(p.specialties) s
        WHERE s ILIKE '%' || condition_query || '%'
           OR condition_query ILIKE '%' || s || '%'
      )
      OR EXISTS (
        SELECT 1 FROM unnest(p.types) t
        WHERE t ILIKE '%' || condition_query || '%'
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
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews             ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries           ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_entries    ENABLE ROW LEVEL SECURITY;

-- Practitioners
CREATE POLICY "public_read_approved" ON practitioners
  FOR SELECT USING (status = 'approved');
CREATE POLICY "own_practitioner_select" ON practitioners
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_practitioner_update" ON practitioners
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "public_insert_practitioner" ON practitioners
  FOR INSERT WITH CHECK (true);

-- Availability
CREATE POLICY "public_read_slots" ON availability_slots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM practitioners p WHERE p.id = practitioner_id AND p.status = 'approved')
  );
CREATE POLICY "own_slots_all" ON availability_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM practitioners p WHERE p.id = practitioner_id AND p.user_id = auth.uid())
  );

-- Recurring schedules (practitioner-only)
CREATE POLICY "own_schedules_all" ON recurring_schedules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM practitioners p WHERE p.id = practitioner_id AND p.user_id = auth.uid())
  );

-- Bookings
CREATE POLICY "own_bookings_select" ON bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM practitioners p WHERE p.id = practitioner_id AND p.user_id = auth.uid())
  );
CREATE POLICY "own_bookings_update" ON bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM practitioners p WHERE p.id = practitioner_id AND p.user_id = auth.uid())
  );
CREATE POLICY "public_create_booking" ON bookings
  FOR INSERT WITH CHECK (true);

-- Reviews: public reads approved; anyone can submit (pending); practitioner replies
CREATE POLICY "public_read_approved_reviews" ON reviews
  FOR SELECT USING (status = 'approved');
CREATE POLICY "own_reviews_select" ON reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM practitioners p WHERE p.id = practitioner_id AND p.user_id = auth.uid())
  );
CREATE POLICY "public_submit_review" ON reviews
  FOR INSERT WITH CHECK (status = 'pending');
CREATE POLICY "practitioner_reply_review" ON reviews
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM practitioners p WHERE p.id = practitioner_id AND p.user_id = auth.uid())
  );

-- Enquiries: anyone sends; practitioner reads/updates own
CREATE POLICY "public_send_enquiry" ON enquiries
  FOR INSERT WITH CHECK (true);
CREATE POLICY "own_enquiries_select" ON enquiries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM practitioners p WHERE p.id = practitioner_id AND p.user_id = auth.uid())
  );
CREATE POLICY "own_enquiries_update" ON enquiries
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM practitioners p WHERE p.id = practitioner_id AND p.user_id = auth.uid())
  );

-- Waitlist: anyone joins; practitioner reads/updates own
CREATE POLICY "public_join_waitlist" ON waitlist_entries
  FOR INSERT WITH CHECK (true);
CREATE POLICY "own_waitlist_select" ON waitlist_entries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM practitioners p WHERE p.id = practitioner_id AND p.user_id = auth.uid())
  );
CREATE POLICY "own_waitlist_update" ON waitlist_entries
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM practitioners p WHERE p.id = practitioner_id AND p.user_id = auth.uid())
  );

-- Admin override on everything (role = 'admin' in user_metadata)
CREATE POLICY "admin_all_practitioners" ON practitioners
  FOR ALL USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');
CREATE POLICY "admin_all_slots" ON availability_slots
  FOR ALL USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');
CREATE POLICY "admin_all_schedules" ON recurring_schedules
  FOR ALL USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');
CREATE POLICY "admin_all_bookings" ON bookings
  FOR ALL USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');
CREATE POLICY "admin_all_reviews" ON reviews
  FOR ALL USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');
CREATE POLICY "admin_all_enquiries" ON enquiries
  FOR ALL USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');
CREATE POLICY "admin_all_waitlist" ON waitlist_entries
  FOR ALL USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');

-- ────────────────────────────────────────────────────────────
-- STORAGE BUCKET
-- ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('practitioner-photos', 'practitioner-photos', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "public_read_photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'practitioner-photos');
CREATE POLICY "auth_upload_photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'practitioner-photos' AND auth.role() = 'authenticated');
CREATE POLICY "own_update_photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'practitioner-photos' AND auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- SAMPLE DATA (optional — remove in production)
-- ────────────────────────────────────────────────────────────
INSERT INTO practitioners (
  name, title, email, phone, bio, types, specialties,
  location_name, postcode, lat, lng,
  status, has_booking, emergency_available, accepts_nhs, accepts_private, is_featured,
  registration_body, registration_number, qualifications, years_experience, is_verified,
  offers_video
) VALUES
(
  'Sarah Mitchell', 'Dr',
  'sarah.mitchell@example.com', '020 7946 0000',
  'Sports medicine specialist with 15 years experience treating musculoskeletal injuries including ACL tears, knee pain, and running injuries. Former team physician for UK Athletics.',
  ARRAY['Sports Medicine', 'GP'],
  ARRAY['knee injury', 'ACL tear', 'runner knee', 'sports injury', 'back pain', 'shoulder pain'],
  'London', 'SW1A 1AA', 51.5014, -0.1419,
  'approved', true, false, true, true, true,
  'GMC', '1234567', ARRAY['MBBS', 'MSc Sports & Exercise Medicine', 'MRCGP'], 15, true,
  true
),
(
  'James Thornton', 'Mr',
  'james.thornton@example.com', '0161 496 0000',
  'Chartered physiotherapist specialising in post-surgical rehabilitation and chronic pain management. HCPC registered, MCSP qualified.',
  ARRAY['Physiotherapist'],
  ARRAY['knee rehabilitation', 'post-surgical rehab', 'chronic pain', 'back pain', 'hip pain'],
  'Manchester', 'M1 1AE', 53.4808, -2.2426,
  'approved', true, true, true, true, true,
  'HCPC', 'PH123456', ARRAY['BSc (Hons) Physiotherapy', 'MCSP'], 12, true,
  false
),
(
  'Priya Patel', 'Dr',
  'priya.patel@example.com', '0117 496 0000',
  'GP with specialist interest in musculoskeletal medicine. Offering same-day urgent appointments for acute injuries.',
  ARRAY['GP'],
  ARRAY['knee injury', 'ankle sprain', 'wrist injury', 'general injury', 'musculoskeletal'],
  'Bristol', 'BS1 1AA', 51.4545, -2.5879,
  'approved', false, true, true, false, false,
  'GMC', '7654321', ARRAY['MBBS', 'MRCGP'], 9, true,
  true
);
