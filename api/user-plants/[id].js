import { requireAuth } from '../_lib/auth.js'
import { getSupabase } from '../_lib/supabase.js'

const PLANT_SELECT = `
  id, user_id, nickname, last_watered, next_watering_at, notes, location,
  custom_watering_interval_days, created_at,
  plant:plants(id, common_name, latin_name, category, description,
    watering_interval_days, light, humidity, temperature, soil,
    fertilizing, toxicity, image_url)
`

export default async function handler(req, res) {
  try {
    const user = await requireAuth(req)
    const sb = getSupabase()
    const { id } = req.query

    if (req.method === 'GET') {
      const { data: userPlant, error } = await sb
        .from('user_plants')
        .select(PLANT_SELECT)
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
        .limit(5)

      if (eventsErr) throw new Error(`Database error: ${eventsErr.message}`)

      res.json({ user_plant: userPlant, care_events: events || [] })
      return
    }

    if (req.method === 'PATCH') {
      const { data: existing, error: fetchErr } = await sb
        .from('user_plants')
        .select('id, user_id')
        .eq('id', id)
        .eq('is_archived', false)
        .maybeSingle()

      if (fetchErr) throw new Error(`Database error: ${fetchErr.message}`)
      if (!existing) {
        res.status(404).json({ error: 'Plant not found' })
        return
      }
      if (existing.user_id !== user.id) {
        res.status(403).json({ error: 'Forbidden' })
        return
      }

      const { nickname, location, notes, custom_watering_interval_days } = req.body || {}
      const updates = {}
      if (nickname !== undefined) updates.nickname = nickname?.trim() || null
      if (location !== undefined) updates.location = location?.trim() || null
      if (notes !== undefined) updates.notes = notes?.trim() || null
      if (custom_watering_interval_days !== undefined) {
        updates.custom_watering_interval_days =
          custom_watering_interval_days && Number(custom_watering_interval_days) > 0
            ? Number(custom_watering_interval_days)
            : null
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ error: 'No fields to update' })
        return
      }

      const { error: updateErr } = await sb
        .from('user_plants')
        .update(updates)
        .eq('id', id)

      if (updateErr) throw new Error(`Database error: ${updateErr.message}`)

      const { data: updated, error: refetchErr } = await sb
        .from('user_plants')
        .select(PLANT_SELECT)
        .eq('id', id)
        .single()

      if (refetchErr) throw new Error(`Database error: ${refetchErr.message}`)

      res.json({ user_plant: updated })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const msg = e.message
    const status = msg === 'Unauthorized' ? 401 : 500
    if (status === 500) console.error('/api/user-plants/[id] error:', msg)
    res.status(status).json({ error: msg })
  }
}
