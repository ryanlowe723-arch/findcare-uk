import { useSeo } from '../lib/seo'

const SECTIONS = [
  { h: '1. What FindCare UK is', p: 'FindCare UK is a directory and booking platform that connects patients with independent healthcare practitioners. We are not a healthcare provider, do not employ the practitioners listed, and do not provide medical advice. The contract for any appointment is between you and the practitioner directly.' },
  { h: '2. No medical advice', p: 'Content on this site — including the symptom checker, blog guides, and FAQ answers — is general information only and is not a diagnosis or a substitute for professional medical advice. For emergencies call 999. Always consult a qualified professional about your specific situation.' },
  { h: '3. Practitioner verification', p: 'We check each practitioner\'s stated professional registration number against the relevant public register (e.g. GMC, HCPC) before approving their listing. Verification confirms registration at the time of checking only; we do not continuously monitor registers and make no guarantee about ongoing status, quality of care, or treatment outcomes. Always satisfy yourself before booking.' },
  { h: '4. Bookings and cancellations', p: 'Bookings made through the platform are requests passed to the practitioner. Payment, attendance, cancellation fees, and any clinical matters are between you and the practitioner. You can cancel via the link in your confirmation email; please give practitioners reasonable notice.' },
  { h: '5. Reviews', p: 'Reviews must reflect a genuine experience. We moderate all reviews before publication and may reject content that is defamatory, discriminatory, unrelated to care received, or that contains personal health information about others. Practitioners may reply but cannot edit or remove reviews.' },
  { h: '6. Practitioner obligations', p: 'Practitioners must hold valid professional registration and insurance, keep their profile information accurate, honour bookings made through the platform or promptly notify the patient, and comply with their professional body\'s standards. We may suspend or remove listings that breach these terms.' },
  { h: '7. Acceptable use', p: 'You must not use the platform to send spam, scrape data, misrepresent your identity or qualifications, post false reviews, or interfere with the service\'s operation.' },
  { h: '8. Liability', p: 'To the maximum extent permitted by law, FindCare UK is not liable for the acts or omissions of listed practitioners, treatment outcomes, missed appointments, or any indirect loss arising from use of the platform. Nothing in these terms limits liability that cannot be limited by law.' },
  { h: '9. Changes and termination', p: 'We may update these terms or modify the service at any time; continued use constitutes acceptance. We may suspend accounts that breach these terms.' },
  { h: '10. Governing law', p: 'These terms are governed by the laws of England and Wales, and disputes are subject to the exclusive jurisdiction of the courts of England and Wales. Last updated: June 2026.' },
]

export default function Terms() {
  useSeo({ title: 'Terms of Service', path: '/terms' })

  return (
    <div className="page-top" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, marginInline: 'auto', padding: 'var(--s-6) var(--s-4) var(--s-12)' }}>
        <h1 className="section-title" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', marginBottom: 'var(--s-5)' }}>
          Terms of Service
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
