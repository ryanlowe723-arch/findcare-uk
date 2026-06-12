import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Custom cobalt pin
const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 24 16 24s16-13 16-24C32 7.2 24.8 0 16 0z" fill="#1E3A8A"/>
    <circle cx="16" cy="15" r="6.5" fill="white"/>
  </svg>`,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -38],
})

const emergencyPinIcon = L.divIcon({
  className: '',
  html: `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 24 16 24s16-13 16-24C32 7.2 24.8 0 16 0z" fill="#dc2626"/>
    <circle cx="16" cy="15" r="6.5" fill="white"/>
  </svg>`,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -38],
})

export default function MapView({ practitioners, center }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize once
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, { scrollWheelZoom: false })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current)
    }

    const map = mapRef.current

    // Clear old markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) map.removeLayer(layer)
    })

    const withCoords = practitioners.filter(p => p.lat && p.lng)

    withCoords.forEach(p => {
      const marker = L.marker([p.lat, p.lng], {
        icon: p.emergency_available ? emergencyPinIcon : pinIcon,
      }).addTo(map)

      const popupHtml = `
        <div style="font-family: 'DM Sans', sans-serif; min-width: 180px;">
          <div style="font-weight: 700; margin-bottom: 2px;">${p.title} ${p.name}</div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 6px;">${(p.types || []).join(', ')}</div>
          ${p.avg_rating > 0 ? `<div style="font-size: 12px; color: #f59e0b; margin-bottom: 6px;">★ ${Number(p.avg_rating).toFixed(1)} (${p.review_count})</div>` : ''}
          <a href="/practitioners/${p.id}" data-id="${p.id}" class="map-popup-link" style="font-size: 12px; font-weight: 700; color: #1E3A8A;">View profile →</a>
        </div>
      `
      marker.bindPopup(popupHtml)
    })

    // Fit bounds
    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(withCoords.map(p => [p.lat, p.lng]))
      if (center?.lat) bounds.extend([center.lat, center.lng])
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
    } else if (center?.lat) {
      map.setView([center.lat, center.lng], 11)
    } else {
      map.setView([54.5, -3.5], 5) // UK overview
    }

    // SPA navigation for popup links
    const clickHandler = (e) => {
      const link = e.target.closest('.map-popup-link')
      if (link) {
        e.preventDefault()
        navigate(`/practitioners/${link.dataset.id}`)
      }
    }
    containerRef.current.addEventListener('click', clickHandler)
    const node = containerRef.current
    return () => node.removeEventListener('click', clickHandler)
  }, [practitioners, center, navigate])

  useEffect(() => () => {
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        height: 520,
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--surface-border)',
        overflow: 'hidden',
        zIndex: 1,
      }}
    />
  )
}
