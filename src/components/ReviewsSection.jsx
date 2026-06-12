import { useState, useEffect } from 'react'
import { MessageSquare, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ReviewStars from './ReviewStars'

export default function ReviewsSection({ practitionerId, practitionerName }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', rating: 0, comment: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase
      .from('reviews')
      .select('*')
      .eq('practitioner_id', practitionerId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews(data || [])
        setLoading(false)
      })
  }, [practitionerId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.rating) { setError('Please select a star rating.'); return }
    setSubmitting(true)
    setError('')

    const { error: err } = await supabase.from('reviews').insert({
      practitioner_id: practitionerId,
      reviewer_name: form.name,
      reviewer_email: form.email,
      rating: form.rating,
      comment: form.comment || null,
      status: 'pending',
    })

    setSubmitting(false)
    if (err) { setError(err.message); return }
    setSubmitted(true)
    setShowForm(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s-4)', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>
          Patient reviews {reviews.length > 0 && `(${reviews.length})`}
        </h2>
        {!submitted && (
          <button className="btn-secondary" onClick={() => setShowForm(!showForm)}>
            <MessageSquare size={14} />
            Write a review
          </button>
        )}
      </div>

      {submitted && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <div>
            <strong>Thank you!</strong> Your review has been submitted and will appear once approved by our moderation team.
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: 'var(--surface-raised)', border: '1px solid var(--surface-border)',
          borderRadius: 'var(--r-lg)', padding: 'var(--s-4)', marginBottom: 'var(--s-4)',
          display: 'flex', flexDirection: 'column', gap: 'var(--s-3)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>
            Review {practitionerName}
          </h3>

          {error && <div className="alert alert-error" style={{ marginBottom: 0 }}>{error}</div>}

          <div className="form-group">
            <label className="form-label">Your rating *</label>
            <ReviewStars rating={form.rating} size={26} interactive onChange={r => setForm(f => ({ ...f, rating: r }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-2)' }}>
            <div className="form-group">
              <label className="form-label">Your name *</label>
              <input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email * <span style={{ textTransform: 'none', fontWeight: 400 }}>(not published)</span></label>
              <input type="email" className="form-input" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Your experience</label>
            <textarea className="form-input form-textarea" value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} placeholder="How was your appointment? Would you recommend them?" />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting} style={{ alignSelf: 'flex-start', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-data)', fontSize: '0.8rem' }}>LOADING...</div>
      ) : reviews.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No reviews yet — be the first to share your experience.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
          {reviews.map(review => (
            <div key={review.id} style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: 'var(--s-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
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
              {review.practitioner_reply && (
                <div style={{
                  marginTop: 10, marginLeft: 16, padding: '10px 14px',
                  background: 'var(--surface-raised)', borderLeft: '3px solid var(--c-cobalt-100)',
                  borderRadius: '0 var(--r-md) var(--r-md) 0', fontSize: '0.82rem', color: 'var(--text-secondary)',
                }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Reply from {practitionerName}:</strong>
                  <br />
                  {review.practitioner_reply}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
