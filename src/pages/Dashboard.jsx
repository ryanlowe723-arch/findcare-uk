import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { resolveLocation } from '../lib/geo'
import { Plus, Trash2, CheckCircle, Calendar, User, Briefcase } from 'lucide-react'

const TYPES = ['GP', 'Physiotherapist', 'Sports Medicine', 'Osteopath', 'Chiropractor', 'Psychologist', 'Nutritionist', 'Specialist']

function TagInput({ value, onChange, placeholder }) {
  const [input, setInput] = useState('')
  const add = (tag) => {
    const cleaned = tag.trim().toLowerCase()
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

export default function Dashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('profile')
  const [practitioner, setPractitioner] = useState(null)
  const [slots, setSlots] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState(null)

  // Slot form state
  const [newSlot, setNewSlot] = useState({
    date: '',
    start_time: '',
    end_time: '',
    appointment_type: 'Consultation',
    price: 0,
    is_emergency: false,
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

        const [{ data: s }, { data: b }] = await Promise.all([
          supabase.from('availability_slots').select('*').eq('practitioner_id', p.id).gte('date', new Date().toISOString().split('T')[0]).order('date').order('start_time'),
          supabase.from('bookings').select('*, availability_slots(date, start_time, appointment_type)').eq('practitioner_id', p.id).order('created_at', { ascending: false }).limit(50),
        ])

        setSlots(s || [])
        setBookings(b || [])
      }
      setLoading(false)
    }
    load()
  }, [user])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)

    // Re-resolve postcode if changed
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
        postcode: profile.postcode,
        accepts_nhs: profile.accepts_nhs,
        accepts_private: profile.accepts_private,
        emergency_available: profile.emergency_available,
        has_booking: profile.has_booking,
        languages: profile.languages,
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

  const handleCancelBooking = async (bookingId) => {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
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

  return (
    <div className="page-top" style={{ minHeight: '100vh' }}>
      {/* Dashboard header */}
      <div style={{ background: 'linear-gradient(135deg, var(--c-ink-900) 0%, var(--c-cobalt-700) 100%)', padding: 'var(--s-6) 0 var(--s-4)', color: 'white' }}>
        <div className="page-container">
          <div className="section-tag" style={{ color: 'rgba(255,255,255,0.5)' }}>Dashboard</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.03em', marginTop: 4, marginBottom: 4 }}>
            {practitioner.title} {practitioner.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
            <span className={`status-pill status-${practitioner.status}`}>{practitioner.status}</span>
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>{practitioner.types?.join(', ')}</span>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--s-3)', marginTop: 'var(--s-4)' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--r-md)', padding: '14px 16px' }}>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>Open slots</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', lineHeight: 1 }}>{slots.filter(s => !s.is_booked).length}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--r-md)', padding: '14px 16px' }}>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>Confirmed bookings</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', lineHeight: 1 }}>{upcomingBookings.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-12)' }}>
        <div className="tab-bar">
          {[['profile', 'Profile', User], ['availability', 'Availability', Calendar], ['bookings', 'Bookings', Briefcase]].map(([key, label, Icon]) => (
            <button
              key={key}
              className={`tab-btn${tab === key ? ' active' : ''}`}
              onClick={() => setTab(key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ─── PROFILE TAB ─── */}
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

            <div className="form-group">
              <label className="form-label">Phone number</label>
              <input className="form-input" value={profile.phone || ''} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
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
              <label className="form-label">Professional bio</label>
              <textarea className="form-input form-textarea" value={profile.bio || ''} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Practice postcode</label>
              <input className="form-input" value={profile.postcode || ''} onChange={e => setProfile(p => ({ ...p, postcode: e.target.value }))} placeholder="SW1A 1AA" />
            </div>

            <div>
              {[
                { key: 'accepts_nhs',         label: 'Accept NHS patients' },
                { key: 'accepts_private',      label: 'Accept private patients' },
                { key: 'emergency_available',  label: 'Emergency / same-day slots available' },
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

        {/* ─── AVAILABILITY TAB ─── */}
        {tab === 'availability' && (
          <div style={{ maxWidth: 700 }}>
            <form onSubmit={handleAddSlot} style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--surface-border)',
              borderRadius: 'var(--r-lg)',
              padding: 'var(--s-4)',
              marginBottom: 'var(--s-5)',
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 'var(--s-3)', fontSize: '1rem' }}>Add new slot</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--s-2)' }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" required min={new Date().toISOString().split('T')[0]} value={newSlot.date} onChange={e => setNewSlot(s => ({ ...s, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start time</label>
                  <input type="time" className="form-input" required value={newSlot.start_time} onChange={e => setNewSlot(s => ({ ...s, start_time: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">End time</label>
                  <input type="time" className="form-input" required value={newSlot.end_time} onChange={e => setNewSlot(s => ({ ...s, end_time: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <input className="form-input" value={newSlot.appointment_type} onChange={e => setNewSlot(s => ({ ...s, appointment_type: e.target.value }))} placeholder="Consultation" />
                </div>
                <div className="form-group">
                  <label className="form-label">Price (£)</label>
                  <input type="number" min="0" step="0.01" className="form-input" value={newSlot.price} onChange={e => setNewSlot(s => ({ ...s, price: parseFloat(e.target.value) || 0 }))} placeholder="0 = Free/NHS" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', marginTop: 'var(--s-2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={newSlot.is_emergency} onChange={e => setNewSlot(s => ({ ...s, is_emergency: e.target.checked }))} />
                  Emergency slot
                </label>
                <button type="submit" className="btn-primary" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Plus size={14} />
                  Add Slot
                </button>
              </div>
            </form>

            {slots.length === 0 ? (
              <div className="empty-state" style={{ paddingBlock: 'var(--s-6)' }}>
                <Calendar size={36} className="empty-state-icon" />
                <h3>No slots yet</h3>
                <p>Add your first available appointment slot above.</p>
              </div>
            ) : (
              <div>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--s-2)' }}>
                  {slots.length} upcoming slot{slots.length !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {slots.map(slot => (
                    <div key={slot.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      border: '1px solid var(--surface-border)',
                      borderRadius: 'var(--r-md)',
                      background: slot.is_booked ? 'var(--surface-raised)' : 'white',
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

        {/* ─── BOOKINGS TAB ─── */}
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
                    border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--r-lg)',
                    padding: 'var(--s-3)',
                    background: booking.status === 'cancelled' ? 'var(--surface-raised)' : 'white',
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
                          {booking.patient_email} · {booking.patient_phone}
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
      </div>
    </div>
  )
}
