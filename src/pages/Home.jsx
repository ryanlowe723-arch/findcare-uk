import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, MapPin, Zap, Users, Clock, ChevronRight,
  Stethoscope, ArrowRight, BadgeCheck, Star, BookOpen,
} from 'lucide-react'
import PractitionerCard from '../components/PractitionerCard'
import { supabase } from '../lib/supabase'
import { useSeo, ORG_JSONLD } from '../lib/seo'
import { blogPosts } from '../data/blogPosts'

const QUICK_FILTERS = [
  'Physiotherapist', 'GP', 'Sports Medicine', 'Osteopath', 'Chiropractor', 'Psychologist',
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

export default function Home() {
  const navigate = useNavigate()
  const [condition, setCondition] = useState('')
  const [location, setLocation] = useState('')
  const [featured, setFeatured] = useState(null)

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

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (condition) params.set('condition', condition)
    if (location)  params.set('location', location)
    navigate(`/search?${params.toString()}`)
  }

  const handleQuickFilter = (type) => {
    navigate(`/search?type=${encodeURIComponent(type)}`)
  }

  return (
    <div className="page-top">
      {/* ── HERO ── */}
      <section style={{
        background: 'var(--surface-raised)',
        borderBottom: '1px solid var(--surface-border)',
        padding: 'var(--s-12) 0 var(--s-10)',
      }}>
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            style={{ maxWidth: 820 }}
          >
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'clamp(1.9rem, 4.5vw, 3rem)',
              letterSpacing: '-0.03em',
              lineHeight: 1.12,
              color: 'var(--text-primary)',
              marginBottom: 'var(--s-2)',
            }}>
              Find the right practitioner for your condition
            </h1>
            <p style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--s-5)',
              lineHeight: 1.65,
              maxWidth: '56ch',
            }}>
              Search verified doctors, physiotherapists, and specialists across the UK —
              with patient reviews, real availability, and same-day emergency slots.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.form
            onSubmit={handleSearch}
            className="search-bar"
            style={{ maxWidth: 820 }}
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

          {/* Quick filters */}
          <div style={{ marginTop: 'var(--s-3)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginRight: 4 }}>Popular:</span>
            {QUICK_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => handleQuickFilter(f)}
                className="filter-chip"
                style={{ margin: 0, background: 'white' }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Symptom checker hint */}
          <div style={{ marginTop: 'var(--s-4)' }}>
            <Link
              to="/symptom-checker"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                color: 'var(--c-cobalt-700)', fontSize: '0.9rem', fontWeight: 600,
              }}
            >
              <Stethoscope size={15} />
              Not sure who you need? Try the symptom checker
              <ArrowRight size={14} />
            </Link>
          </div>
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
      <section style={{ padding: 'var(--s-12) 0' }}>
        <div className="page-container">
          <div style={{ marginBottom: 'var(--s-6)' }}>
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

      {/* ── SYMPTOM CHECKER PROMO ── */}
      <section style={{ padding: '0 0 var(--s-12)' }}>
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
      <section style={{ padding: 'var(--s-12) 0 0' }}>
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

      {/* ── PRACTITIONER CTA ── */}
      <section style={{ padding: 'var(--s-12) 0' }}>
        <div className="page-container">
          <div style={{
            background: 'var(--c-ink-900)',
            borderRadius: 'var(--r-lg)',
            padding: 'var(--s-6)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--s-5)',
            flexWrap: 'wrap',
          }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', letterSpacing: '-0.02em', marginBottom: 8 }}>
                Are you a healthcare professional?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', maxWidth: '52ch' }}>
                Free verified listing, online bookings, patient enquiries, and review management.
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
