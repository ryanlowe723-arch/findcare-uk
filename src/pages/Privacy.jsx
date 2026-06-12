import { useSeo } from '../lib/seo'

const SECTIONS = [
  { h: '1. Who we are', p: 'FindCare UK ("we", "us") operates this healthcare practitioner directory. We act as a data controller for the personal data described in this policy. Contact: privacy@findcare.uk.' },
  { h: '2. What data we collect', p: 'Patients: name, email, phone number, and any condition notes you choose to include when booking, enquiring, joining a waitlist, or leaving a review. Practitioners: identity, contact, professional registration, qualification, and practice details provided during registration. Technical: standard server logs and approximate location derived from any postcode you search (the postcode itself is sent to postcodes.io to find coordinates and is not stored by us).' },
  { h: '3. How we use it', p: 'To connect patients with practitioners: bookings, enquiries, waitlist entries, and reviews are shared with the relevant practitioner. To operate the service: account management, listing verification, review moderation, and transactional emails (booking confirmations, approval notices). We do not sell personal data, and we do not use it for third-party advertising.' },
  { h: '4. Health data', p: 'Condition notes you include with a booking or enquiry may constitute special category (health) data. We process it only to pass it to your chosen practitioner so they can prepare for your appointment, on the basis of your explicit consent given at the point of submission. Include only what you are comfortable sharing.' },
  { h: '5. Legal bases', p: 'Contract (providing the booking service you request), consent (health information, marketing where opted in), and legitimate interests (service security, fraud prevention, practitioner verification).' },
  { h: '6. Sharing', p: 'Practitioner profiles are public. Patient details are shared only with the practitioner you contact. Service providers: Supabase (database & authentication hosting), Vercel (web hosting), Resend (email delivery), postcodes.io (postcode lookup), Google (only where a practitioner links a Google Business Profile and you view their reviews). Each processes data under their own compliance terms.' },
  { h: '7. Retention', p: 'Bookings and enquiries: 24 months, then deleted or anonymised. Reviews: retained while the practitioner is listed. Practitioner accounts: while the listing is active, plus 12 months. You can request earlier deletion at any time.' },
  { h: '8. Your rights', p: 'Under UK GDPR you can request access, correction, deletion, restriction, or portability of your data, and object to processing. Email privacy@findcare.uk. You can also complain to the ICO (ico.org.uk).' },
  { h: '9. Cookies & storage', p: 'We use essential authentication cookies (Supabase session) for practitioner logins, and localStorage for your saved-practitioner shortlist (stored only on your device, never sent to us). We do not use third-party advertising or tracking cookies.' },
  { h: '10. Changes', p: 'We will post any changes to this policy here. Last updated: June 2026.' },
]

export default function Privacy() {
  useSeo({ title: 'Privacy Policy', path: '/privacy' })

  return (
    <div className="page-top" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, marginInline: 'auto', padding: 'var(--s-6) var(--s-4) var(--s-12)' }}>
        <h1 className="section-title" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', marginBottom: 'var(--s-5)' }}>
          Privacy Policy
        </h1>
        {SECTIONS.map(s => (
          <section key={s.h} style={{ marginBottom: 'var(--s-4)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 8 }}>{s.h}</h2>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
