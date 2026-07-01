import { requireAuth } from '../../_lib/auth.js'
import { getSupabase } from '../../_lib/supabase.js'
import { getEffectiveInterval, calcWateringDates } from '../../_lib/watering.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const user = await requireAuth(req)
    const sb = getSupabase()
    const { id } = req.query

    if (!id || !UUID_RE.test(id)) {
      res.status(400).json({ error: 'Invalid plant id' })
      return
    }

    const { data: userPlant, error: fetchErr } = await sb
      .from('user_plants')
      .select(`id, user_id, is_archived, last_watered,
        custom_watering_interval_days, custom_watering_interval_min_days,
        custom_watering_interval_max_days,
        plant:plants(watering_interval_days)`)
      .eq('id', id)
      .eq('is_archived', true)
      .maybeSingle()

    if (fetchErr) throw new Error(`Database error: ${fetchErr.message}`)
    if (!userPlant) {
      res.status(404).json({ error: 'Archived plant not found' })
      return
    }
    if (userPlant.user_id !== user.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const now = new Date()
    const interval = getEffectiveInterval(userPlant)
    const baseDate = userPlant.last_watered || now
    const dates = calcWateringDates(baseDate, interval)

    const { error: updateErr } = await sb
      .from('user_plants')
      .update({
        is_archived: false,
        archived_at: null,
        ...dates,
      })
      .eq('id', id)

    if (updateErr) throw new Error(`Database error: ${updateErr.message}`)

    res.json({ success: true })
  } catch (e) {
    const msg = e.message
    const status = msg === 'Unauthorized' ? 401 : 500
    if (status === 500) console.error('/api/user-plants/[id]/unarchive error:', msg)
    res.status(status).json({ error: msg })
  }
}
