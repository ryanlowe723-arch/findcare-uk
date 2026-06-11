import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, X, Search, Users, Clock, Trash2 } from 'lucide-react'

export default function Admin() {
  const [view, setView] = useState('pending')
  const [practitioners, setPractitioners] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionInProgress, setActionInProgress] = useState(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const { data } = await supabase
      .from('practitioners')
      .select('*')
      .order('created_at', { ascending: false })
    setPractitioners(data || [])
    setLoading(false)
  }

  async function approve(id) {
    setActionInProgress(id)
    await supabase.from('practitioners').update({ status: 'approved' }).eq('id', id)
    setPractitioners(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p))
    setActionInProgress(null)
  }

  async function reject(id) {
    setActionInProgress(id)
    await supabase.from('practitioners').update({ status: 'rejected' }).eq('id', id)
    setPractitioners(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' } : p))
    setActionInProgress(null)
  }

  async function deletePractitioner(id) {
    if (!window.confirm('Delete this practitioner listing? This cannot be undone.')) return
    setActionInProgress(id)
    await supabase.from('practitioners').delete().eq('id', id)
    setPractitioners(prev => prev.filter(p => p.id !== id))
    setActionInProgress(null)
  }

  const pending  = practitioners.filter(p => p.status === 'pending')
  const approved = practitioners.filter(p => p.status === 'approved')
  const rejected = practitioners.filter(p => p.status === 'rejected')

  const filtered = practitioners
    .filter(p => view === 'all' || p.status === view.replace('all', ''))
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()))

  const displayList = view === 'pending'
    ? practitioners.filter(p => p.status === 'pending')
    : view === 'all'
    ? filtered
    : practitioners.filter(p => p.status === view)

  const searchFiltered = displayList.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-top" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--c-ink-900) 0%, var(--c-cobalt-700) 100%)', padding: 'var(--s-6) 0 var(--s-4)', color: 'white' }}>
        <div className="page-container">
          <div className="section-tag" style={{ color: 'rgba(255,255,255,0.5)' }}>Admin Panel</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.03em', marginTop: 4 }}>
            FindCare UK Directory
          </h1>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 'var(--s-3)', marginTop: 'var(--s-4)', maxWidth: 480 }}>
            {[
              { label: 'Pending', value: pending.length, icon: Clock },
              { label: 'Approved', value: approved.length, icon: CheckCircle },
              { label: 'Total', value: practitioners.length, icon: Users },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--r-md)', padding: '14px 16px' }}>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', lineHeight: 1 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-12)' }}>
        {/* Tabs */}
        <div className="tab-bar">
          {[
            { key: 'pending',  label: `Pending (${pending.length})` },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'all',      label: 'All' },
          ].map(({ key, label }) => (
            <button key={key} className={`tab-btn${view === key ? ' active' : ''}`} onClick={() => setView(key)}>
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        {view === 'all' && (
          <div style={{ position: 'relative', maxWidth: 320, marginBottom: 'var(--s-3)' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: 'var(--s-6)', textAlign: 'center', fontFamily: 'var(--font-data)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>LOADING...</div>
        ) : view === 'pending' ? (
          /* ─── PENDING: CARD LAYOUT ─── */
          pending.length === 0 ? (
            <div className="empty-state" style={{ paddingBlock: 'var(--s-6)' }}>
              <CheckCircle size={36} className="empty-state-icon" />
              <h3>All clear</h3>
              <p>No pending applications.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--s-3)' }}>
              {pending.map(p => (
                <div key={p.id} style={{
                  border: '1px solid var(--surface-border)',
                  borderRadius: 'var(--r-lg)',
                  background: 'white',
                  overflow: 'hidden',
                  boxShadow: 'var(--card-shadow)',
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
                      onClick={() => approve(p.id)}
                      disabled={actionInProgress === p.id}
                    >
                      <CheckCircle size={14} />
                      Approve
                    </button>
                    <button
                      className="btn-danger"
                      style={{ flex: 1, justifyContent: 'center', display: 'flex', gap: 6, opacity: actionInProgress === p.id ? 0.7 : 1 }}
                      onClick={() => reject(p.id)}
                      disabled={actionInProgress === p.id}
                    >
                      <X size={14} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ─── TABLE LAYOUT for approved / rejected / all ─── */
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {searchFiltered.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.title} {p.name}</div>
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
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {p.status !== 'approved' && (
                            <button
                              onClick={() => approve(p.id)}
                              disabled={actionInProgress === p.id}
                              style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-green)', padding: '4px 10px', border: '1.5px solid var(--c-green)', borderRadius: 'var(--r-sm)', background: 'transparent', cursor: 'pointer' }}
                            >
                              Approve
                            </button>
                          )}
                          {p.status !== 'rejected' && (
                            <button
                              onClick={() => reject(p.id)}
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
