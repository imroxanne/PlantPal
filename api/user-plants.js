import { requireAuth } from './_lib/auth.js'
import { getSupabase } from './_lib/supabase.js'
import { calcWateringDates } from './_lib/watering.js'

export default async function handler(req, res) {
  try {
    const user = await requireAuth(req)
    const sb = getSupabase()

    if (req.method === 'GET') {
      const showArchived = req.query.archived === 'true'
      const { data, error } = await sb
        .from('user_plants')
        .select(`id, nickname, last_watered, next_watering_at, next_watering_window_end_at,
          custom_watering_interval_days, custom_watering_interval_min_days,
          custom_watering_interval_max_days, photo_url, archived_at, created_at,
          plant:plants(id, common_name, latin_name, watering_interval_days, image_url)`)
        .eq('user_id', user.id)
        .eq('is_archived', showArchived)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Database error: ${error.message}`)
      res.setHeader('Cache-Control', 'no-store')
      res.json({ user_plants: data })
      return
    }

    if (req.method === 'POST') {
      const { plant_id, nickname } = req.body || {}
      if (!plant_id) {
        res.status(400).json({ error: 'plant_id is required' })
        return
      }

      const { data: plant, error: plantErr } = await sb
        .from('plants')
        .select('id, watering_interval_days')
        .eq('id', plant_id)
        .eq('status', 'published')
        .maybeSingle()

      if (plantErr) throw new Error(`Database error: ${plantErr.message}`)
      if (!plant) {
        res.status(404).json({ error: 'Plant not found' })
        return
      }

      const now = new Date()
      const interval = plant.watering_interval_days
        ? { min: plant.watering_interval_days, max: plant.watering_interval_days, isRange: false }
        : null
      const dates = calcWateringDates(now, interval)

      const { data: created, error: insertErr } = await sb
        .from('user_plants')
        .insert({
          user_id: user.id,
          plant_id,
          nickname: nickname?.trim() || null,
          ...dates,
        })
        .select(`id, nickname, next_watering_at, next_watering_window_end_at, photo_url, created_at,
          plant:plants(id, common_name, latin_name, watering_interval_days, image_url)`)
        .single()

      if (insertErr) throw new Error(`Database error: ${insertErr.message}`)
      res.status(201).json({ user_plant: created })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const msg = e.message
    const status = msg === 'Unauthorized' ? 401 : 500
    if (status === 500) console.error('/api/user-plants error:', msg)
    res.status(status).json({ error: msg })
  }
}
