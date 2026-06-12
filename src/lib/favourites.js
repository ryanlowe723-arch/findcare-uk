const KEY = 'findcare_favourites'

export function getFavourites() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

export function isFavourite(id) {
  return getFavourites().includes(id)
}

export function toggleFavourite(id) {
  const favs = getFavourites()
  const next = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id]
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new Event('favourites-changed'))
  return next.includes(id)
}
