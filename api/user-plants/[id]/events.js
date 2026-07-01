import { requireAuth } from '../../_lib/auth.js'
import { getSupabase } from '../../_lib/supabase.js'
import { getEffectiveInterval, calcWateringDates } from '../../_lib/watering.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const user = await requireAuth(req)
    const sb = getSupabase()
    const { id } = req.query

    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      res.status(400).json({ error: 'Invalid plant id' })
      return
    }

    const { type, note } = req.body || {}

    const validTypes = ['watering', 'fertilizing', 'repotting', 'check', 'note']
    if (!type || !validTypes.includes(type)) {
      res.status(400).json({ error: 'Invalid event type' })
      return
    }

    const { data: userPlant, error: fetchErr } = await sb
      .from('user_plants')
      .select(`id, user_id, plant_id,
        custom_watering_interval_days, custom_watering_interval_min_days,
        custom_watering_interval_max_days,
        plant:plants(watering_interval_days)`)
      .eq('id', id)
      .eq('is_archived', false)
      .maybeSingle()

    if (fetchErr) throw new Error(`Database error: ${fetchErr.message}`)
    if (!userPlant) {
      res.status(404).json({ error: 'Plant not found' })
      return
    }
    if (userPlant.user_id !== user.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const { error: eventErr } = await sb
      .from('care_events')
      .insert({
        user_plant_id: id,
        user_id: user.id,
        type,
        note: note?.trim() || null,
      })

    if (eventErr) throw new Error(`Database error: ${eventErr.message}`)

    if (type === 'watering') {
      const now = new Date()
      const interval = getEffectiveInterval(userPlant)
      const dates = calcWateringDates(now, interval)

      const { error: updateErr } = await sb
        .from('user_plants')
        .update({
          last_watered: now.toISOString(),
          ...dates,
        })
        .eq('id', id)

      if (updateErr) throw new Error(`Database error: ${updateErr.message}`)
    }

    const { data: updated, error: refetchErr } = await sb
      .from('user_plants')
      .select(`
        id, user_id, nickname, last_watered, next_watering_at, next_watering_window_end_at,
        notes, location, custom_watering_interval_days,
        custom_watering_interval_min_days, custom_watering_interval_max_days,
        photo_url, created_at,
        plant:plants(id, common_name, latin_name, category, description,
          watering_interval_days, light, humidity, temperature, soil,
          fertilizing, toxicity, image_url)
      `)
      .eq('id', id)
      .single()

    if (refetchErr) throw new Error(`Database error: ${refetchErr.message}`)

    const { data: events } = await sb
      .from('care_events')
      .select('id, type, note, created_at')
      .eq('user_plant_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    res.json({ user_plant: updated, care_events: events || [] })
  } catch (e) {
    const msg = e.message
    const status = msg === 'Unauthorized' ? 401 : 500
    if (status === 500) console.error('/api/user-plants/[id]/events error:', msg)
    res.status(status).json({ error: msg })
  }
}
