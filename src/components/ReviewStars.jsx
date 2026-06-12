import { Star } from 'lucide-react'

export default function ReviewStars({ rating = 0, count = null, size = 14, interactive = false, onChange = null }) {
  const r = Number(rating) || 0

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ display: 'inline-flex', gap: 1 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={size}
            onClick={interactive ? () => onChange?.(i) : undefined}
            style={{
              cursor: interactive ? 'pointer' : 'default',
              fill: i <= Math.round(r) ? '#f59e0b' : 'none',
              color: i <= Math.round(r) ? '#f59e0b' : 'var(--c-ink-100)',
              transition: 'all 0.15s',
            }}
          />
        ))}
      </span>
      {count != null && (
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {r > 0 ? `${r.toFixed(1)} (${count})` : 'No reviews yet'}
        </span>
      )}
    </span>
  )
}
