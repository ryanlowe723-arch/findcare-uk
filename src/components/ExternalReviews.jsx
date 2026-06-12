import { useState, useEffect } from 'react'
import { ExternalLink, Star } from 'lucide-react'
import ReviewStars from './ReviewStars'

/**
 * Shows the practitioner's Google Business Profile reviews (live via
 * /api/google-reviews) and a Trustpilot link card when configured.
 * Renders nothing if the practitioner has neither.
 */
export default function ExternalReviews({ practitioner }) {
  const { google_place_id, trustpilot_url } = practitioner
  const [google, setGoogle] = useState(null)
  const [loading, setLoading] = useState(!!google_place_id)

  useEffect(() => {
    if (!google_place_id) return
    fetch(`/api/google-reviews?place_id=${encodeURIComponent(google_place_id)}`)
      .then(r => r.json())
      .then(data => {
        if (data?.configured && data.rating != null) setGoogle(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [google_place_id])

  if (!google_place_id && !trustpilot_url) return null
  if (loading) return null
  if (!google && !trustpilot_url) return null

  return (
    <div style={{ marginTop: 'var(--s-5)' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 'var(--s-3)' }}>
        Reviews from around the web
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
        {/* Google */}
        {google && (
          <div style={{ border: '1px solid var(--surface-border)', borderRadius: 'var(--r-lg)', padding: 'var(--s-4)', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: google.reviews?.length ? 'var(--s-3)' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Google "G" */}
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Google Reviews</div>
                  <ReviewStars rating={google.rating} count={google.total} size={13} />
                </div>
              </div>
              {google.mapsUrl && (
                <a href={google.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-cobalt-700)' }}>
                  View on Google <ExternalLink size={12} />
                </a>
              )}
            </div>

            {google.reviews?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {google.reviews.map((r, i) => (
                  <div key={i} style={{ borderTop: '1px solid var(--surface-border)', paddingTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.author}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.relativeTime}</span>
                    </div>
                    <ReviewStars rating={r.rating} size={12} />
                    {r.text && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                        {r.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trustpilot */}
        {trustpilot_url && (
          <a
            href={trustpilot_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              border: '1px solid var(--surface-border)', borderRadius: 'var(--r-lg)',
              padding: 'var(--s-3) var(--s-4)', background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#00B67A'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--surface-border)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 26, height: 26, background: '#00B67A', borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Star size={15} style={{ fill: 'white', color: 'white' }} />
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Trustpilot</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Read independent reviews</div>
              </div>
            </div>
            <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
          </a>
        )}
      </div>
    </div>
  )
}
