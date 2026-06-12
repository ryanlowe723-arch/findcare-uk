import { useParams, Link, Navigate } from 'react-router-dom'
import { Clock, ArrowLeft, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { blogPosts } from '../data/blogPosts'
import { useSeo, articleJsonLd, faqJsonLd } from '../lib/seo'

export default function BlogPost() {
  const { slug } = useParams()
  const post = blogPosts.find(p => p.slug === slug)
  const [openFaq, setOpenFaq] = useState(null)

  useSeo(post ? {
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    type: 'article',
    jsonLd: [
      articleJsonLd({ title: post.title, description: post.excerpt, slug: post.slug, datePublished: post.date }),
      ...(post.faqs?.length ? [faqJsonLd(post.faqs)] : []),
    ],
  } : { title: 'Article not found', path: '/blog' })

  if (!post) return <Navigate to="/blog" replace />

  const related = blogPosts.filter(p => p.slug !== slug).slice(0, 3)

  return (
    <div className="page-top" style={{ minHeight: '100vh' }}>
      <article style={{ maxWidth: 720, marginInline: 'auto', padding: 'var(--s-6) var(--s-4) var(--s-12)' }}>
        <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 'var(--s-4)' }}>
          <ArrowLeft size={14} /> All guides
        </Link>

        <span className="type-badge">{post.tag}</span>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', letterSpacing: '-0.03em',
          lineHeight: 1.15, margin: '12px 0',
        }}>
          {post.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--s-5)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={13} /> {post.readMins} min read
          </span>
          <span>{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>

        {post.sections.map((section, i) => (
          <section key={i} style={{ marginBottom: 'var(--s-4)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', marginBottom: 10, letterSpacing: '-0.01em' }}>
              {section.h}
            </h2>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.85, color: 'var(--text-secondary)' }}>
              {section.p}
            </p>
          </section>
        ))}

        {/* FAQ accordion — also emitted as FAQPage JSON-LD for GEO */}
        {post.faqs?.length > 0 && (
          <section style={{ marginTop: 'var(--s-6)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', marginBottom: 'var(--s-3)' }}>
              Frequently asked questions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {post.faqs.map((faq, i) => (
                <div key={i} style={{ border: '1px solid var(--surface-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: '100%', padding: '14px 18px', textAlign: 'left',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)',
                      background: openFaq === i ? 'var(--surface-raised)' : 'white',
                    }}
                  >
                    {faq.q}
                    <ChevronDown size={16} style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 18px 16px', fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)', background: 'var(--surface-raised)' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div style={{
          marginTop: 'var(--s-6)', padding: 'var(--s-5)',
          background: 'linear-gradient(135deg, var(--c-cobalt-700) 0%, var(--c-ink-900) 100%)',
          borderRadius: 'var(--r-lg)', color: 'white', textAlign: 'center',
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>
            Need to see someone about this?
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: 'var(--s-3)' }}>
            Search verified practitioners near you — filter by condition, availability, and reviews.
          </p>
          <Link to="/search" className="btn-primary" style={{ background: 'white', color: 'var(--c-cobalt-700)', display: 'inline-flex' }}>
            Find a Practitioner
          </Link>
        </div>

        {/* Related */}
        <section style={{ marginTop: 'var(--s-8)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 'var(--s-3)' }}>
            More guides
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {related.map(p => (
              <Link key={p.slug} to={`/blog/${p.slug}`} style={{
                padding: '14px 18px', border: '1px solid var(--surface-border)',
                borderRadius: 'var(--r-md)', fontSize: '0.9rem', fontWeight: 600,
                color: 'var(--text-primary)', transition: 'border-color 0.2s',
              }}>
                {p.title}
              </Link>
            ))}
          </div>
        </section>
      </article>
    </div>
  )
}
