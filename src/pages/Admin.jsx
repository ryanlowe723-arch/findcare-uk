import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, X, Search, Users, Clock, Trash2, Star, BadgeCheck, ExternalLink } from 'lucide-react'
import ReviewStars from '../components/ReviewStars'
import { notifyPractitionerApproved, notifyPractitionerRejected } from '../lib/notifications'

const REGISTER_LINKS = {
  GMC:  'https://www.gmc-uk.org/registration-and-licensing/the-medical-register',
  HCPC: 'https://www.hcpc-uk.org/check-the-register/',
  NMC:  'https://www.nmc.org.uk/registration/search-the-register/',
  GOsC: 'https://www.osteopathy.org.uk/register-search/',
  GCC:  'https://www.gcc-uk.org/check-the-register',
  BACP: 'https://www.bacp.co.uk/search/Register',
}

export default function Admin() {
  const [view, setView] = useState('pending')
  const [practitioners, setPractitioners] = useState([])
  const [pendingReviews, setPendingReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionInProgress, setActionInProgress] = useState(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from('practitioners').select('*').order('created_at', { ascending: false }),
      supabase.from('reviews').select('*, practitioners(name, title)').eq('status', 'pending').order('created_at'),
    ])
    setPractitioners(p || [])
    setPendingReviews(r || [])
    setLoading(false)
  }

  async function approve(p) {
    setActionInProgress(p.id)
    await supabase.from('practitioners').update({ status: 'approved' }).eq('id', p.id)
    notifyPractitionerApproved({ email: p.email, name: `${p.title} ${p.name}` })
    setPractitioners(prev => prev.map(x => x.id === p.id ? { ...x, status: 'approved' } : x))
    setActionInProgress(null)
  }

  async function reject(p) {
    setActionInProgress(p.id)
    await supabase.from('practitioners').update({ status: 'rejected' }).eq('id', p.id)
    notifyPractitionerRejected({ email: p.email, name: `${p.title} ${p.name}` })
    setPractitioners(prev => prev.map(x => x.id === p.id ? { ...x, status: 'rejected' } : x))
    setActionInProgress(null)
  }

  async function toggleVerified(p) {
    await supabase.from('practitioners').update({ is_verified: !p.is_verified }).eq('id', p.id)
    setPractitioners(prev => prev.map(x => x.id === p.id ? { ...x, is_verified: !p.is_verified } : x))
  }

  async function toggleFeatured(p) {
    await supabase.from('practitioners').update({ is_featured: !p.is_featured }).eq('id', p.id)
    setPractitioners(prev => prev.map(x => x.id === p.id ? { ...x, is_featured: !p.is_featured } : x))
  }

  async function deletePractitioner(id) {
    if (!window.confirm('Delete this practitioner listing? This cannot be undone.')) return
    setActionInProgress(id)
    await supabase.from('practitioners').delete().eq('id', id)
    setPractitioners(prev => prev.filter(p => p.id !== id))
    setActionInProgress(null)
  }

  async function moderateReview(reviewId, status) {
    await supabase.from('reviews').update({ status }).eq('id', reviewId)
    setPendingReviews(prev => prev.filter(r => r.id !== reviewId))
  }

  const pending  = practitioners.filter(p => p.status === 'pending')
  const approved = practitioners.filter(p => p.status === 'approved')

  const displayList = view === 'all'
    ? practitioners
    : practitioners.filter(p => p.status === view)

  const searchFiltered = displayList.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-top" style={{ minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--c-ink-900) 0%, var(--c-cobalt-700) 100%)', padding: 'var(--s-6) 0 var(--s-4)', color: 'white' }}>
        <div className="page-container">
          <div className="section-tag" style={{ color: 'rgba(255,255,255,0.5)' }}>Admin Panel</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.03em', marginTop: 4 }}>
            FindCare UK Directory
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 'var(--s-3)', marginTop: 'var(--s-4)', maxWidth: 620 }}>
            {[
              { label: 'Pending', value: pending.length },
              { label: 'Approved', value: approved.length },
              { label: 'Reviews to mod', value: pendingReviews.length },
              { label: 'Total', value: practitioners.length },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--r-md)', padding: '14px 16px' }}>
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
            { key: 'pending',  label: `Pending (${pending.length})` },
            { key: 'reviews',  label: `Review Moderation (${pendingReviews.length})` },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'all',      label: 'All' },
          ].map(({ key, label }) => (
            <button key={key} className={`tab-btn${view === key ? ' active' : ''}`} onClick={() => setView(key)} style={{ whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
        </div>

        {view === 'all' && (
          <div style={{ position: 'relative', maxWidth: 320, marginBottom: 'var(--s-3)' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 36, width: '100%' }}
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: 'var(--s-6)', textAlign: 'center', fontFamily: 'var(--font-data)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>LOADING...</div>
        ) : view === 'reviews' ? (
          /* ─── REVIEW MODERATION ─── */
          pendingReviews.length === 0 ? (
            <div className="empty-state" style={{ paddingBlock: 'var(--s-6)' }}>
              <Star size={36} className="empty-state-icon" />
              <h3>No reviews waiting</h3>
              <p>New patient reviews will appear here for approval before going live.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 700 }}>
              {pendingReviews.map(r => (
                <div key={r.id} style={{ border: '1px solid var(--surface-border)', borderRadius: 'var(--r-lg)', padding: 'var(--s-3)', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.reviewer_name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {' '}reviewing {r.practitioners?.title} {r.practitioners?.name}
                      </span>
                    </div>
                    <ReviewStars rating={r.rating} size={13} />
                  </div>
                  {r.comment && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                      "{r.comment}"
                    </p>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                    {r.reviewer_email} · {new Date(r.created_at).toLocaleDateString('en-GB')}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => moderateReview(r.id, 'approved')}>
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => moderateReview(r.id, 'rejected')}>
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : view === 'pending' ? (
          /* ─── PENDING APPLICATIONS ─── */
          pending.length === 0 ? (
            <div className="empty-state" style={{ paddingBlock: 'var(--s-6)' }}>
              <CheckCircle size={36} className="empty-state-icon" />
              <h3>All clear</h3>
              <p>No pending applications.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--s-3)' }}>
              {pending.map(p => (
                <div key={p.id} style={{
                  border: '1px solid var(--surface-border)', borderRadius: 'var(--r-lg)',
                  background: 'white', overflow: 'hidden', boxShadow: 'var(--card-shadow)',
                }}>
                  <div style={{ padding: 'var(--s-3)' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 'var(--s-2)' }}>
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--c-cobalt-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--c-cobalt-700)', fontSize: '1.2rem' }}>
                            {p.name?.[0] || '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>{p.title} {p.name}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                          {p.types?.map(t => <span key={t} className="type-badge">{t}</span>)}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {p.email} · {p.location_name || p.postcode}
                        </div>
                      </div>
                    </div>

                    {/* Credential check */}
                    {p.registration_number && (
                      <div style={{
                        background: 'var(--c-amber-50)', borderRadius: 'var(--r-md)',
                        padding: '10px 14px', marginBottom: 'var(--s-2)',
                        fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                      }}>
                        <span>
                          <strong>{p.registration_body}</strong> · {p.registration_number}
                        </span>
                        {REGISTER_LINKS[p.registration_body] && (
                          <a
                            href={REGISTER_LINKS[p.registration_body]}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--c-cobalt-700)', fontWeight: 600, flexShrink: 0 }}
                          >
                            Check register <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    )}

                    {p.bio && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--s-2)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                        {p.bio}
                      </p>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {p.accepts_nhs && <span className="nhs-badge">NHS</span>}
                      {p.accepts_private && <span className="type-badge">Private</span>}
                      {p.emergency_available && <span className="emergency-badge">Emergency</span>}
                    </div>
                  </div>

                  <div style={{ padding: '12px var(--s-3)', borderTop: '1px solid var(--surface-border)', display: 'flex', gap: 8 }}>
                    <button
                      className="btn-primary"
                      style={{ flex: 1, justifyContent: 'center', display: 'flex', gap: 6, opacity: actionInProgress === p.id ? 0.7 : 1 }}
                      onClick={() => approve(p)}
                      disabled={actionInProgress === p.id}
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      className="btn-danger"
                      style={{ flex: 1, justifyContent: 'center', display: 'flex', gap: 6, opacity: actionInProgress === p.id ? 0.7 : 1 }}
                      onClick={() => reject(p)}
                      disabled={actionInProgress === p.id}
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ─── TABLE for approved / rejected / all ─── */
          searchFiltered.length === 0 ? (
            <div className="empty-state" style={{ paddingBlock: 'var(--s-6)' }}>
              <Users size={36} className="empty-state-icon" />
              <h3>Nothing here</h3>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Practitioner</th>
                    <th>Types</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Verified</th>
                    <th>Featured</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {searchFiltered.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {p.title} {p.name}
                          {p.is_verified && <BadgeCheck size={14} style={{ color: 'var(--c-cobalt-100)' }} />}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.email}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {p.types?.map(t => <span key={t} className="type-badge">{t}</span>)}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{p.location_name || p.postcode}</td>
                      <td><span className={`status-pill status-${p.status}`}>{p.status}</span></td>
                      <td>
                        <label className="toggle-switch" style={{ transform: 'scale(0.85)' }}>
                          <input type="checkbox" checked={p.is_verified || false} onChange={() => toggleVerified(p)} />
                          <span className="toggle-slider" />
                        </label>
                      </td>
                      <td>
                        <label className="toggle-switch" style={{ transform: 'scale(0.85)' }}>
                          <input type="checkbox" checked={p.is_featured || false} onChange={() => toggleFeatured(p)} />
                          <span className="toggle-slider" />
                        </label>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {p.status !== 'approved' && (
                            <button
                              onClick={() => approve(p)}
                              disabled={actionInProgress === p.id}
                              style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-green)', padding: '4px 10px', border: '1.5px solid var(--c-green)', borderRadius: 'var(--r-sm)', background: 'transparent', cursor: 'pointer' }}
                            >
                              Approve
                            </button>
                          )}
                          {p.status !== 'rejected' && (
                            <button
                              onClick={() => reject(p)}
                              disabled={actionInProgress === p.id}
                              style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-amber)', padding: '4px 10px', border: '1.5px solid var(--c-amber)', borderRadius: 'var(--r-sm)', background: 'transparent', cursor: 'pointer' }}
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => deletePractitioner(p.id)}
                            disabled={actionInProgress === p.id}
                            style={{ color: 'var(--c-red)', padding: '4px 6px', background: 'transparent', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}
