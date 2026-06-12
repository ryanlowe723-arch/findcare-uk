import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, AlertTriangle, ArrowLeft, ArrowRight, Stethoscope } from 'lucide-react'
import { BODY_AREAS, PROBLEMS } from '../lib/triage'
import { useSeo, faqJsonLd } from '../lib/seo'

export default function SymptomChecker() {
  const navigate = useNavigate()
  const [area, setArea] = useState(null)
  const [problem, setProblem] = useState(null)
  const [location, setLocation] = useState('')

  useSeo({
    title: 'Symptom Checker — Which Specialist Should You See?',
    description:
      'Not sure whether you need a physio, osteopath, GP, or sports medicine doctor? Answer two quick questions and we\'ll match you with the right type of practitioner near you.',
    path: '/symptom-checker',
    jsonLd: faqJsonLd([
      { q: 'Should I see a physiotherapist or an osteopath for back pain?', a: 'Both treat mechanical back pain effectively. Physiotherapists focus on exercise-based rehabilitation; osteopaths use more hands-on manual therapy. For most acute back pain, choose based on availability and patient reviews.' },
      { q: 'Which specialist treats knee injuries?', a: 'Sudden sports injuries with swelling are best assessed by a sports medicine doctor, who can diagnose ligament or meniscus damage. Gradual-onset knee pain is usually treated first by a physiotherapist.' },
      { q: 'When should I go to A&E instead of booking an appointment?', a: 'Go to A&E for chest pain, breathing difficulty, signs of stroke, heavy bleeding, loss of bladder or bowel control with back pain, or any rapidly worsening symptoms after a head injury.' },
    ]),
  })

  const step = problem ? 2 : area ? 1 : 0

  const handleFindPractitioners = () => {
    const params = new URLSearchParams()
    if (problem.keywords) params.set('condition', problem.keywords)
    if (location) params.set('location', location)
    if (problem.types?.length === 1) params.set('type', problem.types[0])
    if (problem.emergency) params.set('emergency', '1')
    navigate(`/search?${params.toString()}`)
  }

  return (
    <div className="page-top" style={{ minHeight: '100vh', background: 'var(--surface-raised)' }}>
      <div style={{ maxWidth: 720, marginInline: 'auto', padding: 'var(--s-8) var(--s-4) var(--s-12)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--s-6)' }}>
          <div className="section-tag">Symptom Checker</div>
          <h1 className="section-title" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)' }}>
            Find the right specialist
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 10, maxWidth: '48ch', marginInline: 'auto' }}>
            Two quick questions — we'll point you to the type of practitioner best suited to your problem.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 'var(--s-5)' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i <= step ? 'var(--c-cobalt-700)' : 'var(--c-ink-100)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: body area */}
          {step === 0 && (
            <motion.div key="area" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 'var(--s-3)', textAlign: 'center' }}>
                Where's the problem?
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                {BODY_AREAS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setArea(a)}
                    style={{
                      background: 'white', border: '1.5px solid var(--surface-border)',
                      borderRadius: 'var(--r-lg)', padding: 'var(--s-3)', textAlign: 'center',
                      cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-cobalt-100)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--surface-border)'; e.currentTarget.style.transform = 'none' }}
                  >
                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{a.emoji}</div>
                    {a.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: problem */}
          {step === 1 && (
            <motion.div key="problem" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setArea(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 'var(--s-3)' }}>
                <ArrowLeft size={14} /> Back
              </button>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 'var(--s-3)', textAlign: 'center' }}>
                {area.emoji} What best describes it?
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PROBLEMS[area.id].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setProblem(p)}
                    style={{
                      background: 'white', border: '1.5px solid var(--surface-border)',
                      borderRadius: 'var(--r-md)', padding: '16px 20px', textAlign: 'left',
                      cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.925rem',
                      color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--c-cobalt-100)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--surface-border)'}
                  >
                    {p.label}
                    <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: result */}
          {step === 2 && (
            <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setProblem(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 'var(--s-3)' }}>
                <ArrowLeft size={14} /> Back
              </button>

              {problem.redFlag && (
                <div className="alert alert-error" style={{ alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div><strong>Important:</strong> {problem.redFlag}</div>
                </div>
              )}

              <div style={{ background: 'white', borderRadius: 'var(--r-lg)', padding: 'var(--s-5)', boxShadow: 'var(--card-shadow)', border: '1px solid var(--surface-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--s-3)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'var(--c-cobalt-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-cobalt-700)', flexShrink: 0 }}>
                    <Stethoscope size={22} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      {problem.emergency ? 'Urgent care' : 'Recommended'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>
                      {problem.emergency ? 'Emergency & same-day practitioners' : problem.types.join(' or ')}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 'var(--s-4)' }}>
                  {problem.advice}
                </p>

                <div className="form-group" style={{ marginBottom: 'var(--s-3)' }}>
                  <label className="form-label">Your postcode or town</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      className="form-input"
                      style={{ paddingLeft: 40, width: '100%' }}
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. SW1A 1AA or Manchester"
                    />
                  </div>
                </div>

                <button onClick={handleFindPractitioners} className="btn-primary btn-primary-lg" style={{ width: '100%', justifyContent: 'center' }}>
                  Find practitioners near me
                  <ArrowRight size={16} />
                </button>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--s-3)', lineHeight: 1.6 }}>
                This tool offers general guidance only and is not a medical diagnosis.
                Always seek professional advice for your specific situation.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
