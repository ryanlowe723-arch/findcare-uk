import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSeo } from '../lib/seo'

export default function CancelBooking() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [state, setState] = useState('confirm') // confirm / working / done / failed

  useSeo({ title: 'Cancel Booking', path: '/cancel-booking' })

  const handleCancel = async () => {
    setState('working')
    const { data, error } = await supabase.rpc('cancel_booking_by_token', { token })
    if (error || data !== true) {
      setState('failed')
    } else {
      setState('done')
    }
  }

  useEffect(() => {
    if (!token) setState('failed')
  }, [token])

  return (
    <div className="page-top" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: 'var(--surface-raised)' }}>
      <div style={{ maxWidth: 460, marginInline: 'auto', padding: 'var(--s-4)', textAlign: 'center', width: '100%' }}>
        {state === 'confirm' && (
          <div style={{ background: 'white', borderRadius: 'var(--r-lg)', padding: 'var(--s-6)', boxShadow: 'var(--card-shadow)', border: '1px solid var(--surface-border)' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 12 }}>
              Cancel your booking?
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--s-4)', lineHeight: 1.7 }}>
              This will free up your appointment slot for other patients. This cannot be undone — you'd need to book again.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-danger" onClick={handleCancel}>Yes, cancel booking</button>
              <Link to="/" className="btn-secondary">Keep my booking</Link>
            </div>
          </div>
        )}

        {state === 'working' && (
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-data)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
            CANCELLING...
          </div>
        )}

        {state === 'done' && (
          <div style={{ background: 'white', borderRadius: 'var(--r-lg)', padding: 'var(--s-6)', boxShadow: 'var(--card-shadow)', border: '1px solid var(--surface-border)' }}>
            <CheckCircle size={48} style={{ color: 'var(--c-green)', marginInline: 'auto', marginBottom: 'var(--s-3)' }} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 12 }}>
              Booking cancelled
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--s-4)' }}>
              Your slot has been released. Need to rebook?
            </p>
            <Link to="/search" className="btn-primary" style={{ display: 'inline-flex' }}>
              Find a practitioner
            </Link>
          </div>
        )}

        {state === 'failed' && (
          <div style={{ background: 'white', borderRadius: 'var(--r-lg)', padding: 'var(--s-6)', boxShadow: 'var(--card-shadow)', border: '1px solid var(--surface-border)' }}>
            <XCircle size={48} style={{ color: 'var(--c-red)', marginInline: 'auto', marginBottom: 'var(--s-3)' }} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 12 }}>
              Cancellation link invalid
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--s-4)', lineHeight: 1.7 }}>
              This booking may already be cancelled, or the link has expired. Contact the practitioner directly if you need help.
            </p>
            <Link to="/" className="btn-secondary" style={{ display: 'inline-flex' }}>Back to home</Link>
          </div>
        )}
      </div>
    </div>
  )
}
