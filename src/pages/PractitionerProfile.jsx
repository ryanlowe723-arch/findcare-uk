import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Phone, Globe, Mail, User, Zap, CheckCircle, Calendar, X,
  BadgeCheck, Share2, MessageSquare, Video, GraduationCap, Clock, Bell,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSeo, practitionerJsonLd } from '../lib/seo'
import ReviewStars from '../components/ReviewStars'
import ReviewsSection from '../components/ReviewsSection'
import ExternalReviews from '../components/ExternalReviews'
import EnquiryModal from '../components/EnquiryModal'
import FavouriteButton from '../components/FavouriteButton'
import { notifyBookingConfirmed } from '../lib/notifications'

function BookingModal({ slot, practitioner, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: booking, error: err } = await supabase.from('bookings').insert({
      slot_id: slot.id,
      practitioner_id: practitioner.id,
      patient_name: form.name,
      patient_email: form.email,
      patient_phone: form.phone || null,
      condition_notes: form.notes || null,
      status: 'confirmed',
    }).select().single()

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    await supabase.from('availability_slots').update({ is_booked: true }).eq('id', slot.id)

    // Fire-and-forget email notification (graceful if not configured)
    notifyBookingConfirmed({ booking, slot, practitioner })

    setLoading(false)
    onSuccess()
  }

  const timeStr = `${new Date(slot.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at ${slot.start_time.slice(0, 5)}`

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="modal-box"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">Book Appointment</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{
          padding: '12px 16px', background: 'var(--c-cobalt-50)',
          borderRadius: 'var(--r-md)', marginBottom: 'var(--s-3)', fontSize: '0.875rem',
        }}>
          <strong>{practitioner.title} {practitioner.name}</strong>
          <br />
          {slot.appointment_type} · {timeStr}
          {slot.price > 0 && <span> · £{(slot.price / 100).toFixed(2)}</span>}
          {slot.is_emergency && <span style={{ color: 'var(--c-red)', marginLeft: 6, fontWeight: 600 }}>Urgent slot</span>}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
          <div className="form-group">
            <label className="form-label">Your name *</label>
            <input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
          </div>
          <div className="form-group">
            <label className="form-label">Email address *</label>
            <input className="form-input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone number</label>
            <input className="form-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="07700 000000" />
          </div>
          <div className="form-group">
            <label className="form-label">Reason for appointment</label>
            <textarea className="form-input form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Brief description of your condition or concern..." />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', width: '100%', padding: '14px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Confirming...' : 'Confirm Booking'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

function WaitlistForm({ practitioner }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [joined, setJoined] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    await supabase.from('waitlist_entries').insert({
      practitioner_id: practitioner.id,
      patient_name: form.name,
      patient_email: form.email,
      patient_phone: form.phone || null,
      notes: form.notes || null,
    })
    setSubmitting(false)
    setJoined(true)
  }

  if (joined) {
    return (
      <div className="alert alert-success" style={{ maxWidth: 500 }}>
        <CheckCircle size={18} />
        <div>
          <strong>You're on the waitlist.</strong> {practitioner.title} {practitioner.name} will contact you when a slot opens up.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{
      maxWidth: 480, background: 'var(--surface-raised)', border: '1px solid var(--surface-border)',
      borderRadius: 'var(--r-lg)', padding: 'var(--s-4)',
      display: 'flex', flexDirection: 'column', gap: 'var(--s-3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Bell size={18} style={{ color: 'var(--c-cobalt-700)' }} />
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>Join the waitlist</h3>
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: -8 }}>
        No slots right now — leave your details and get notified when one opens.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-2)' }}>
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Email *</label>
          <input type="email" className="form-input" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Phone</label>
        <input type="tel" className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
      </div>
      <button type="submit" className="btn-primary" disabled={submitting} style={{ justifyContent: 'center' }}>
        {submitting ? 'Joining...' : 'Join Waitlist'}
      </button>
    </form>
  )
}

export default function PractitionerProfile() {
  const { id } = useParams()
  const [practitioner, setPractitioner] = useState(null)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('about')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [showEnquiry, setShowEnquiry] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from('practitioners').select('*').eq('id', id).single(),
        supabase
          .from('availability_slots')
          .select('*')
          .eq('practitioner_id', id)
          .eq('is_booked', false)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(40),
      ])
      setPractitioner(p)
      setSlots(s || [])
      setLoading(false)
    }
    load()
  }, [id])

  useSeo(practitioner ? {
    title: `${practitioner.title} ${practitioner.name} — ${practitioner.types?.join(', ')} in ${practitioner.location_name || 'UK'}`,
    description: practitioner.bio?.slice(0, 155) || `Book an appointment with ${practitioner.title} ${practitioner.name}, ${practitioner.types?.join(', ')} in ${practitioner.location_name}.`,
    path: `/practitioners/${id}`,
    type: 'profile',
    image: practitioner.photo_url,
    jsonLd: practitionerJsonLd(practitioner),
  } : { title: 'Practitioner Profile', path: `/practitioners/${id}` })

  const handleShare = async () => {
    const url = window.location.href
    const title = `${practitioner.title} ${practitioner.name} on FindCare UK`
    if (navigator.share) {
      try { await navigator.share({ title, url }) } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="page-top" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-data)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>LOADING...</div>
      </div>
    )
  }

  if (!practitioner) {
    return (
      <div className="page-top" style={{ textAlign: 'center', padding: 'var(--s-16)' }}>
        <h2>Practitioner not found</h2>
        <Link to="/search" className="btn-primary" style={{ marginTop: 'var(--s-3)', display: 'inline-flex' }}>Back to search</Link>
      </div>
    )
  }

  const p = practitioner

  const slotsByDate = slots.reduce((acc, s) => {
    acc[s.date] = acc[s.date] || []
    acc[s.date].push(s)
    return acc
  }, {})

  const formatDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

  const TABS = ['about', 'reviews', ...(p.has_booking ? ['availability'] : [])]

  return (
    <>
      {/* Hero */}
      <section className="profile-hero">
        <div className="page-container">
          <Link
            to="/search"
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 'var(--s-3)' }}
          >
            ← Back to search
          </Link>
          <div style={{ display: 'flex', gap: 'var(--s-4)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {p.photo_url ? (
              <img src={p.photo_url} alt={`${p.title} ${p.name}`} className="profile-photo-lg" />
            ) : (
              <div className="profile-photo-placeholder">
                <User size={48} strokeWidth={1} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', letterSpacing: '-0.03em',
                marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              }}>
                {p.title} {p.name}
                {p.is_verified && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: 'rgba(255,255,255,0.15)', padding: '4px 12px',
                    borderRadius: 999, fontSize: '0.7rem', fontFamily: 'var(--font-data)',
                    letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
                  }}>
                    <BadgeCheck size={13} /> Verified
                  </span>
                )}
              </h1>

              {p.review_count > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <ReviewStars rating={p.avg_rating} count={p.review_count} size={15} />
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 'var(--s-2)' }}>
                {p.types?.map(t => (
                  <span key={t} style={{
                    padding: '3px 10px', borderRadius: 2,
                    background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)',
                    fontFamily: 'var(--font-data)', fontSize: '0.7rem',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    {t}
                  </span>
                ))}
                {p.emergency_available && (
                  <span style={{
                    padding: '3px 10px', borderRadius: 2,
                    background: 'rgba(220,38,38,0.3)', color: '#fca5a5',
                    fontFamily: 'var(--font-data)', fontSize: '0.7rem',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Zap size={10} /> Emergency
                  </span>
                )}
                {p.offers_video && (
                  <span style={{
                    padding: '3px 10px', borderRadius: 2,
                    background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)',
                    fontFamily: 'var(--font-data)', fontSize: '0.7rem',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Video size={10} /> Video
                  </span>
                )}
              </div>

              {p.location_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                  <MapPin size={14} />
                  {p.location_name}
                  {p.postcode && ` · ${p.postcode.toUpperCase()}`}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {p.has_booking && slots.length > 0 && (
                <button
                  className="btn-primary btn-primary-lg"
                  style={{ background: 'white', color: 'var(--c-cobalt-700)' }}
                  onClick={() => setActiveTab('availability')}
                >
                  <Calendar size={16} />
                  Book Appointment
                </button>
              )}
              <button
                className="btn-secondary"
                style={{ border: '1.5px solid rgba(255,255,255,0.3)', color: 'white', background: 'rgba(255,255,255,0.1)' }}
                onClick={() => setShowEnquiry(true)}
              >
                <MessageSquare size={14} />
                Enquire
              </button>
              <button
                onClick={handleShare}
                aria-label="Share profile"
                style={{
                  width: 42, height: 42, borderRadius: 'var(--r-md)',
                  border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                }}
              >
                <Share2 size={16} />
              </button>
              <div style={{
                width: 42, height: 42, borderRadius: 'var(--r-md)',
                border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.95)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FavouriteButton practitionerId={p.id} size={17} />
              </div>
            </div>
          </div>
          {shareCopied && (
            <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
              ✓ Link copied to clipboard
            </div>
          )}
        </div>
      </section>

      {/* Tabs + content */}
      <div className="page-container" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-12)' }}>
        <div className="tab-bar">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`tab-btn${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'reviews' && p.review_count > 0 ? `Reviews (${p.review_count})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'about' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(0, 320px)', gap: 'var(--s-5)', alignItems: 'start' }} className="profile-about-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
              {p.bio && (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 10 }}>About</h2>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>{p.bio}</p>
                </div>
              )}

              {/* Credentials */}
              {(p.registration_body || p.qualifications?.length > 0 || p.years_experience) && (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 10 }}>Credentials</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {p.registration_body && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <BadgeCheck size={16} style={{ color: p.is_verified ? 'var(--c-green)' : 'var(--text-muted)', flexShrink: 0 }} />
                        <span>
                          {p.registration_body} registered
                          {p.registration_number && ` · ${p.registration_number}`}
                          {p.is_verified && <strong style={{ color: 'var(--c-green)', marginLeft: 6 }}>✓ Verified by FindCare</strong>}
                        </span>
                      </div>
                    )}
                    {p.years_experience > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <Clock size={16} style={{ color: 'var(--c-cobalt-100)', flexShrink: 0 }} />
                        {p.years_experience} years of experience
                      </div>
                    )}
                    {p.qualifications?.map(q => (
                      <div key={q} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <GraduationCap size={16} style={{ color: 'var(--c-cobalt-100)', flexShrink: 0 }} />
                        {q}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {p.specialties?.length > 0 && (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 10 }}>Conditions treated</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {p.specialties.map(s => (
                      <Link
                        key={s}
                        to={`/search?condition=${encodeURIComponent(s)}`}
                        style={{
                          padding: '5px 12px', border: '1.5px solid var(--surface-border)',
                          borderRadius: 999, fontSize: '0.82rem', color: 'var(--text-secondary)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {s}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {p.languages?.length > 0 && (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 10 }}>Languages</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{p.languages.join(', ')}</p>
                </div>
              )}

              {/* External reviews (Google / Trustpilot) */}
              <ExternalReviews practitioner={p} />
            </div>

            {/* Sidebar */}
            <div id="contact" style={{ background: 'var(--surface-raised)', border: '1px solid var(--surface-border)', borderRadius: 'var(--r-lg)', padding: 'var(--s-4)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 'var(--s-3)', fontSize: '0.95rem' }}>Contact & Info</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {p.phone && (
                  <a href={`tel:${p.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    <Phone size={15} style={{ color: 'var(--c-cobalt-100)', flexShrink: 0 }} />
                    {p.phone}
                  </a>
                )}
                {p.email && (
                  <a href={`mailto:${p.email}`} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    <Mail size={15} style={{ color: 'var(--c-cobalt-100)', flexShrink: 0 }} />
                    {p.email}
                  </a>
                )}
                {p.website && (
                  <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    <Globe size={15} style={{ color: 'var(--c-cobalt-100)', flexShrink: 0 }} />
                    Website
                  </a>
                )}
                {p.location_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={15} style={{ color: 'var(--c-cobalt-100)', flexShrink: 0 }} />
                    {p.location_name}
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.accepts_nhs && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--c-green)' }}>
                      <CheckCircle size={14} /> NHS accepted
                    </div>
                  )}
                  {p.accepts_private && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <CheckCircle size={14} style={{ color: 'var(--c-cobalt-100)' }} /> Private appointments
                    </div>
                  )}
                  {p.offers_video && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <Video size={14} style={{ color: 'var(--c-cobalt-100)' }} /> Video consultations
                    </div>
                  )}
                  {p.offers_home_visits && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <CheckCircle size={14} style={{ color: 'var(--c-cobalt-100)' }} /> Home visits
                    </div>
                  )}
                  {p.emergency_available && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--c-red)' }}>
                      <Zap size={14} /> Emergency slots available
                    </div>
                  )}
                </div>

                <button className="btn-primary" style={{ justifyContent: 'center', marginTop: 4 }} onClick={() => setShowEnquiry(true)}>
                  <MessageSquare size={14} />
                  Send Enquiry
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div style={{ maxWidth: 720 }}>
            <ReviewsSection practitionerId={p.id} practitionerName={`${p.title} ${p.name}`} />
          </div>
        )}

        {activeTab === 'availability' && (
          <div>
            {bookingSuccess ? (
              <div className="alert alert-success" style={{ maxWidth: 500 }}>
                <CheckCircle size={20} />
                <div>
                  <strong>Booking confirmed!</strong>
                  <div>Check your email for confirmation and cancellation details.</div>
                </div>
              </div>
            ) : slots.length === 0 ? (
              <div>
                <div className="empty-state" style={{ paddingBlock: 'var(--s-5)' }}>
                  <Calendar size={48} className="empty-state-icon" />
                  <h3>No slots available right now</h3>
                </div>
                <WaitlistForm practitioner={p} />
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--s-4)', fontSize: '0.9rem' }}>
                  Select an available slot to book your appointment.
                </p>
                {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                  <div key={date} style={{ marginBottom: 'var(--s-4)' }}>
                    <div style={{
                      fontFamily: 'var(--font-data)', fontSize: '0.75rem',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: 'var(--text-muted)', marginBottom: 10,
                    }}>
                      {formatDate(date)}
                    </div>
                    <div className="slot-grid">
                      {dateSlots.map(slot => (
                        <button
                          key={slot.id}
                          className={`slot-item${slot.is_emergency ? ' emergency' : ''}`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {slot.start_time.slice(0, 5)}
                          {slot.is_emergency && <div style={{ fontSize: '0.6rem', marginTop: 2 }}>URGENT</div>}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedSlot && (
          <BookingModal
            slot={selectedSlot}
            practitioner={p}
            onClose={() => setSelectedSlot(null)}
            onSuccess={() => {
              setSelectedSlot(null)
              setBookingSuccess(true)
              setSlots(prev => prev.filter(s => s.id !== selectedSlot.id))
            }}
          />
        )}
        {showEnquiry && (
          <EnquiryModal practitioner={p} onClose={() => setShowEnquiry(false)} />
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 800px) {
          .profile-about-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
