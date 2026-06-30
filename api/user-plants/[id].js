import { requireAuth } from '../_lib/auth.js'
import { getSupabase } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const user = await requireAuth(req)
    const sb = getSupabase()
    const { id } = req.query

    const { data: userPlant, error } = await sb
      .from('user_plants')
      .select(`
        id, user_id, nickname, last_watered, next_watering_at, created_at,
        plant:plants(id, common_name, latin_name, category, description,
          watering_interval_days, light, humidity, temperature, soil,
          fertilizing, toxicity, image_url)
      `)
      .eq('id', id)
      .eq('is_archived', false)
      .maybeSingle()

    if (error) throw new Error(`Database error: ${error.message}`)

    if (!userPlant) {
      res.status(404).json({ error: 'Plant not found' })
      return
    }

    if (userPlant.user_id !== user.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const { data: events, error: eventsErr } = await sb
      .from('care_events')
      .select('id, type, note, created_at')
      .eq('user_plant_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    if (eventsErr) throw new Error(`Database error: ${eventsErr.message}`)

    res.json({ user_plant: userPlant, care_events: events || [] })
  } catch (e) {
    const msg = e.message
    const status = msg === 'Unauthorized' ? 401 : 500
    if (status === 500) console.error('/api/user-plants/[id] error:', msg)
    res.status(status).json({ error: msg })
  }
}
