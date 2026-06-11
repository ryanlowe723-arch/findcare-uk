import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search as SearchIcon, MapPin, SlidersHorizontal, X } from 'lucide-react'
import PractitionerCard from '../components/PractitionerCard'
import { supabase } from '../lib/supabase'
import { resolveLocation } from '../lib/geo'

const TYPES = ['GP', 'Physiotherapist', 'Sports Medicine', 'Osteopath', 'Chiropractor', 'Psychologist', 'Nutritionist', 'Specialist']
const RADII = [{ label: '5 miles', km: 8 }, { label: '10 miles', km: 16 }, { label: '25 miles', km: 40 }, { label: '50 miles', km: 80 }]

function SkeletonCard() {
  return (
    <div style={{ background: 'white', borderRadius: 'var(--r-lg)', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 200, borderRadius: 0 }} />
      <div style={{ padding: 'var(--s-3)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton" style={{ height: 20, width: '60%' }} />
        <div className="skeleton" style={{ height: 14, width: '80%' }} />
        <div className="skeleton" style={{ height: 14, width: '40%' }} />
      </div>
    </div>
  )
}

export default function Search() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [condition, setCondition] = useState(searchParams.get('condition') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [activeTypes, setActiveTypes] = useState(
    searchParams.get('type') ? [searchParams.get('type')] : []
  )
  const [radiusKm, setRadiusKm] = useState(40)
  const [emergencyOnly, setEmergencyOnly] = useState(false)
  const [nhsOnly, setNhsOnly] = useState(false)

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const doSearch = useCallback(async (cond, loc, types, radius, emergency, nhs) => {
    setLoading(true)
    setGeoError('')
    setSearched(true)

    try {
      let geo = null
      if (loc) {
        geo = await resolveLocation(loc)
        if (!geo) {
          setGeoError('Could not find that location. Try a UK postcode or town name.')
          setLoading(false)
          return
        }
      }

      if (geo) {
        const { data, error } = await supabase.rpc('search_practitioners', {
          search_lat: geo.lat,
          search_lng: geo.lng,
          radius_km: radius,
          condition_query: cond || '',
          type_filter: types.length ? types : null,
        })

        if (error) throw error

        let filtered = data || []
        if (emergency) filtered = filtered.filter(p => p.emergency_available)
        if (nhs) filtered = filtered.filter(p => p.accepts_nhs)
        setResults(filtered)
      } else {
        // No location — just filter by condition/type from all approved
        let query = supabase.from('practitioners').select('*').eq('status', 'approved')
        if (types.length) query = query.overlaps('types', types)
        if (emergency) query = query.eq('emergency_available', true)
        if (nhs) query = query.eq('accepts_nhs', true)
        const { data, error } = await query.limit(50)
        if (error) throw error
        setResults(data || [])
      }
    } catch (err) {
      console.error(err)
      setResults([])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    if (condition || location || activeTypes.length) {
      doSearch(condition, location, activeTypes, radiusKm, emergencyOnly, nhsOnly)
    }
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (condition) params.set('condition', condition)
    if (location)  params.set('location', location)
    navigate(`/search?${params.toString()}`, { replace: true })
    doSearch(condition, location, activeTypes, radiusKm, emergencyOnly, nhsOnly)
  }

  const toggleType = (type) => {
    setActiveTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
  }

  const FiltersPanel = () => (
    <div className="filter-sidebar">
      <div className="filter-group">
        <div className="filter-group-title">Practitioner Type</div>
        <div>
          {TYPES.map(t => (
            <button
              key={t}
              className={`filter-chip${activeTypes.includes(t) ? ' active' : ''}`}
              onClick={() => toggleType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-group-title">Distance</div>
        <select
          className="filter-select"
          value={radiusKm}
          onChange={e => setRadiusKm(Number(e.target.value))}
        >
          {RADII.map(r => (
            <option key={r.km} value={r.km}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <div className="filter-group-title">Availability</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', marginBottom: 10 }}>
          <input
            type="checkbox"
            checked={emergencyOnly}
            onChange={e => setEmergencyOnly(e.target.checked)}
          />
          Emergency / same-day slots
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
          <input
            type="checkbox"
            checked={nhsOnly}
            onChange={e => setNhsOnly(e.target.checked)}
          />
          NHS accepted
        </label>
      </div>

      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => {
          doSearch(condition, location, activeTypes, radiusKm, emergencyOnly, nhsOnly)
          setShowMobileFilters(false)
        }}
      >
        Apply Filters
      </button>
    </div>
  )

  return (
    <div className="page-top" style={{ minHeight: '100vh' }}>
      {/* Search bar at top */}
      <div style={{ background: 'var(--c-ink-900)', padding: 'var(--s-4) 0' }}>
        <div className="page-container">
          <form onSubmit={handleSearchSubmit} className="search-bar" style={{ maxWidth: '100%' }}>
            <div className="search-field">
              <SearchIcon size={16} className="search-field-icon" />
              <input
                type="text"
                placeholder="Condition or injury..."
                value={condition}
                onChange={e => setCondition(e.target.value)}
              />
            </div>
            <div className="search-field">
              <MapPin size={16} className="search-field-icon" />
              <input
                type="text"
                placeholder="Postcode or town"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
            <button type="submit" className="search-submit">Search</button>
          </form>
          {geoError && (
            <p style={{ color: 'var(--c-amber)', fontSize: '0.82rem', marginTop: 8 }}>{geoError}</p>
          )}
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: 'var(--s-5)', paddingBottom: 'var(--s-10)' }}>
        {/* Mobile filter toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s-3)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {searched && !loading && `${results.length} practitioner${results.length !== 1 ? 's' : ''} found`}
          </div>
          <button
            className="btn-secondary"
            style={{ display: 'flex', gap: 6 }}
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <SlidersHorizontal size={14} />
            Filters
            {(activeTypes.length || emergencyOnly || nhsOnly) && (
              <span style={{
                background: 'var(--c-cobalt-700)', color: 'white',
                borderRadius: '50%', width: 18, height: 18,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 700, marginLeft: 2,
              }}>
                {activeTypes.length + (emergencyOnly ? 1 : 0) + (nhsOnly ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Mobile filter drawer */}
        <AnimatePresence>
          {showMobileFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: 'var(--s-3)' }}
            >
              <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--surface-border)', borderRadius: 'var(--r-lg)', padding: 'var(--s-4)' }}>
                <FiltersPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="search-layout">
          {/* Desktop sidebar */}
          <div style={{ display: 'none' }} className="filter-sidebar-desktop">
            <FiltersPanel />
          </div>

          {/* Results */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div className="practitioners-grid">
                {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : searched && results.length === 0 ? (
              <div className="empty-state">
                <X size={48} className="empty-state-icon" />
                <h3>No practitioners found</h3>
                <p>Try expanding your search area, adjusting filters, or using different keywords.</p>
              </div>
            ) : !searched ? (
              <div className="empty-state">
                <SearchIcon size={48} className="empty-state-icon" />
                <h3>Search for a practitioner</h3>
                <p>Enter a condition, injury, or specialty above to find matching practitioners near you.</p>
              </div>
            ) : (
              <motion.div
                className="practitioners-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {results.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                  >
                    <PractitionerCard practitioner={p} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Make desktop sidebar visible via CSS */}
      <style>{`
        @media (min-width: 900px) {
          .filter-sidebar-desktop { display: block !important; }
        }
      `}</style>
    </div>
  )
}
