import { Link } from 'react-router-dom'
import { MapPin, Phone, Zap, User } from 'lucide-react'
import { distanceLabel } from '../lib/geo'

export default function PractitionerCard({ practitioner }) {
  const {
    id, name, title, types = [], photo_url, location_name,
    emergency_available, accepts_nhs, has_booking, distance_km,
  } = practitioner

  return (
    <div className="practitioner-card">
      {photo_url ? (
        <img src={photo_url} alt={name} className="card-photo" />
      ) : (
        <div className="card-photo-placeholder">
          <User size={48} strokeWidth={1} />
        </div>
      )}

      <div className="card-body">
        <div>
          <div className="card-name">{title} {name}</div>
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
