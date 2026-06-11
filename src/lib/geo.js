export async function resolveLocation(query) {
  const trimmed = query.trim()
  if (!trimmed) return null

  // Try postcode lookup first
  const postcodeRes = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(trimmed)}`
  )

  if (postcodeRes.ok) {
    const { result } = await postcodeRes.json()
    return {
      lat: result.latitude,
      lng: result.longitude,
      display: result.admin_district || result.parish || trimmed.toUpperCase(),
    }
  }

  // Fallback: partial postcode
  const partialRes = await fetch(
    `https://api.postcodes.io/outcodes/${encodeURIComponent(trimmed)}`
  )

  if (partialRes.ok) {
    const { result } = await partialRes.json()
    return {
      lat: result.latitude,
      lng: result.longitude,
      display: trimmed.toUpperCase(),
    }
  }

  return null
}

export function kmToMiles(km) {
  return (km * 0.621371).toFixed(1)
}

export function distanceLabel(km) {
  const miles = km * 0.621371
  if (miles < 0.1) return 'Nearby'
  if (miles < 1) return `${(miles * 1760).toFixed(0)} yds`
  return `${miles.toFixed(1)} mi`
}
