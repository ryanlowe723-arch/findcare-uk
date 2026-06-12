import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Upload, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { resolveLocation } from '../lib/geo'
import { useSeo } from '../lib/seo'

const STEPS = ['Identity', 'Credentials', 'Practice', 'Location', 'Services']

const TYPES = ['GP', 'Physiotherapist', 'Sports Medicine', 'Osteopath', 'Chiropractor', 'Psychologist', 'Nutritionist', 'Specialist']
const TITLES = ['Dr', 'Mr', 'Mrs', 'Ms', 'Miss', 'Prof']
const LANGUAGES = ['English', 'Welsh', 'French', 'Spanish', 'Urdu', 'Punjabi', 'Hindi', 'Arabic', 'Polish', 'Bengali']
const REG_BODIES = ['GMC', 'HCPC', 'NMC', 'GOsC', 'GCC', 'BACP', 'BPS', 'AfN', 'Other']

function TagInput({ value, onChange, placeholder }) {
  const [input, setInput] = useState('')

  const add = (tag) => {
    const cleaned = tag.trim()
    if (cleaned && !value.includes(cleaned)) onChange([...value, cleaned])
    setInput('')
  }

  const remove = (tag) => onChange(value.filter(t => t !== tag))

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(input)
    } else if (e.key === 'Backspace' && !input && value.length) {
      remove(value[value.length - 1])
    }
  }

  return (
    <div className="tag-input-wrapper" onClick={e => e.currentTarget.querySelector('input').focus()}>
      {value.map(tag => (
        <span key={tag} className="tag-pill">
          {tag}
          <button type="button" onClick={() => remove(tag)}>×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input) add(input) }}
        placeholder={value.length ? '' : placeholder}
      />
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState({})

  useSeo({
    title: 'Join the Directory — Free Practitioner Listing',
    description: 'List your practice on FindCare UK for free. Reach patients searching for your specialty, manage bookings online, and grow your practice.',
    path: '/register',
  })

  const [form, setForm] = useState({
    // Identity
    title: 'Dr',
    name: '',
    email: '',
    password: '',
    phone: '',
    photo: null,
    photoPreview: null,
    // Credentials
    registration_body: 'HCPC',
    registration_number: '',
    qualifications: [],
    years_experience: '',
    // Practice
    types: [],
    specialties: [],
    bio: '',
    website: '',
    google_place_id: '',
    trustpilot_url: '',
    // Location
    postcode: '',
    location_name: '',
    lat: null,
    lng: null,
    locationResolved: false,
    // Services
    accepts_nhs: false,
    accepts_private: true,
    emergency_available: false,
    has_booking: false,
    offers_video: false,
    offers_home_visits: false,
    languages: ['English'],
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const validateStep = () => {
    const e = {}
    if (step === 0) {
      if (!form.name.trim()) e.name = 'Required'
      if (!form.email.trim()) e.email = 'Required'
      if (!form.password || form.password.length < 8) e.password = 'Minimum 8 characters'
    }
    if (step === 1) {
      if (!form.registration_number.trim()) e.registration_number = 'Required — we verify every practitioner'
    }
    if (step === 2) {
      if (!form.types.length) e.types = 'Select at least one type'
      if (!form.bio.trim()) e.bio = 'Required'
    }
    if (step === 3) {
      if (!form.postcode.trim()) e.postcode = 'Required'
      if (!form.locationResolved) e.postcode = 'Click Verify to confirm your postcode'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const resolvePostcode = async () => {
    const geo = await resolveLocation(form.postcode)
    if (geo) {
      setForm(f => ({
        ...f,
        lat: geo.lat,
        lng: geo.lng,
        location_name: geo.display,
        locationResolved: true,
      }))
      setErrors(e => ({ ...e, postcode: undefined }))
    } else {
      setErrors(e => ({ ...e, postcode: 'Could not find this postcode. Try a full UK postcode.' }))
    }
  }

  const handleNext = () => {
    if (validateStep()) setStep(s => s + 1)
  }

  const handleBack = () => setStep(s => s - 1)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep()) return
    setSubmitting(true)

    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (authErr) throw authErr

      const userId = authData.user?.id

      let photoUrl = null
      if (form.photo) {
        const ext = form.photo.name.split('.').pop()
        const path = `${userId}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('practitioner-photos')
          .upload(path, form.photo, { upsert: true })

        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('practitioner-photos')
            .getPublicUrl(path)
          photoUrl = urlData.publicUrl
        }
      }

      const { error: insertErr } = await supabase.from('practitioners').insert({
        user_id: userId,
        name: form.name,
        title: form.title,
        email: form.email,
        phone: form.phone || null,
        bio: form.bio || null,
        photo_url: photoUrl,
        website: form.website || null,
        registration_body: form.registration_body,
        registration_number: form.registration_number,
        qualifications: form.qualifications,
        years_experience: form.years_experience ? Number(form.years_experience) : null,
        types: form.types,
        specialties: form.specialties.map(s => s.toLowerCase()),
        postcode: form.postcode.toUpperCase(),
        location_name: form.location_name,
        lat: form.lat,
        lng: form.lng,
        accepts_nhs: form.accepts_nhs,
        accepts_private: form.accepts_private,
        emergency_available: form.emergency_available,
        has_booking: form.has_booking,
        offers_video: form.offers_video,
        offers_home_visits: form.offers_home_visits,
        languages: form.languages,
        google_place_id: form.google_place_id || null,
        trustpilot_url: form.trustpilot_url || null,
        status: 'pending',
      })

      if (insertErr) throw insertErr

      setDone(true)
    } catch (err) {
      setErrors({ submit: err.message })
    }

    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="page-top" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: 'var(--surface-raised)' }}>
        <div style={{ maxWidth: 500, marginInline: 'auto', padding: 'var(--s-4)', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--c-green-50)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            marginInline: 'auto', marginBottom: 'var(--s-3)',
          }}>
            <CheckCircle size={36} style={{ color: 'var(--c-green)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.03em', marginBottom: 12 }}>
            Application submitted!
          </h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--s-4)' }}>
            We're verifying your {form.registration_body} registration. You'll get an email at <strong>{form.email}</strong> once approved — usually within 24–48 hours.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary" style={{ marginInline: 'auto' }}>
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-top" style={{ minHeight: '100vh', background: 'var(--surface-raised)', padding: 'var(--s-8) 0' }}>
      <div style={{ maxWidth: 660, marginInline: 'auto', padding: '0 var(--s-4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--s-5)' }}>
          <div className="section-tag">Practitioner Registration</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', letterSpacing: '-0.03em', marginTop: 6 }}>
            Join FindCare UK — free
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Verified listings, online bookings, patient enquiries. Live within 24–48 hours.
          </p>
        </div>

        {/* Progress */}
        <div className="step-progress">
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div className="step-item">
                <div className={`step-num${i < step ? ' done' : i === step ? ' active' : ''}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`step-label${i < step ? ' done' : i === step ? ' active' : ''}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`step-line${i < step ? ' done' : ''}`} style={{ flex: 1 }} />}
            </div>
          ))}
        </div>

        {errors.submit && <div className="alert alert-error">{errors.submit}</div>}

        <div style={{ background: 'white', borderRadius: 'var(--r-lg)', padding: 'var(--s-5)', boxShadow: 'var(--card-shadow)', border: '1px solid var(--surface-border)' }}>
          <form onSubmit={step === STEPS.length - 1 ? handleSubmit : e => { e.preventDefault(); handleNext() }}>

            {/* Step 0: Identity */}
            {step === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>Your identity</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 'var(--s-2)' }}>
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <select className="form-input" value={form.title} onChange={e => set('title', e.target.value)}>
                      {TITLES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Full name *</label>
                    <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" />
                    {errors.name && <span className="form-error">{errors.name}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email address *</label>
                  <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input type="password" className="form-input" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Minimum 8 characters" />
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone number</label>
                  <input type="tel" className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="07700 000000" />
                </div>

                <div className="form-group">
                  <label className="form-label">Profile photo</label>
                  {form.photoPreview ? (
                    <div style={{ position: 'relative', width: 100 }}>
                      <img src={form.photoPreview} alt="Preview" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--surface-border)' }} />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, photo: null, photoPreview: null }))}
                        style={{
                          position: 'absolute', top: -4, right: -4,
                          width: 22, height: 22, borderRadius: '50%',
                          background: 'var(--c-red)', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '14px 16px',
                      border: '1.5px dashed var(--surface-border)',
                      borderRadius: 'var(--r-md)',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: '0.875rem',
                    }}>
                      <Upload size={18} />
                      Upload photo — listings with photos get 3× more clicks
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files[0]
                          if (file) {
                            setForm(f => ({ ...f, photo: file, photoPreview: URL.createObjectURL(file) }))
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Credentials */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>Professional credentials</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: -8 }}>
                  We verify every practitioner against their professional register before listing — this is what makes FindCare trusted.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 'var(--s-2)' }}>
                  <div className="form-group">
                    <label className="form-label">Register *</label>
                    <select className="form-input" value={form.registration_body} onChange={e => set('registration_body', e.target.value)}>
                      {REG_BODIES.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Registration number *</label>
                    <input className="form-input" value={form.registration_number} onChange={e => set('registration_number', e.target.value)} placeholder="e.g. PH123456" />
                    {errors.registration_number && <span className="form-error">{errors.registration_number}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Qualifications</label>
                  <TagInput
                    value={form.qualifications}
                    onChange={v => set('qualifications', v)}
                    placeholder="e.g. BSc (Hons) Physiotherapy — press Enter to add"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Years of experience</label>
                  <input type="number" min="0" max="60" className="form-input" style={{ maxWidth: 160 }} value={form.years_experience} onChange={e => set('years_experience', e.target.value)} placeholder="e.g. 10" />
                </div>
              </div>
            )}

            {/* Step 2: Practice */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>Your practice</h2>

                <div className="form-group">
                  <label className="form-label">Practitioner type(s) *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {TYPES.map(t => (
                      <button
                        key={t}
                        type="button"
                        className={`filter-chip${form.types.includes(t) ? ' active' : ''}`}
                        onClick={() => {
                          set('types', form.types.includes(t)
                            ? form.types.filter(x => x !== t)
                            : [...form.types, t]
                          )
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {errors.types && <span className="form-error">{errors.types}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Conditions & specialties</label>
                  <TagInput
                    value={form.specialties}
                    onChange={v => set('specialties', v)}
                    placeholder="Type a condition and press Enter (e.g. knee injury, back pain...)"
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    These power patient search — add every condition you treat
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Professional bio *</label>
                  <textarea
                    className="form-input form-textarea"
                    style={{ minHeight: 120 }}
                    value={form.bio}
                    onChange={e => set('bio', e.target.value)}
                    placeholder="Describe your background, experience, and approach to patient care..."
                  />
                  {errors.bio && <span className="form-error">{errors.bio}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Practice website</label>
                  <input type="url" className="form-input" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://your-practice.co.uk" />
                </div>

                <div className="form-group">
                  <label className="form-label">Google Business Profile (optional)</label>
                  <input className="form-input" value={form.google_place_id} onChange={e => set('google_place_id', e.target.value)} placeholder="Google Place ID — shows your Google reviews on your profile" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Find yours at developers.google.com/maps/documentation/places/web-service/place-id
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Trustpilot page (optional)</label>
                  <input type="url" className="form-input" value={form.trustpilot_url} onChange={e => set('trustpilot_url', e.target.value)} placeholder="https://uk.trustpilot.com/review/your-practice.co.uk" />
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>Your location</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  We use your postcode to show patients in your area how far you are from them.
                </p>

                <div className="form-group">
                  <label className="form-label">Practice postcode *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="form-input"
                      style={{ flex: 1 }}
                      value={form.postcode}
                      onChange={e => setForm(f => ({ ...f, postcode: e.target.value, locationResolved: false }))}
                      placeholder="SW1A 1AA"
                    />
                    <button type="button" className="btn-secondary" onClick={resolvePostcode} style={{ flexShrink: 0 }}>
                      Verify
                    </button>
                  </div>
                  {errors.postcode && <span className="form-error">{errors.postcode}</span>}
                  {form.locationResolved && (
                    <div className="alert alert-success" style={{ marginTop: 8, padding: '10px 14px' }}>
                      <CheckCircle size={16} />
                      Location confirmed: <strong>{form.location_name}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Services */}
            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>Services & availability</h2>

                <div>
                  {[
                    ['accepts_nhs', 'NHS appointments', 'I accept NHS-funded or NHS-referred patients'],
                    ['accepts_private', 'Private appointments', 'I accept self-paying / privately-insured patients'],
                    ['emergency_available', 'Emergency / same-day slots', 'I can accommodate urgent appointments'],
                    ['offers_video', 'Video consultations', 'I offer remote video appointments'],
                    ['offers_home_visits', 'Home visits', 'I can visit patients at home'],
                    ['has_booking', 'Enable online booking', 'Patients can book appointments directly through your profile'],
                  ].map(([key, label, desc]) => (
                    <div key={key} className="toggle-row">
                      <div>
                        <div className="toggle-label">{label}</div>
                        <div className="toggle-desc">{desc}</div>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">Languages spoken</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang}
                        type="button"
                        className={`filter-chip${form.languages.includes(lang) ? ' active' : ''}`}
                        onClick={() => {
                          set('languages', form.languages.includes(lang)
                            ? form.languages.filter(l => l !== lang)
                            : [...form.languages, lang]
                          )
                        }}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="alert alert-info" style={{ marginTop: 8 }}>
                  By submitting, you confirm all information is accurate and you hold the registrations stated. We check every registration number before approval.
                </div>
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', gap: 10, marginTop: 'var(--s-5)', justifyContent: 'space-between' }}>
              {step > 0 ? (
                <button type="button" className="btn-secondary" onClick={handleBack}>Back</button>
              ) : <div />}
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ opacity: submitting ? 0.7 : 1 }}
              >
                {step === STEPS.length - 1
                  ? (submitting ? 'Submitting...' : 'Submit Application')
                  : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
