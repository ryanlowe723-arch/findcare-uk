import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useSeo, faqJsonLd } from '../lib/seo'

const FAQS = [
  {
    group: 'For patients',
    items: [
      { q: 'Is FindCare UK free to use?', a: 'Yes — searching, comparing practitioners, sending enquiries, and booking appointments are all completely free for patients. You only pay the practitioner for your appointment.' },
      { q: 'Do I need an account to book?', a: 'No. You can search and book appointments without creating an account — just provide your name and email when booking so the practitioner can contact you.' },
      { q: 'Are the practitioners verified?', a: 'Yes. Every practitioner must provide their professional registration number (GMC, HCPC, NMC, GOsC, GCC, or BACP), which we check against the official register before their listing goes live. Verified practitioners carry a blue badge.' },
      { q: 'How do I cancel a booking?', a: 'Your confirmation email contains a cancellation link — click it any time to free up the slot. You can also contact the practitioner directly.' },
      { q: 'What does the emergency badge mean?', a: 'Practitioners with the emergency badge offer same-day or urgent appointment slots. Filter your search by "Emergency / same-day slots" to see only these practitioners.' },
      { q: 'Are the reviews genuine?', a: 'Every review is moderated before publication, and reviewers must provide a contact email. Practitioners can reply publicly but cannot edit or remove reviews. Many profiles also show independent Google and Trustpilot reviews.' },
    ],
  },
  {
    group: 'For practitioners',
    items: [
      { q: 'How much does a listing cost?', a: 'Listings are currently free, including online bookings, enquiries, and review management.' },
      { q: 'How long does approval take?', a: 'Usually 24–48 hours. We verify your professional registration number against the relevant register before your profile goes live.' },
      { q: 'How does online booking work?', a: 'Set your weekly working hours once in your dashboard and generate bookable slots for the next four weeks in one click — or add individual slots manually. Patients book in real time, and you get an email plus a dashboard notification for each booking.' },
      { q: 'Can I show my Google or Trustpilot reviews?', a: 'Yes — add your Google Place ID and/or Trustpilot URL in your dashboard, and your existing reviews appear on your FindCare profile automatically.' },
      { q: 'What is the waitlist feature?', a: 'When you have no open slots, patients can join your waitlist instead of leaving. You see waitlist entries in your dashboard and can contact patients as soon as availability opens.' },
    ],
  },
]

export default function Faq() {
  const [open, setOpen] = useState(null)

  useSeo({
    title: 'Frequently Asked Questions',
    description: 'How FindCare UK works for patients and practitioners — verification, booking, reviews, cancellations, and listing your practice.',
    path: '/faq',
    jsonLd: faqJsonLd(FAQS.flatMap(g => g.items)),
  })

  return (
    <div className="page-top" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, marginInline: 'auto', padding: 'var(--s-6) var(--s-4) var(--s-12)' }}>
        <div style={{ marginBottom: 'var(--s-6)' }}>
          <div className="section-tag">Help Centre</div>
          <h1 className="section-title" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)' }}>
            Frequently asked questions
          </h1>
        </div>

        {FAQS.map(group => (
          <section key={group.group} style={{ marginBottom: 'var(--s-6)' }}>
            <h2 style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--c-cobalt-100)', marginBottom: 'var(--s-3)' }}>
              {group.group}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {group.items.map((faq) => {
                const key = `${group.group}-${faq.q}`
                const isOpen = open === key
                return (
                  <div key={key} style={{ border: '1px solid var(--surface-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                    <button
                      onClick={() => setOpen(isOpen ? null : key)}
                      style={{
                        width: '100%', padding: '15px 18px', textAlign: 'left',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                        fontWeight: 600, fontSize: '0.925rem', color: 'var(--text-primary)',
                        background: isOpen ? 'var(--surface-raised)' : 'white',
                      }}
                    >
                      {faq.q}
                      <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 18px 16px', fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)', background: 'var(--surface-raised)' }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        <div style={{ textAlign: 'center', padding: 'var(--s-4)', background: 'var(--surface-raised)', borderRadius: 'var(--r-lg)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--s-2)' }}>
            Still have a question?
          </p>
          <Link to="/search" className="btn-secondary" style={{ display: 'inline-flex' }}>
            Find a practitioner to ask directly
          </Link>
        </div>
      </div>
    </div>
  )
}
