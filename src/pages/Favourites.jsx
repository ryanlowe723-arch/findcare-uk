import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getFavourites } from '../lib/favourites'
import PractitionerCard from '../components/PractitionerCard'
import { useSeo } from '../lib/seo'

export default function Favourites() {
  const [practitioners, setPractitioners] = useState([])
  const [loading, setLoading] = useState(true)

  useSeo({
    title: 'Saved Practitioners',
    description: 'Your saved doctors, physios, and specialists on FindCare UK.',
    path: '/saved',
  })

  const load = async () => {
    const ids = getFavourites()
    if (!ids.length) {
      setPractitioners([])
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('practitioners')
      .select('*')
      .in('id', ids)
      .eq('status', 'approved')
    setPractitioners(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    window.addEventListener('favourites-changed', load)
    return () => window.removeEventListener('favourites-changed', load)
  }, [])

  return (
    <div className="page-top" style={{ minHeight: '100vh' }}>
      <div className="page-container" style={{ paddingTop: 'var(--s-6)', paddingBottom: 'var(--s-12)' }}>
        <div style={{ marginBottom: 'var(--s-5)' }}>
          <div className="section-tag">Your shortlist</div>
          <h1 className="section-title" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)' }}>
            Saved practitioners
          </h1>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-data)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>LOADING...</div>
        ) : practitioners.length === 0 ? (
          <div className="empty-state">
            <Heart size={48} className="empty-state-icon" />
            <h3>No saved practitioners yet</h3>
            <p>Tap the heart on any practitioner to save them here for easy comparison.</p>
            <Link to="/search" className="btn-primary" style={{ display: 'inline-flex', marginTop: 'var(--s-3)' }}>
              Find practitioners
            </Link>
          </div>
        ) : (
          <div className="practitioners-grid">
            {practitioners.map(p => <PractitionerCard key={p.id} practitioner={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
