import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search as SearchIcon, MapPin, SlidersHorizontal, X, List, Map as MapIcon } from 'lucide-react'
import PractitionerCard from '../components/PractitionerCard'

const MapView = lazy(() => import('../components/MapView'))
import { supabase } from '../lib/supabase'
import { resolveLocation } from '../lib/geo'
import { useSeo } from '../lib/seo'

const TYPES = ['GP', 'Physiotherapist', 'Dentist', 'Sports Medicine', 'Osteopath', 'Chiropractor', 'Psychologist', 'Nutritionist', 'Specialist']
const RADII = [{ label: '5 miles', km: 8 }, { label: '10 miles', km: 16 }, { label: '25 miles', km: 40 }, { label: '50 miles', km: 80 }]
const LANGUAGES = ['English', 'Welsh', 'French', 'Spanish', 'Urdu', 'Punjabi', 'Hindi', 'Arabic', 'Polish', 'Bengali']
const SORTS = [
  { key: 'best',      label: 'Best match' },
  { key: 'nearest',   label: 'Nearest' },
  { key: 'rating',    label: 'Highest rated' },
  { key: 'emergency', label: 'Emergency first' },
]

/** Composite score: closer + better rated + bookable + verified wins */
function bestMatchScore(p) {
  let score = 0
  if (p.distance_km != null) score -= p.distance_km * 1.5
  score += Number(p.avg_rating || 0) * 8
  score += Math.min(p.review_count || 0, 20) * 0.5
  if (p.has_booking) score += 10
  if (p.is_verified) score += 8
  if (p.emergency_available) score += 4
  return score
}

function sortResults(results, sort) {
  const r = [...results]
  switch (sort) {
    case 'nearest':
      return r.sort((a, b) => (a.distance_km ?? 1e9) - (b.distance_km ?? 1e9))
    case 'rating':
      return r.sort((a, b) => Number(b.avg_rating || 0) - Number(a.avg_rating || 0) || (b.review_count || 0) - (a.review_count || 0))
    case 'emergency':
      return r.sort((a, b) => (b.emergency_available ? 1 : 0) - (a.emergency_available ? 1 : 0) || (a.distance_km ?? 1e9) - (b.distance_km ?? 1e9))
    default:
      return r.sort((a, b) => bestMatchScore(b) - bestMatchScore(a))
  }
}

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
  const [emergencyOnly, setEmergencyOnly] = useState(searchParams.get('emergency') === '1')
  const [nhsOnly, setNhsOnly] = useState(false)
  const [videoOnly, setVideoOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [language, setLanguage] = useState('')
  const [sort, setSort] = useState('best')
  const [viewMode, setViewMode] = useState('list')

  const [results, setResults] = useState([])
  const [searchCenter, setSearchCenter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  useSeo({
    title: condition ? `${condition} specialists${location ? ` near ${location}` : ''}` : 'Find a Practitioner',
    description: `Search verified UK doctors, physiotherapists, and specialists${condition ? ` for ${condition}` : ''}. Compare reviews, check availability, and book online.`,
    path: '/search',
  })

  const doSearch = useCallback(async (cond, loc, types, radius) => {
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

      setSearchCenter(geo)

      if (geo) {
        const { data, error } = await supabase.rpc('search_practitioners', {
          search_lat: geo.lat,
          search_lng: geo.lng,
          radius_km: radius,
          condition_query: cond || '',
          type_filter: types.length ? types : null,
        })
        if (error) throw error
        setResults(data || [])
      } else {
        let query = supabase.from('practitioners').select('*').eq('status', 'approved')
        if (types.length) query = query.overlaps('types', types)
        if (cond) query = query.or(`specialties.cs.{${cond}},bio.ilike.%${cond}%`)
        const { data, error } = await query.limit(100)
        if (error) {
          // Fallback without the or() filter if it errors on syntax
          const { data: d2 } = await supabase.from('practitioners').select('*').eq('status', 'approved').limit(100)
          setResults(d2 || [])
        } else {
          setResults(data || [])
        }
      }
    } catch (err) {
      console.error(err)
      setResults([])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    if (condition || location || activeTypes.length || emergencyOnly) {
      doSearch(condition, location, activeTypes, radiusKm)
    }
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (condition) params.set('condition', condition)
    if (location)  params.set('location', location)
    navigate(`/search?${params.toString()}`, { replace: true })
    doSearch(condition, location, activeTypes, radiusKm)
  }

  const toggleType = (type) => {
    setActiveTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
  }

  // Client-side filters + sorting on top of server results
  let visible = results
  if (emergencyOnly) visible = visible.filter(p => p.emergency_available)
  if (nhsOnly)       visible = visible.filter(p => p.accepts_nhs)
  if (videoOnly)     visible = visible.filter(p => p.offers_video)
  if (minRating > 0) visible = visible.filter(p => Number(p.avg_rating || 0) >= minRating)
  if (language)      visible = visible.filter(p => p.languages?.includes(language))
  visible = sortResults(visible, sort)

  const activeFilterCount = activeTypes.length + (emergencyOnly ? 1 : 0) + (nhsOnly ? 1 : 0) + (videoOnly ? 1 : 0) + (minRating > 0 ? 1 : 0) + (language ? 1 : 0)

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
        <select className="filter-select" value={radiusKm} onChange={e => setRadiusKm(Number(e.target.value))}>
          {RADII.map(r => <option key={r.km} value={r.km}>{r.label}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <div className="filter-group-title">Availability & Services</div>
        {[
          [emergencyOnly, setEmergencyOnly, 'Emergency / same-day slots'],
          [nhsOnly, setNhsOnly, 'NHS accepted'],
          [videoOnly, setVideoOnly, 'Video consultations'],
        ].map(([val, setter, label]) => (
          <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', marginBottom: 10 }}>
            <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)} />
            {label}
          </label>
        ))}
      </div>

      <div className="filter-group">
        <div className="filter-group-title">Minimum Rating</div>
        <select className="filter-select" value={minRating} onChange={e => setMinRating(Number(e.target.value))}>
          <option value={0}>Any rating</option>
          <option value={3}>3+ stars</option>
          <option value={4}>4+ stars</option>
          <option value={4.5}>4.5+ stars</option>
        </select>
      </div>

      <div className="filter-group">
        <div className="filter-group-title">Language</div>
        <select className="filter-select" value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="">Any language</option>
          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => {
          doSearch(condition, location, activeTypes, radiusKm)
          setShowMobileFilters(false)
        }}
      >
        Apply Filters
      </button>
    </div>
  )

  return (
    <div className="page-top" style={{ minHeight: '100vh' }}>
      {/* Search bar */}
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
        {/* Toolbar: count, sort, view toggle, filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s-3)', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {searched && !loading && `${visible.length} practitioner${visible.length !== 1 ? 's' : ''} found`}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <select
              className="filter-select"
              style={{ width: 'auto', padding: '8px 12px', fontSize: '0.82rem' }}
              value={sort}
              onChange={e => setSort(e.target.value)}
              aria-label="Sort results"
            >
              {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>

            {/* List / Map toggle */}
            <div style={{ display: 'flex', border: '1.5px solid var(--surface-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
              {[['list', List], ['map', MapIcon]].map(([mode, Icon]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  aria-label={`${mode} view`}
                  style={{
                    padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: '0.82rem', fontWeight: 600, textTransform: 'capitalize',
                    background: viewMode === mode ? 'var(--c-cobalt-700)' : 'transparent',
                    color: viewMode === mode ? 'white' : 'var(--text-secondary)',
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon size={13} />
                  {mode}
                </button>
              ))}
            </div>

            <button className="btn-secondary" style={{ display: 'flex', gap: 6 }} onClick={() => setShowMobileFilters(!showMobileFilters)}>
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span style={{
                  background: 'var(--c-cobalt-700)', color: 'white',
                  borderRadius: '50%', width: 18, height: 18,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700, marginLeft: 2,
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile/expandable filter drawer */}
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
            ) : viewMode === 'map' && searched ? (
              <Suspense fallback={<div className="skeleton" style={{ height: 520, borderRadius: 'var(--r-lg)' }} />}>
                <MapView practitioners={visible} center={searchCenter} />
              </Suspense>
            ) : searched && visible.length === 0 ? (
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
                {visible.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.4) }}
                  >
                    <PractitionerCard practitioner={p} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .filter-sidebar-desktop { display: block !important; }
        }
      `}</style>
    </div>
  )
}
