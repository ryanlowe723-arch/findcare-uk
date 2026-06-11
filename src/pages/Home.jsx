import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, MapPin, Zap, Users, Shield, Clock, ChevronRight } from 'lucide-react'
import PractitionerCard from '../components/PractitionerCard'
import { supabase } from '../lib/supabase'

const QUICK_FILTERS = [
  'Physiotherapist', 'GP', 'Sports Medicine', 'Osteopath', 'Chiropractor', 'Psychologist',
]

const HOW_IT_WORKS = [
  { icon: Search, title: 'Describe your concern', body: 'Tell us your injury, condition, or what you need help with.' },
  { icon: MapPin, title: 'Set your location', body: 'Enter your postcode or town — we find practitioners near you.' },
  { icon: Users, title: 'Browse & book', body: 'Compare profiles, check availability, and book directly online.' },
]

const TRUST_ITEMS = [
  { icon: Shield, label: 'Verified practitioners' },
  { icon: Zap,    label: 'Emergency slots available' },
  { icon: Clock,  label: 'Real-time availability' },
]

export default function Home() {
  const navigate = useNavigate()
  const [condition, setCondition] = useState('')
  const [location, setLocation] = useState('')
  const [featured, setFeatured] = useState(null)

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
              Search by condition or injury, filter by location and availability — including
              emergency&nbsp;slots.
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
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--r-md)',
                  background: 'var(--c-cobalt-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--s-2)',
                  color: 'var(--c-cobalt-700)',
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

      {/* ── FEATURED PRACTITIONERS ── */}
      {featured && featured.length > 0 && (
        <section style={{ padding: 'var(--s-10) 0', background: 'var(--surface-raised)', borderTop: '1px solid var(--surface-border)' }}>
          <div className="page-container">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'var(--s-5)', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div className="section-tag">Featured</div>
                <h2 className="section-title" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>Top practitioners</h2>
              </div>
              <a href="/search" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--c-cobalt-700)', fontWeight: 600, fontSize: '0.875rem' }}>
                View all <ChevronRight size={16} />
              </a>
            </div>
            <div className="practitioners-grid">
              {featured.map(p => <PractitionerCard key={p.id} practitioner={p} />)}
            </div>
          </div>
        </section>
      )}

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
                Join the directory, set your availability, and let patients in your area find and book with you directly.
              </p>
            </div>
            <a href="/register" className="btn-primary btn-primary-lg" style={{ flexShrink: 0, background: 'white', color: 'var(--c-cobalt-700)' }}>
              List Your Practice
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
