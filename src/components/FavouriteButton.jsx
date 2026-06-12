import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { isFavourite, toggleFavourite } from '../lib/favourites'

export default function FavouriteButton({ practitionerId, size = 18, withLabel = false }) {
  const [fav, setFav] = useState(false)

  useEffect(() => {
    setFav(isFavourite(practitionerId))
    const sync = () => setFav(isFavourite(practitionerId))
    window.addEventListener('favourites-changed', sync)
    return () => window.removeEventListener('favourites-changed', sync)
  }, [practitionerId])

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setFav(toggleFavourite(practitionerId))
  }

  return (
    <button
      onClick={handleClick}
      aria-label={fav ? 'Remove from saved' : 'Save practitioner'}
      title={fav ? 'Remove from saved' : 'Save practitioner'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        color: fav ? 'var(--c-red)' : 'var(--text-muted)',
        fontSize: '0.8rem', fontWeight: 600,
        transition: 'color 0.2s, transform 0.15s',
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.85)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <Heart size={size} style={{ fill: fav ? 'var(--c-red)' : 'none' }} />
      {withLabel && (fav ? 'Saved' : 'Save')}
    </button>
  )
}
