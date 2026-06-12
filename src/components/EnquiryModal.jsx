import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, CheckCircle, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function EnquiryModal({ practitioner, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const { error: err } = await supabase.from('enquiries').insert({
      practitioner_id: practitioner.id,
      sender_name: form.name,
      sender_email: form.email,
      sender_phone: form.phone || null,
      message: form.message,
    })

    setSubmitting(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="modal-box"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">Send an enquiry</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: 'var(--s-4) 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--c-green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginInline: 'auto', marginBottom: 'var(--s-3)' }}>
              <CheckCircle size={32} style={{ color: 'var(--c-green)' }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8 }}>Enquiry sent!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--s-4)' }}>
              {practitioner.title} {practitioner.name} will reply to <strong>{form.email}</strong> directly.
            </p>
            <button onClick={onClose} className="btn-primary" style={{ marginInline: 'auto' }}>Done</button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--s-3)' }}>
              Ask {practitioner.title} {practitioner.name} a question — about your condition, prices, or availability.
            </p>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
              <div className="form-group">
                <label className="form-label">Your name *</label>
                <input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-2)' }}>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-input" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="tel" className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Your message *</label>
                <textarea className="form-input form-textarea" required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="e.g. Do you treat ACL injuries? What are your prices?" />
              </div>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ justifyContent: 'center', padding: '14px', opacity: submitting ? 0.7 : 1 }}>
                <Send size={15} />
                {submitting ? 'Sending...' : 'Send Enquiry'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
