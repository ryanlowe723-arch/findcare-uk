import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { resolveLocation } from '../lib/geo'
import {
  Plus, Trash2, CheckCircle, Calendar, User, Briefcase,
  Inbox, Star, Repeat, Mail, Phone,
} from 'lucide-react'
import ReviewStars from '../components/ReviewStars'

const TYPES = ['GP', 'Physiotherapist', 'Sports Medicine', 'Osteopath', 'Chiropractor', 'Psychologist', 'Nutritionist', 'Specialist']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function TagInput({ value, onChange, placeholder }) {
  const [input, setInput] = useState('')
  const add = (tag) => {
    const cleaned = tag.trim()
    if (cleaned && !value.includes(cleaned)) onChange([...value, cleaned])
    setInput('')
  }
  const remove = (tag) => onChange(value.filter(t => t !== tag))
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) }
    else if (e.key === 'Backspace' && !input && value.length) remove(value[value.length - 1])
  }
  return (
    <div className="tag-input-wrapper" onClick={e => e.currentTarget.querySelector('input')?.focus()}>
      {value.map(tag => (
        <span key={tag} className="tag-pill">
          {tag}
          <button type="button" onClick={() => remove(tag)}>×</button>
        </span>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} onBlur={() => { if (input) add(input) }} placeholder={value.length ? '' : placeholder} />
    </div>
  )
}

/** Generate dated slots from a weekly recurring template */
function generateSlotsFromSchedule(schedule, weeksAhead = 4) {
  const slots = []
  const today = new Date()
  for (let d = 0; d < weeksAhead * 7; d++) {
    const date = new Date(today)
    date.setDate(today.getDate() + d + 1) // start tomorrow
    if (date.getDay() !== schedule.day_of_week) continue

    const dateStr = date.toISOString().split('T')[0]
    const [sh, sm] = schedule.start_time.split(':').map(Number)
    const [eh, em] = schedule.end_time.split(':').map(Number)
    const startMins = sh * 60 + sm
    const endMins = eh * 60 + em

    for (let t = startMins; t + schedule.slot_minutes <= endMins; t += schedule.slot_minutes) {
      const fmt = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
      slots.push({
        date: dateStr,
        start_time: fmt(t),
        end_time: fmt(t + schedule.slot_minutes),
        appointment_type: schedule.appointment_type,
        price: schedule.price,
        is_emergency: false,
        is_booked: false,
      })
    }
  }
  return slots
}

export default function Dashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('profile')
  const [practitioner, setPractitioner] = useState(null)
  const [slots, setSlots] = useState([])
  const [bookings, setBookings] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [reviews, setReviews] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState(null)
  const [replyDrafts, setReplyDrafts] = useState({})
  const [generating, setGenerating] = useState(false)
  const [generateMsg, setGenerateMsg] = useState('')

  const [newSlot, setNewSlot] = useState({
    date: '', start_time: '', end_time: '',
    appointment_type: 'Consultation', price: 0, is_emergency: false,
  })

  const [newSchedule, setNewSchedule] = useState({
    day_of_week: 1, start_time: '09:00', end_time: '17:00',
    slot_minutes: 30, appointment_type: 'Consultation', price: 0,
  })

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: p } = await supabase
        .from('practitioners')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (p) {
        setPractitioner(p)
        setProfile({ ...p })

        const today = new Date().toISOString().split('T')[0]
        const [{ data: s }, { data: b }, { data: e }, { data: r }, { data: sch }] = await Promise.all([
          supabase.from('availability_slots').select('*').eq('practitioner_id', p.id).gte('date', today).order('date').order('start_time'),
          supabase.from('bookings').select('*, availability_slots(date, start_time, appointment_type)').eq('practitioner_id', p.id).order('created_at', { ascending: false }).limit(50),
          supabase.from('enquiries').select('*').eq('practitioner_id', p.id).order('created_at', { ascending: false }).limit(50),
          supabase.from('reviews').select('*').eq('practitioner_id', p.id).eq('status', 'approved').order('created_at', { ascending: false }),
          supabase.from('recurring_schedules').select('*').eq('practitioner_id', p.id).order('day_of_week'),
        ])

        setSlots(s || [])
        setBookings(b || [])
        setEnquiries(e || [])
        setReviews(r || [])
        setSchedules(sch || [])
      }
      setLoading(false)
    }
    load()
  }, [user])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)

    let geoUpdate = {}
    if (profile.postcode !== practitioner.postcode) {
      const geo = await resolveLocation(profile.postcode)
      if (geo) geoUpdate = { lat: geo.lat, lng: geo.lng, location_name: geo.display }
    }

    const { error } = await supabase
      .from('practitioners')
      .update({
        name: profile.name,
        title: profile.title,
        phone: profile.phone,
        bio: profile.bio,
        website: profile.website,
        types: profile.types,
        specialties: profile.specialties,
        qualifications: profile.qualifications,
        years_experience: profile.years_experience ? Number(profile.years_experience) : null,
        postcode: profile.postcode,
        accepts_nhs: profile.accepts_nhs,
        accepts_private: profile.accepts_private,
        emergency_available: profile.emergency_available,
        has_booking: profile.has_booking,
        offers_video: profile.offers_video,
        offers_home_visits: profile.offers_home_visits,
        languages: profile.languages,
        google_place_id: profile.google_place_id || null,
        trustpilot_url: profile.trustpilot_url || null,
        ...geoUpdate,
      })
      .eq('id', practitioner.id)

    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      setPractitioner({ ...practitioner, ...profile, ...geoUpdate })
    }
  }

  const handleAddSlot = async (e) => {
    e.preventDefault()
    if (!practitioner) return

    const { data, error } = await supabase.from('availability_slots').insert({
      practitioner_id: practitioner.id,
      date: newSlot.date,
      start_time: newSlot.start_time,
      end_time: newSlot.end_time,
      appointment_type: newSlot.appointment_type || 'Consultation',
      price: Math.round((newSlot.price || 0) * 100),
      is_emergency: newSlot.is_emergency,
      is_booked: false,
    }).select().single()

    if (!error && data) {
      setSlots(prev => [...prev, data].sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)))
      setNewSlot({ date: '', start_time: '', end_time: '', appointment_type: 'Consultation', price: 0, is_emergency: false })
    }
  }

  const handleDeleteSlot = async (slotId) => {
    await supabase.from('availability_slots').delete().eq('id', slotId)
    setSlots(prev => prev.filter(s => s.id !== slotId))
  }

  const handleAddSchedule = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase.from('recurring_schedules').insert({
      practitioner_id: practitioner.id,
      day_of_week: Number(newSchedule.day_of_week),
      start_time: newSchedule.start_time,
      end_time: newSchedule.end_time,
      slot_minutes: Number(newSchedule.slot_minutes),
      appointment_type: newSchedule.appointment_type,
      price: Math.round((newSchedule.price || 0) * 100),
    }).select().single()

    if (!error && data) {
      setSchedules(prev => [...prev, data].sort((a, b) => a.day_of_week - b.day_of_week))
    }
  }

  const handleDeleteSchedule = async (id) => {
    await supabase.from('recurring_schedules').delete().eq('id', id)
    setSchedules(prev => prev.filter(s => s.id !== id))
  }

  const handleGenerateSlots = async () => {
    if (!schedules.length) return
    setGenerating(true)
    setGenerateMsg('')

    // Build all slots from all schedules, skipping any that already exist
    const existing = new Set(slots.map(s => `${s.date}|${s.start_time.slice(0, 5)}`))
    const toInsert = []
    schedules.forEach(sch => {
      generateSlotsFromSchedule(sch).forEach(slot => {
        const key = `${slot.date}|${slot.start_time}`
        if (!existing.has(key)) {
          existing.add(key)
          toInsert.push({ ...slot, practitioner_id: practitioner.id })
        }
      })
    })

    if (toInsert.length === 0) {
      setGenerateMsg('All slots for the next 4 weeks already exist.')
      setGenerating(false)
      return
    }

    const { data, error } = await supabase.from('availability_slots').insert(toInsert).select()
    if (!error && data) {
      setSlots(prev => [...prev, ...data].sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)))
      setGenerateMsg(`Created ${data.length} slots for the next 4 weeks.`)
    } else {
      setGenerateMsg('Something went wrong — try again.')
    }
    setGenerating(false)
  }

  const handleCancelBooking = async (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId)
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
    if (booking?.slot_id) {
      await supabase.from('availability_slots').update({ is_booked: false }).eq('id', booking.slot_id)
    }
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
  }

  const handleMarkRead = async (enquiryId) => {
    await supabase.from('enquiries').update({ is_read: true }).eq('id', enquiryId)
    setEnquiries(prev => prev.map(e => e.id === enquiryId ? { ...e, is_read: true } : e))
  }

  const handleReply = async (reviewId) => {
    const reply = replyDrafts[reviewId]
    if (!reply?.trim()) return
    await supabase.from('reviews').update({ practitioner_reply: reply }).eq('id', reviewId)
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, practitioner_reply: reply } : r))
    setReplyDrafts(prev => ({ ...prev, [reviewId]: '' }))
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
      <div className="page-top" style={{ textAlign: 'center', padding: 'var(--s-12)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>No listing found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--s-4)' }}>Your practitioner listing hasn't been created yet.</p>
        <a href="/register" className="btn-primary" style={{ display: 'inline-flex' }}>Create your listing</a>
      </div>
    )
  }

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed')
  const unreadEnquiries = enquiries.filter(e => !e.is_read).length

  const STATS = [
    { label: 'Open slots', value: slots.filter(s => !s.is_booked).length },
    { label: 'Bookings', value: upcomingBookings.length },
    { label: 'Enquiries', value: unreadEnquiries, accent: unreadEnquiries > 0 },
    { label: 'Rating', value: practitioner.review_count > 0 ? Number(practitioner.avg_rating).toFixed(1) : '—' },
  ]

  return (
    <div className="page-top" style={{ minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--c-ink-900) 0%, var(--c-cobalt-700) 100%)', padding: 'var(--s-6) 0 var(--s-4)', color: 'white' }}>
        <div className="page-container">
          <div className="section-tag" style={{ color: 'rgba(255,255,255,0.5)' }}>Dashboard</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.03em', marginTop: 4, marginBottom: 4 }}>
            {practitioner.title} {practitioner.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
            <span className={`status-pill status-${practitioner.status}`}>{practitioner.status}</span>
            {practitioner.is_verified && <span className="status-pill status-approved">✓ Verified</span>}
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>{practitioner.types?.join(', ')}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 'var(--s-3)', marginTop: 'var(--s-4)' }}>
            {STATS.map(({ label, value, accent }) => (
              <div key={label} style={{ background: accent ? 'rgba(220,38,38,0.25)' : 'rgba(255,255,255,0.1)', borderRadius: 'var(--r-md)', padding: '14px 16px' }}>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', lineHeight: 1 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-12)' }}>
        <div className="tab-bar" style={{ overflowX: 'auto' }}>
          {[
            ['profile', 'Profile', User],
            ['availability', 'Availability', Calendar],
            ['bookings', 'Bookings', Briefcase],
            ['enquiries', `Enquiries${unreadEnquiries ? ` (${unreadEnquiries})` : ''}`, Inbox],
            ['reviews', 'Reviews', Star],
          ].map(([key, label, Icon]) => (
            <button
              key={key}
              className={`tab-btn${tab === key ? ' active' : ''}`}
              onClick={() => setTab(key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ─── PROFILE ─── */}
        {tab === 'profile' && profile && (
          <form onSubmit={handleSaveProfile} style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
            {saved && (
              <div className="alert alert-success">
                <CheckCircle size={16} />
                Profile updated successfully.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 'var(--s-2)' }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <select className="form-input" value={profile.title || ''} onChange={e => setProfile(p => ({ ...p, title: e.target.value }))}>
                  {['Dr', 'Mr', 'Mrs', 'Ms', 'Miss', 'Prof'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Full name</label>
                <input className="form-input" value={profile.name || ''} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-2)' }}>
              <div className="form-group">
                <label className="form-label">Phone number</label>
                <input className="form-input" value={profile.phone || ''} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Years experience</label>
                <input type="number" min="0" className="form-input" value={profile.years_experience || ''} onChange={e => setProfile(p => ({ ...p, years_experience: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" type="url" value={profile.website || ''} onChange={e => setProfile(p => ({ ...p, website: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Practitioner type(s)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {TYPES.map(t => (
                  <button key={t} type="button"
                    className={`filter-chip${profile.types?.includes(t) ? ' active' : ''}`}
                    onClick={() => setProfile(p => ({ ...p, types: p.types?.includes(t) ? p.types.filter(x => x !== t) : [...(p.types || []), t] }))}
                  >{t}</button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Conditions treated</label>
              <TagInput value={profile.specialties || []} onChange={v => setProfile(p => ({ ...p, specialties: v }))} placeholder="Add conditions..." />
            </div>

            <div className="form-group">
              <label className="form-label">Qualifications</label>
              <TagInput value={profile.qualifications || []} onChange={v => setProfile(p => ({ ...p, qualifications: v }))} placeholder="Add qualifications..." />
            </div>

            <div className="form-group">
              <label className="form-label">Professional bio</label>
              <textarea className="form-input form-textarea" value={profile.bio || ''} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Practice postcode</label>
              <input className="form-input" value={profile.postcode || ''} onChange={e => setProfile(p => ({ ...p, postcode: e.target.value }))} placeholder="SW1A 1AA" />
            </div>

            <div className="form-group">
              <label className="form-label">Google Place ID (shows your Google reviews)</label>
              <input className="form-input" value={profile.google_place_id || ''} onChange={e => setProfile(p => ({ ...p, google_place_id: e.target.value }))} placeholder="ChIJ..." />
            </div>

            <div className="form-group">
              <label className="form-label">Trustpilot URL</label>
              <input type="url" className="form-input" value={profile.trustpilot_url || ''} onChange={e => setProfile(p => ({ ...p, trustpilot_url: e.target.value }))} placeholder="https://uk.trustpilot.com/review/..." />
            </div>

            <div>
              {[
                { key: 'accepts_nhs',         label: 'Accept NHS patients' },
                { key: 'accepts_private',      label: 'Accept private patients' },
                { key: 'emergency_available',  label: 'Emergency / same-day slots available' },
                { key: 'offers_video',         label: 'Video consultations' },
                { key: 'offers_home_visits',   label: 'Home visits' },
                { key: 'has_booking',          label: 'Enable online booking' },
              ].map(({ key, label }) => (
                <div key={key} className="toggle-row">
                  <div className="toggle-label">{label}</div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={profile[key] || false} onChange={e => setProfile(p => ({ ...p, [key]: e.target.checked }))} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>

            <button type="submit" className="btn-primary" disabled={saving} style={{ alignSelf: 'flex-start', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}

        {/* ─── AVAILABILITY ─── */}
        {tab === 'availability' && (
          <div style={{ maxWidth: 760 }}>
            {/* Recurring weekly schedule */}
            <div style={{
              background: 'var(--c-cobalt-50)', border: '1px solid #c7d2fe',
              borderRadius: 'var(--r-lg)', padding: 'var(--s-4)', marginBottom: 'var(--s-5)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--s-2)' }}>
                <Repeat size={16} style={{ color: 'var(--c-cobalt-700)' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--c-cobalt-700)' }}>
                  Weekly recurring schedule
                </h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 'var(--s-3)' }}>
                Set your usual working hours once — we generate individual bookable slots for the next 4 weeks with one click.
              </p>

              {schedules.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 'var(--s-3)' }}>
                  {schedules.map(s => (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', background: 'white', borderRadius: 'var(--r-md)',
                      border: '1px solid var(--surface-border)', fontSize: '0.85rem',
                    }}>
                      <span>
                        <strong>{DAYS[s.day_of_week]}</strong> · {s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)} ·{' '}
                        {s.slot_minutes}min slots · {s.appointment_type}
                        {s.price > 0 && ` · £${(s.price / 100).toFixed(2)}`}
                      </span>
                      <button onClick={() => handleDeleteSchedule(s.id)} style={{ color: 'var(--c-red)', padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddSchedule} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 'var(--s-2)', marginBottom: 'var(--s-3)' }}>
                <div className="form-group">
                  <label className="form-label">Day</label>
                  <select className="form-input" value={newSchedule.day_of_week} onChange={e => setNewSchedule(s => ({ ...s, day_of_week: e.target.value }))}>
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">From</label>
                  <input type="time" className="form-input" value={newSchedule.start_time} onChange={e => setNewSchedule(s => ({ ...s, start_time: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">To</label>
                  <input type="time" className="form-input" value={newSchedule.end_time} onChange={e => setNewSchedule(s => ({ ...s, end_time: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Slot length</label>
                  <select className="form-input" value={newSchedule.slot_minutes} onChange={e => setNewSchedule(s => ({ ...s, slot_minutes: e.target.value }))}>
                    {[15, 20, 30, 45, 60].map(m => <option key={m} value={m}>{m} min</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price (£)</label>
                  <input type="number" min="0" step="0.01" className="form-input" value={newSchedule.price} onChange={e => setNewSchedule(s => ({ ...s, price: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn-secondary" style={{ justifyContent: 'center' }}>
                    <Plus size={13} /> Add
                  </button>
                </div>
              </form>

              <button
                className="btn-primary"
                onClick={handleGenerateSlots}
                disabled={generating || !schedules.length}
                style={{ opacity: generating || !schedules.length ? 0.6 : 1 }}
              >
                <Repeat size={14} />
                {generating ? 'Generating...' : 'Generate slots for next 4 weeks'}
              </button>
              {generateMsg && <p style={{ fontSize: '0.82rem', color: 'var(--c-green)', marginTop: 8 }}>{generateMsg}</p>}
            </div>

            {/* One-off slot */}
            <form onSubmit={handleAddSlot} style={{
              background: 'var(--surface-raised)', border: '1px solid var(--surface-border)',
              borderRadius: 'var(--r-lg)', padding: 'var(--s-4)', marginBottom: 'var(--s-5)',
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 'var(--s-3)', fontSize: '1rem' }}>Add one-off slot</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--s-2)' }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" required min={new Date().toISOString().split('T')[0]} value={newSlot.date} onChange={e => setNewSlot(s => ({ ...s, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start</label>
                  <input type="time" className="form-input" required value={newSlot.start_time} onChange={e => setNewSlot(s => ({ ...s, start_time: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">End</label>
                  <input type="time" className="form-input" required value={newSlot.end_time} onChange={e => setNewSlot(s => ({ ...s, end_time: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <input className="form-input" value={newSlot.appointment_type} onChange={e => setNewSlot(s => ({ ...s, appointment_type: e.target.value }))} placeholder="Consultation" />
                </div>
                <div className="form-group">
                  <label className="form-label">Price (£)</label>
                  <input type="number" min="0" step="0.01" className="form-input" value={newSlot.price} onChange={e => setNewSlot(s => ({ ...s, price: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', marginTop: 'var(--s-2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={newSlot.is_emergency} onChange={e => setNewSlot(s => ({ ...s, is_emergency: e.target.checked }))} />
                  Emergency slot
                </label>
                <button type="submit" className="btn-primary" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Plus size={14} /> Add Slot
                </button>
              </div>
            </form>

            {/* Slot list */}
            {slots.length === 0 ? (
              <div className="empty-state" style={{ paddingBlock: 'var(--s-6)' }}>
                <Calendar size={36} className="empty-state-icon" />
                <h3>No slots yet</h3>
                <p>Set a weekly schedule above and generate slots, or add a one-off slot.</p>
              </div>
            ) : (
              <div>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--s-2)' }}>
                  {slots.length} upcoming slot{slots.length !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
                  {slots.map(slot => (
                    <div key={slot.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', border: '1px solid var(--surface-border)',
                      borderRadius: 'var(--r-md)', background: slot.is_booked ? 'var(--surface-raised)' : 'white',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: '0.875rem' }}>
                        <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <span style={{ fontWeight: 600 }}>{slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{slot.appointment_type}</span>
                        {slot.price > 0 && <span style={{ color: 'var(--text-secondary)' }}>£{(slot.price / 100).toFixed(2)}</span>}
                        {slot.is_emergency && <span className="emergency-badge">Emergency</span>}
                        {slot.is_booked && <span className="nhs-badge">Booked</span>}
                      </div>
                      {!slot.is_booked && (
                        <button onClick={() => handleDeleteSlot(slot.id)} style={{ color: 'var(--c-red)', padding: 4 }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── BOOKINGS ─── */}
        {tab === 'bookings' && (
          <div style={{ maxWidth: 700 }}>
            {bookings.length === 0 ? (
              <div className="empty-state" style={{ paddingBlock: 'var(--s-6)' }}>
                <Briefcase size={36} className="empty-state-icon" />
                <h3>No bookings yet</h3>
                <p>Bookings from patients will appear here once you have published availability.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {bookings.map(booking => (
                  <div key={booking.id} style={{
                    border: '1px solid var(--surface-border)', borderRadius: 'var(--r-lg)',
                    padding: 'var(--s-3)', background: booking.status === 'cancelled' ? 'var(--surface-raised)' : 'white',
                    opacity: booking.status === 'cancelled' ? 0.6 : 1,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{booking.patient_name}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                          {booking.availability_slots?.appointment_type} ·{' '}
                          {booking.availability_slots?.date && new Date(booking.availability_slots.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                          {booking.availability_slots?.start_time && ` at ${booking.availability_slots.start_time.slice(0, 5)}`}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {booking.patient_email}{booking.patient_phone && ` · ${booking.patient_phone}`}
                        </div>
                        {booking.condition_notes && (
                          <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--surface-raised)', borderRadius: 'var(--r-md)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            "{booking.condition_notes}"
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`status-pill status-${booking.status === 'confirmed' ? 'approved' : 'rejected'}`}>
                          {booking.status}
                        </span>
                        {booking.status === 'confirmed' && (
                          <button className="btn-danger" onClick={() => handleCancelBooking(booking.id)}>Cancel</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── ENQUIRIES ─── */}
        {tab === 'enquiries' && (
          <div style={{ maxWidth: 700 }}>
            {enquiries.length === 0 ? (
              <div className="empty-state" style={{ paddingBlock: 'var(--s-6)' }}>
                <Inbox size={36} className="empty-state-icon" />
                <h3>No enquiries yet</h3>
                <p>When patients send you questions through your profile, they'll appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {enquiries.map(enq => (
                  <div key={enq.id} style={{
                    border: `1px solid ${enq.is_read ? 'var(--surface-border)' : 'var(--c-cobalt-100)'}`,
                    borderRadius: 'var(--r-lg)', padding: 'var(--s-3)',
                    background: enq.is_read ? 'white' : 'var(--c-cobalt-50)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {enq.sender_name}
                        {!enq.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-cobalt-700)' }} />}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(enq.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                      {enq.message}
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <a href={`mailto:${enq.sender_email}`} className="btn-secondary" style={{ padding: '7px 14px' }}>
                        <Mail size={13} /> Reply by email
                      </a>
                      {enq.sender_phone && (
                        <a href={`tel:${enq.sender_phone}`} className="btn-secondary" style={{ padding: '7px 14px' }}>
                          <Phone size={13} /> Call
                        </a>
                      )}
                      {!enq.is_read && (
                        <button onClick={() => handleMarkRead(enq.id)} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── REVIEWS ─── */}
        {tab === 'reviews' && (
          <div style={{ maxWidth: 700 }}>
            {reviews.length === 0 ? (
              <div className="empty-state" style={{ paddingBlock: 'var(--s-6)' }}>
                <Star size={36} className="empty-state-icon" />
                <h3>No reviews yet</h3>
                <p>Approved patient reviews will appear here — you can reply to each one.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
                {reviews.map(review => (
                  <div key={review.id} style={{ border: '1px solid var(--surface-border)', borderRadius: 'var(--r-lg)', padding: 'var(--s-3)', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{review.reviewer_name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(review.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <ReviewStars rating={review.rating} size={13} />
                    {review.comment && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 8 }}>
                        {review.comment}
                      </p>
                    )}

                    {review.practitioner_reply ? (
                      <div style={{
                        marginTop: 10, padding: '10px 14px', background: 'var(--surface-raised)',
                        borderLeft: '3px solid var(--c-cobalt-100)', borderRadius: '0 var(--r-md) var(--r-md) 0',
                        fontSize: '0.82rem', color: 'var(--text-secondary)',
                      }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Your reply:</strong> {review.practitioner_reply}
                      </div>
                    ) : (
                      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                        <input
                          className="form-input"
                          style={{ flex: 1, padding: '9px 12px', fontSize: '0.85rem' }}
                          placeholder="Write a public reply..."
                          value={replyDrafts[review.id] || ''}
                          onChange={e => setReplyDrafts(prev => ({ ...prev, [review.id]: e.target.value }))}
                        />
                        <button className="btn-secondary" onClick={() => handleReply(review.id)} style={{ flexShrink: 0 }}>
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
