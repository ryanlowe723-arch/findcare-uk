import { Link } from 'react-router-dom'
import { Search, Home } from 'lucide-react'
import { useSeo } from '../lib/seo'

export default function NotFound() {
  useSeo({ title: 'Page Not Found', path: '/404' })

  return (
    <div className="page-top" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 'var(--s-4)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(4rem, 12vw, 7rem)', color: 'var(--c-ink-100)', lineHeight: 1 }}>
          404
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', margin: '16px 0 8px' }}>
          Page not found
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--s-4)' }}>
          The page you're looking for doesn't exist or has moved.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn-primary"><Home size={14} /> Home</Link>
          <Link to="/search" className="btn-secondary"><Search size={14} /> Find a Practitioner</Link>
        </div>
      </div>
    </div>
  )
}
