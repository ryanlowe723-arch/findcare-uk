import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, MapPin, Zap, Users, Clock, ChevronRight, ChevronDown,
  Stethoscope, ArrowRight, BadgeCheck, Star, BookOpen,
  Activity, HeartPulse, Brain, Apple, Smile, Bone, PersonStanding, CalendarCheck,
  MessageSquare, BellRing,
} from 'lucide-react'
import PractitionerCard from '../components/PractitionerCard'
import { supabase } from '../lib/supabase'
import { useSeo, ORG_JSONLD } from '../lib/seo'
import { blogPosts } from '../data/blogPosts'

const HERO_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1600&q=80',
    caption: 'Physiotherapy & rehabilitation',
  },
  {
    src: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1600&q=80',
    caption: 'Dentistry',
  },
  {
    src: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=1600&q=80',
    caption: 'Specialist consultations',
  },
  {
    src: 'https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&w=1600&q=80',
    caption: 'Private GPs',
  },
]

const QUICK_FILTERS = [
  'Physiotherapist', 'GP', 'Dentist', 'Sports Medicine', 'Osteopath', 'Psychologist',
]

const HOW_IT_WORKS = [
  { icon: Search, title: 'Describe your concern', body: 'Tell us your injury, condition, or what you need help with.' },
  { icon: MapPin, title: 'Set your location', body: 'Enter your postcode or town — we find practitioners near you.' },
  { icon: Users, title: 'Browse and book', body: 'Compare profiles, check availability, and book directly online.' },
]

const TRUST_ITEMS = [
  { icon: BadgeCheck, label: 'Credentials verified against official registers' },
  { icon: Zap,        label: 'Emergency and same-day slots' },
  { icon: Star,       label: 'Moderated patient reviews' },
  { icon: Clock,      label: 'Real-time online booking' },
]

const SPECIALTIES = [
  { type: 'Physiotherapist', icon: Activity,       title: 'Physiotherapy',    body: 'Injury rehab, post-surgical recovery, chronic pain, and movement problems.' },
  { type: 'GP',              icon: Stethoscope,    title: 'Private GPs',      body: 'Same-week appointments, general health checks, referrals, and prescriptions.' },
  { type: 'Dentist',         icon: Smile,          title: 'Dentistry',        body: 'Check-ups, emergency dental care, hygiene, and cosmetic treatments.' },
  { type: 'Sports Medicine', icon: HeartPulse,     title: 'Sports Medicine',  body: 'Diagnosis of sports injuries, MRI referrals, injections, and return-to-play.' },
  { type: 'Osteopath',       icon: Bone,           title: 'Osteopathy',       body: 'Hands-on treatment for back, neck, and joint pain.' },
  { type: 'Chiropractor',    icon: PersonStanding, title: 'Chiropractic',     body: 'Spinal adjustments and treatment for back and neck conditions.' },
  { type: 'Psychologist',    icon: Brain,          title: 'Psychology',       body: 'Talking therapies for anxiety, depression, stress, and life challenges.' },
  { type: 'Nutritionist',    icon: Apple,          title: 'Nutrition',        body: 'Personalised plans for weight, performance, and medical diets.' },
]

const POPULAR_CONDITIONS = [
  'knee injury', 'back pain', 'sciatica', 'sports injury', 'ankle sprain',
  'shoulder pain', 'neck pain', 'anxiety', 'hip pain', 'ACL tear',
  'post-surgical rehab', 'chronic pain', 'tennis elbow', 'plantar fasciitis',
  'whiplash', 'frozen shoulder', 'stress', 'headaches',
]

const PRACTITIONER_BENEFITS = [
  { icon: BadgeCheck,    title: 'Verified listing', body: 'Your registration is checked and badged — patients trust verified profiles and click them more.' },
  { icon: CalendarCheck, title: 'Online bookings',  body: 'Set your weekly hours once, generate a month of bookable slots in one click, and fill your diary while you work.' },
  { icon: MessageSquare, title: 'Patient enquiries', body: 'Direct questions land in your inbox. Reply by email or phone — no middleman, no commission.' },
  { icon: BellRing,      title: 'Waitlist capture',  body: 'Fully booked? Patients join your waitlist instead of moving on to a competitor.' },
]

const FAQ_PREVIEW = [
  { q: 'Is FindCare UK free to use?', a: 'Yes — searching, comparing practitioners, sending enquiries, and booking appointments are all completely free for patients. You only pay the practitioner for your appointment.' },
  { q: 'Are the practitioners verified?', a: 'Every practitioner must provide their professional registration number (GMC, HCPC, NMC, GOsC, GCC, or BACP), which we check against the official register before their listing goes live.' },
  { q: 'Do I need an account to book?', a: 'No. You can search and book without creating an account — just provide your name and email when booking so the practitioner can contact you.' },
  { q: 'How do emergency appointments work?', a: 'Practitioners flag same-day and urgent slots. Filter your search by "Emergency / same-day slots" to see only practitioners who can see you today.' },
]

export default function Home() {
  const navigate = useNavigate()
  const [condition, setCondition] = useState('')
  const [location, setLocation] = useState('')
  const [featured, setFeatured] = useState(null)
  const [heroIdx, setHeroIdx] = useState(0)
  const [openFaq, setOpenFaq] = useState(null)

  useSeo({
    path: '/',
    jsonLd: ORG_JSONLD,
  })

  useEffect(() => {
    supabase
      .from('practitioners')
      .select('*')
      .eq('status', 'approved')
      .eq('is_featured', true)
      .limit(3)
      .then(({ data }) => setFeatured(data || []))
  }, [])

  // Rotate hero images
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length), 4500)
    return () => clearInterval(t)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (condition) params.set('condition', condition)
    if (location)  params.set('location', location)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <div className="page-top">
      {/* ── HERO: full-bleed rotating imagery, centered search ── */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: 560,
        display: 'flex',
        alignItems: 'center',
        padding: 'var(--s-12) 0',
      }}>
        {/* Background images */}
        <AnimatePresence mode="sync">
          <motion.img
            key={heroIdx}
            src={HERO_IMAGES[heroIdx].src}
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: 0, zIndex: 0,
              width: '100%', height: '100%', objectFit: 'cover',
            }}
          />
        </AnimatePresence>

        {/* Scrim for legibility */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'rgba(15, 23, 42, 0.7)',
        }} />

        {/* Centered content */}
        <div className="page-container" style={{
          position: 'relative', zIndex: 2,
          maxWidth: 860, textAlign: 'center', width: '100%',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          >
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: 'white',
              marginBottom: 'var(--s-2)',
            }}>
              Find the right practitioner for your condition
            </h1>
            <p style={{
              fontSize: '1.05rem',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: 'var(--s-5)',
              lineHeight: 1.65,
              maxWidth: '56ch',
              marginInline: 'auto',
            }}>
              Search verified doctors, dentists, physiotherapists, and specialists across
              the UK — with patient reviews, real availability, and same-day emergency slots.
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSearch}
            className="search-bar"
            style={{ maxWidth: 740, marginInline: 'auto', border: 'none' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.19, 1, 0.22, 1] }}
          >
            <div className="search-field">
              <Search size={17} className="search-field-icon" />
              <input
                type="text"
                placeholder="Condition, injury, or specialist"
                value={condition}
                onChange={e => setCondition(e.target.value)}
                aria-label="Condition or concern"
              />
            </div>
            <div className="search-field">
              <MapPin size={17} className="search-field-icon" />
              <input
                type="text"
                placeholder="Postcode or town"
                value={location}
                onChange={e => setLocation(e.target.value)}
                aria-label="Location"
              />
            </div>
            <button type="submit" className="search-submit">
              Search
            </button>
          </motion.form>

          <div style={{ marginTop: 'var(--s-3)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', marginRight: 4 }}>Popular:</span>
            {QUICK_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => navigate(`/search?type=${encodeURIComponent(f)}`)}
                style={{
                  padding: '6px 15px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.35)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 'var(--s-4)' }}>
            <Link
              to="/symptom-checker"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: 600,
              }}
            >
              <Stethoscope size={15} />
              Not sure who you need? Try the symptom checker
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Caption */}
        <div style={{
          position: 'absolute', bottom: 18, left: 'var(--s-4)', zIndex: 2,
          background: 'rgba(15, 23, 42, 0.6)', color: 'rgba(255,255,255,0.85)',
          padding: '7px 13px', borderRadius: 'var(--r-md)',
          fontSize: '0.78rem', fontWeight: 600,
          backdropFilter: 'blur(4px)',
        }}>
          {HERO_IMAGES[heroIdx].caption}
        </div>

        {/* Dots */}
        <div style={{ position: 'absolute', bottom: 22, right: 'var(--s-4)', zIndex: 2, display: 'flex', gap: 6 }}>
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              aria-label={`Image ${i + 1}`}
              style={{
                width: i === heroIdx ? 20 : 7, height: 7, borderRadius: 4,
                background: i === heroIdx ? 'white' : 'rgba(255,255,255,0.45)',
                transition: 'all 0.3s', padding: 0,
              }}
            />
          ))}
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section style={{
        borderBottom: '1px solid var(--surface-border)',
        padding: 'var(--s-3) 0',
        background: 'white',
      }}>
        <div className="page-container" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 'var(--s-5)' }}>
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              <Icon size={15} style={{ color: 'var(--c-cobalt-700)' }} />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: 'var(--s-10) 0' }}>
        <div className="page-container">
          <div style={{ marginBottom: 'var(--s-5)' }}>
            <h2 className="section-title" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>How it works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--s-4)' }}>
            {HOW_IT_WORKS.map(({ icon: Icon, title, body }, i) => (
              <div
                key={title}
                style={{
                  padding: 'var(--s-4)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 'var(--r-lg)',
                  background: 'white',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--r-md)',
                    background: 'var(--c-cobalt-50)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--c-cobalt-700)', flexShrink: 0,
                  }}>
                    <Icon size={17} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    0{i + 1}
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.975rem', marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BROWSE BY SPECIALTY ── */}
      <section style={{ padding: '0 0 var(--s-10)' }}>
        <div className="page-container">
          <div style={{ marginBottom: 'var(--s-5)' }}>
            <h2 className="section-title" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>Browse by specialty</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.95rem' }}>
              Every practitioner is registration-checked before they appear in results.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--s-3)' }}>
            {SPECIALTIES.map(({ type, icon: Icon, title, body }) => (
              <Link
                key={type}
                to={`/search?type=${encodeURIComponent(type)}`}
                style={{
                  background: 'white', border: '1px solid var(--surface-border)',
                  borderRadius: 'var(--r-lg)', padding: 'var(--s-3) var(--s-4)',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--c-ink-300)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--surface-border)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--r-md)',
                    background: 'var(--c-cobalt-50)', color: 'var(--c-cobalt-700)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={17} />
                  </div>
                  <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMERGENCY BAND ── */}
      <section style={{ padding: '0 0 var(--s-10)' }}>
        <div className="page-container">
          <div style={{
            background: 'var(--c-ink-900)',
            borderRadius: 'var(--r-lg)',
            padding: 'var(--s-5) var(--s-6)',
            color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 'var(--s-4)', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--r-md)',
                background: 'rgba(220,38,38,0.25)', color: '#fca5a5',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Zap size={20} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>
                  Need to see someone today?
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem', maxWidth: '56ch' }}>
                  Many practitioners hold same-day emergency slots for acute injuries and urgent
                  problems. Filter to see only who can see you now.
                </p>
              </div>
            </div>
            <Link
              to="/search?emergency=1"
              className="btn-primary"
              style={{ flexShrink: 0, background: 'white', color: 'var(--c-ink-900)' }}
            >
              Find same-day slots
            </Link>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 10, textAlign: 'center' }}>
            For life-threatening emergencies — chest pain, breathing difficulty, signs of stroke — call 999.
          </p>
        </div>
      </section>

      {/* ── SYMPTOM CHECKER PROMO ── */}
      <section style={{ padding: '0 0 var(--s-10)' }}>
        <div className="page-container">
          <div style={{
            background: 'white',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--r-lg)',
            padding: 'var(--s-5)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 'var(--s-5)', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--r-md)',
                background: 'var(--c-cobalt-50)', color: 'var(--c-cobalt-700)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Stethoscope size={22} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.01em', marginBottom: 4 }}>
                  Physio, osteopath, GP, or sports medicine?
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '54ch' }}>
                  Answer two quick questions and we'll match your problem to the right type of specialist.
                </p>
              </div>
            </div>
            <Link to="/symptom-checker" className="btn-primary" style={{ flexShrink: 0 }}>
              Try the symptom checker
            </Link>
          </div>
        </div>
      </section>

      {/* ── POPULAR SEARCHES ── */}
      <section style={{ padding: '0 0 var(--s-10)' }}>
        <div className="page-container">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 'var(--s-3)' }}>
            Popular searches
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {POPULAR_CONDITIONS.map(c => (
              <Link
                key={c}
                to={`/search?condition=${encodeURIComponent(c)}`}
                className="filter-chip"
                style={{ margin: 0, background: 'white', textTransform: 'capitalize' }}
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRACTITIONERS ── */}
      {featured && featured.length > 0 && (
        <section style={{ padding: 'var(--s-10) 0', background: 'var(--surface-raised)', borderTop: '1px solid var(--surface-border)', borderBottom: '1px solid var(--surface-border)' }}>
          <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'var(--s-5)', flexWrap: 'wrap', gap: 12 }}>
              <h2 className="section-title" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>Featured practitioners</h2>
              <Link to="/search" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--c-cobalt-700)', fontWeight: 600, fontSize: '0.875rem' }}>
                View all <ChevronRight size={16} />
              </Link>
            </div>
            <div className="practitioners-grid">
              {featured.map(p => <PractitionerCard key={p.id} practitioner={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── GUIDES TEASER ── */}
      <section style={{ padding: 'var(--s-10) 0 0' }}>
        <div className="page-container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'var(--s-5)', flexWrap: 'wrap', gap: 12 }}>
            <h2 className="section-title" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>Know before you book</h2>
            <Link to="/blog" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--c-cobalt-700)', fontWeight: 600, fontSize: '0.875rem' }}>
              All guides <ChevronRight size={16} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--s-3)' }}>
            {blogPosts.slice(0, 3).map(post => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                style={{
                  background: 'white', border: '1px solid var(--surface-border)',
                  borderRadius: 'var(--r-lg)', padding: 'var(--s-4)',
                  display: 'flex', flexDirection: 'column', gap: 10,
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--c-ink-300)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--surface-border)'}
              >
                <BookOpen size={17} style={{ color: 'var(--c-cobalt-700)' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.35, color: 'var(--text-primary)' }}>
                  {post.title}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{post.readMins} min read</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ PREVIEW ── */}
      <section style={{ padding: 'var(--s-10) 0' }}>
        <div className="page-container" style={{ maxWidth: 880 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'var(--s-5)', flexWrap: 'wrap', gap: 12 }}>
            <h2 className="section-title" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>Common questions</h2>
            <Link to="/faq" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--c-cobalt-700)', fontWeight: 600, fontSize: '0.875rem' }}>
              All FAQs <ChevronRight size={16} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQ_PREVIEW.map((faq, i) => (
              <div key={i} style={{ border: '1px solid var(--surface-border)', borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'white' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '15px 18px', textAlign: 'left',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    fontWeight: 600, fontSize: '0.925rem', color: 'var(--text-primary)',
                  }}
                >
                  {faq.q}
                  <ChevronDown size={16} style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 18px 16px', fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR PRACTITIONERS ── */}
      <section style={{ padding: 'var(--s-10) 0', background: 'var(--surface-raised)', borderTop: '1px solid var(--surface-border)' }}>
        <div className="page-container">
          <div style={{ marginBottom: 'var(--s-5)', maxWidth: 620 }}>
            <h2 className="section-title" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>
              For healthcare professionals
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.95rem', lineHeight: 1.65 }}>
              A free, verified listing that fills your diary — built for independent
              practitioners and small clinics. No commission, no contracts.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 'var(--s-3)', marginBottom: 'var(--s-5)' }}>
            {PRACTITIONER_BENEFITS.map(({ icon: Icon, title, body }) => (
              <div key={title} style={{
                background: 'white', border: '1px solid var(--surface-border)',
                borderRadius: 'var(--r-lg)', padding: 'var(--s-4)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--r-md)',
                  background: 'var(--c-cobalt-50)', color: 'var(--c-cobalt-700)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  <Icon size={17} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </div>

          <div style={{
            background: 'var(--c-ink-900)',
            borderRadius: 'var(--r-lg)',
            padding: 'var(--s-5) var(--s-6)',
            color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 'var(--s-4)', flexWrap: 'wrap',
          }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', marginBottom: 4 }}>
                Join the directory in under 10 minutes
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem' }}>
                Verification usually completes within 24–48 hours.
              </p>
            </div>
            <Link to="/register" className="btn-primary" style={{ flexShrink: 0, background: 'white', color: 'var(--c-ink-900)' }}>
              List your practice — free
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
