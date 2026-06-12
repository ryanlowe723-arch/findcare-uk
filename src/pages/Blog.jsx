import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { blogPosts, blogTags } from '../data/blogPosts'
import { useSeo } from '../lib/seo'

export default function Blog() {
  const [tag, setTag] = useState('All')

  useSeo({
    title: 'Health Guides & Advice',
    description: 'Evidence-based guides on finding the right practitioner, injury recovery timelines, treatment costs, and when to seek help.',
    path: '/blog',
  })

  const posts = tag === 'All' ? blogPosts : blogPosts.filter(p => p.tag === tag)

  return (
    <div className="page-top" style={{ minHeight: '100vh' }}>
      <div className="page-container" style={{ paddingTop: 'var(--s-6)', paddingBottom: 'var(--s-12)' }}>
        <div style={{ marginBottom: 'var(--s-5)' }}>
          <div className="section-tag">Guides & Advice</div>
          <h1 className="section-title" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)' }}>
            Health guides, written straight
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 10, maxWidth: '52ch' }}>
            Evidence-based answers on choosing practitioners, recovery timelines, and treatment costs — no fluff.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--s-5)', flexWrap: 'wrap' }}>
          {blogTags.map(t => (
            <button
              key={t}
              className={`filter-chip${tag === t ? ' active' : ''}`}
              onClick={() => setTag(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--s-3)' }}>
          {posts.map(post => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              style={{
                background: 'white', border: '1px solid var(--surface-border)',
                borderRadius: 'var(--r-lg)', padding: 'var(--s-4)',
                boxShadow: 'var(--card-shadow)', transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--c-ink-300)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--surface-border)'}
            >
              <span className="type-badge" style={{ alignSelf: 'flex-start' }}>{post.tag}</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.3, color: 'var(--text-primary)' }}>
                {post.title}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
                {post.excerpt}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> {post.readMins} min read
                </span>
                <span>{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
