import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, MapPin, Zap, Users, Shield, Clock, ChevronRight,
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
  { icon: Users, title: 'Browse & book', body: 'Compare profiles, check availability, and book directly online.' },
]

const TRUST_ITEMS = [
  { icon: BadgeCheck, label: 'Credentials verified against official registers' },
  { icon: Zap,        label: 'Emergency & same-day slots' },
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
        background: 'linear-gradient(135deg, var(--c-ink-900) 0%, var(--c-cobalt-700) 100%)',
        padding: 'var(--s-16) 0 var(--s-12)',
        color: 'white',
        textAlign: 'center',
      }}>
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
          >
            <div className="section-tag" style={{ color: 'rgba(255,255,255,0.6)' }}>
              UK Healthcare Directory
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'clamp(2.2rem, 6vw, 4rem)',
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              marginBottom: 'var(--s-3)',
              marginTop: 8,
            }}>
              Find the right practitioner<br />
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>for your condition</span>
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 'var(--s-5)',
              lineHeight: 1.6,
            }}>
              Verified doctors, physios & specialists — with reviews, real availability,
              and emergency&nbsp;slots.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.form
            onSubmit={handleSearch}
            className="search-bar"
            style={{ maxWidth: 740, marginInline: 'auto' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.19, 1, 0.22, 1] }}
          >
            <div className="search-field">
              <Search size={18} className="search-field-icon" />
              <input
                type="text"
                placeholder="Condition, injury, or specialist..."
                value={condition}
                onChange={e => setCondition(e.target.value)}
                aria-label="Condition or concern"
              />
            </div>
            <div className="search-field">
              <MapPin size={18} className="search-field-icon" />
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
          <div style={{ marginTop: 'var(--s-3)', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            {QUICK_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => handleQuickFilter(f)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 999,
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Symptom checker hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ marginTop: 'var(--s-4)' }}
          >
            <Link
              to="/symptom-checker"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', fontWeight: 500,
              }}
            >
              <Stethoscope size={15} />
              Not sure who you need? Try the symptom checker
              <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section style={{
        borderBottom: '1px solid var(--surface-border)',
        padding: 'var(--s-3) 0',
        background: 'var(--surface-raised)',
      }}>
        <div className="page-container" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 'var(--s-5)' }}>
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
              <Icon size={16} style={{ color: 'var(--c-cobalt-100)' }} />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: 'var(--s-12) 0' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--s-6)' }}>
            <div className="section-tag">Simple process</div>
            <h2 className="section-title">How FindCare UK works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--s-4)' }}>
            {HOW_IT_WORKS.map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{
                  padding: 'var(--s-5)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 'var(--r-lg)',
                  background: 'white',
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--r-md)',
                  background: 'var(--c-cobalt-50)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 'var(--s-2)', color: 'var(--c-cobalt-700)',
                }}>
                  <Icon size={22} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SYMPTOM CHECKER PROMO ── */}
      <section style={{ padding: '0 0 var(--s-12)' }}>
        <div className="page-container">
          <div style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--s-6)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 'var(--s-5)', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 'var(--r-lg)',
                background: 'var(--c-cobalt-50)', color: 'var(--c-cobalt-700)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Stethoscope size={26} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', marginBottom: 4 }}>
                  Physio, osteo, GP, or sports medicine?
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '50ch' }}>
                  Answer two quick questions and we'll match your problem to the right type of specialist — including red-flag warnings for symptoms that need urgent care.
                </p>
              </div>
            </div>
            <Link to="/symptom-checker" className="btn-primary btn-primary-lg" style={{ flexShrink: 0 }}>
              Try the Symptom Checker
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURED PRACTITIONERS ── */}
      {featured && featured.length > 0 && (
        <section style={{ padding: 'var(--s-10) 0', background: 'var(--surface-raised)', borderTop: '1px solid var(--surface-border)' }}>
          <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'var(--s-5)', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div className="section-tag">Featured</div>
                <h2 className="section-title" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>Top practitioners</h2>
              </div>
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
            <div>
              <div className="section-tag">Guides & Advice</div>
              <h2 className="section-title" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>Know before you book</h2>
            </div>
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
                  transition: 'all 0.2s', boxShadow: 'var(--card-shadow)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--card-shadow-hv)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--card-shadow)' }}
              >
                <BookOpen size={18} style={{ color: 'var(--c-cobalt-100)' }} />
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
            background: 'linear-gradient(135deg, var(--c-cobalt-700) 0%, var(--c-ink-900) 100%)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--s-8)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--s-5)',
            flexWrap: 'wrap',
          }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.03em', marginBottom: 8 }}>
                Are you a healthcare professional?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', maxWidth: '48ch' }}>
                Free verified listing, online bookings, patient enquiries, review management, and a waitlist that captures patients even when you're full.
              </p>
            </div>
            <Link to="/register" className="btn-primary btn-primary-lg" style={{ flexShrink: 0, background: 'white', color: 'var(--c-cobalt-700)' }}>
              List Your Practice — Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
