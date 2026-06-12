import { Link } from 'react-router-dom'
import { MapPin, Phone, Zap, User, BadgeCheck, Video } from 'lucide-react'
import { distanceLabel } from '../lib/geo'
import ReviewStars from './ReviewStars'
import FavouriteButton from './FavouriteButton'

export default function PractitionerCard({ practitioner }) {
  const {
    id, name, title, types = [], photo_url, location_name,
    emergency_available, accepts_nhs, has_booking, distance_km,
    avg_rating, review_count, is_verified, offers_video,
  } = practitioner

  return (
    <div className="practitioner-card" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
        <FavouriteButton practitionerId={id} size={16} />
      </div>

      {photo_url ? (
        <img src={photo_url} alt={`${title} ${name}`} className="card-photo" loading="lazy" />
      ) : (
        <div className="card-photo-placeholder">
          <User size={48} strokeWidth={1} />
        </div>
      )}

      <div className="card-body">
        <div>
          <div className="card-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {title} {name}
            {is_verified && (
              <BadgeCheck size={16} style={{ color: 'var(--c-cobalt-100)', flexShrink: 0 }} title="Verified credentials" />
            )}
          </div>
          {review_count > 0 && (
            <div style={{ marginTop: 4 }}>
              <ReviewStars rating={avg_rating} count={review_count} size={12} />
            </div>
          )}
        </div>

        <div className="card-types">
          {types.slice(0, 3).map(t => (
            <span key={t} className="type-badge">{t}</span>
          ))}
          {emergency_available && (
            <span className="emergency-badge">
              <Zap size={9} style={{ display: 'inline', marginRight: 2 }} />
              Emergency
            </span>
          )}
          {accepts_nhs && <span className="nhs-badge">NHS</span>}
        </div>

        <div className="card-meta">
          {location_name && (
            <div className="card-meta-row">
              <MapPin size={13} strokeWidth={1.5} />
              <span>
                {location_name}
                {distance_km != null && (
                  <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                    · {distanceLabel(distance_km)}
                  </span>
                )}
              </span>
            </div>
          )}
          {offers_video && (
            <div className="card-meta-row" style={{ color: 'var(--c-cobalt-700)' }}>
              <Video size={13} strokeWidth={1.5} />
              Video consultations
            </div>
          )}
          {has_booking && (
            <div className="card-meta-row" style={{ color: 'var(--c-green)', fontWeight: 500 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-green)', display: 'inline-block' }} />
              Online booking available
            </div>
          )}
        </div>
      </div>

      <div className="card-footer">
        <Link to={`/practitioners/${id}`} className="card-btn card-btn-primary">
          View Profile
        </Link>
        <Link to={`/practitioners/${id}#contact`} className="card-btn card-btn-secondary">
          <Phone size={12} strokeWidth={2} />
          Contact
        </Link>
      </div>
    </div>
  )
}
