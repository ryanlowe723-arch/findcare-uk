import { useEffect } from 'react'

const SITE_NAME = 'FindCare UK'
const SITE_URL = 'https://findcare-uk.vercel.app' // update when custom domain is live
const DEFAULT_DESC =
  'Find verified doctors, physiotherapists, and specialists near you. Search by condition, compare reviews, and book appointments online — including emergency and same-day slots.'

function setMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Per-page SEO: title, description, canonical, Open Graph, Twitter, JSON-LD.
 * jsonLd can be a single object or an array of schema.org objects.
 */
export function useSeo({ title, description, path = '', jsonLd = null, type = 'website', image = null }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Find Doctors, Physios & Specialists Near You`
    const desc = description || DEFAULT_DESC
    const url = `${SITE_URL}${path}`

    document.title = fullTitle
    setMeta('name', 'description', desc)
    setLink('canonical', url)

    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:site_name', SITE_NAME)
    if (image) setMeta('property', 'og:image', image)

    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', desc)
    if (image) setMeta('name', 'twitter:image', image)

    // JSON-LD structured data
    document.querySelectorAll('script[data-seo-jsonld]').forEach(s => s.remove())
    if (jsonLd) {
      const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd]
      blocks.forEach(block => {
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.dataset.seoJsonld = 'true'
        script.textContent = JSON.stringify(block)
        document.head.appendChild(script)
      })
    }

    return () => {
      document.querySelectorAll('script[data-seo-jsonld]').forEach(s => s.remove())
    }
  }, [title, description, path, type, image, JSON.stringify(jsonLd)])
}

export const SITE = { name: SITE_NAME, url: SITE_URL }

/** Schema.org organisation block — used site-wide */
export const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESC,
}

/** Build a Physician/MedicalBusiness JSON-LD block for a practitioner profile */
export function practitionerJsonLd(p) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: `${p.title} ${p.name}`,
    description: p.bio || undefined,
    image: p.photo_url || undefined,
    medicalSpecialty: p.types || undefined,
    address: p.location_name
      ? { '@type': 'PostalAddress', addressLocality: p.location_name, postalCode: p.postcode, addressCountry: 'GB' }
      : undefined,
    telephone: p.phone || undefined,
    url: `${SITE_URL}/practitioners/${p.id}`,
    ...(p.review_count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(p.avg_rating),
        reviewCount: p.review_count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  }
}

/** FAQPage JSON-LD from [{q, a}] pairs — strong GEO signal for AI search engines */
export function faqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

/** Article JSON-LD for blog posts */
export function articleJsonLd({ title, description, slug, datePublished }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    datePublished,
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
  }
}
