/**
 * Vercel serverless function: fetch Google Business Profile reviews
 * for a practitioner via the Google Places API (New).
 *
 * GET /api/google-reviews?place_id=ChIJ...
 *
 * Requires env var GOOGLE_PLACES_API_KEY (set in Vercel dashboard).
 * Responses are edge-cached for 6 hours to keep API costs near zero.
 */
export default async function handler(req, res) {
  const { place_id } = req.query

  if (!place_id) {
    return res.status(400).json({ error: 'place_id is required' })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    // Not configured yet — return empty so the UI hides gracefully
    return res.status(200).json({ configured: false })
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(place_id)}`
    const response = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri,displayName',
      },
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('Places API error:', response.status, body)
      return res.status(200).json({ configured: true, error: 'place_not_found' })
    }

    const data = await response.json()

    const payload = {
      configured: true,
      rating: data.rating ?? null,
      total: data.userRatingCount ?? 0,
      mapsUrl: data.googleMapsUri ?? null,
      reviews: (data.reviews || []).slice(0, 5).map(r => ({
        author: r.authorAttribution?.displayName || 'Google user',
        rating: r.rating,
        text: r.text?.text || r.originalText?.text || '',
        relativeTime: r.relativePublishTimeDescription || '',
      })),
    }

    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400')
    return res.status(200).json(payload)
  } catch (err) {
    console.error(err)
    return res.status(200).json({ configured: true, error: 'fetch_failed' })
  }
}
