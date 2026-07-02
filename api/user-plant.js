import { requireAuth } from './_lib/auth.js'
import { getSupabase } from './_lib/supabase.js'
import { getEffectiveInterval, calcWateringDates, buildIntervalUpdates } from './_lib/watering.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const PLANT_SELECT = `
  id, user_id, nickname, last_watered, next_watering_at, next_watering_window_end_at,
  notes, location, custom_watering_interval_days,
  custom_watering_interval_min_days, custom_watering_interval_max_days,
  fertilizing_interval_days, last_fertilized_at, next_fertilizing_at,
  repotting_interval_days, last_repotted_at, next_repotting_at,
  photo_url, created_at,
  plant:plants(id, common_name, latin_name, category, description,
    watering_interval_days, light, humidity, temperature, soil,
    fertilizing, toxicity, image_url)
`

async function refetchPlantWithEvents(sb, id, userId) {
  const { data: updated, error: refetchErr } = await sb
    .from('user_plants')
    .select(PLANT_SELECT)
    .eq('id', id)
    .single()
  if (refetchErr) throw new Error(`Database error: ${refetchErr.message}`)

  const { data: events } = await sb
    .from('care_events')
    .select('id, type, note, created_at')
    .eq('user_plant_id', id)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  return { user_plant: updated, care_events: events || [] }
}

async function handleGetPlant(req, res, user, sb, id) {
  const { data: userPlant, error } = await sb
    .from('user_plants')
    .select(PLANT_SELECT)
    .eq('id', id)
    .eq('is_archived', false)
    .maybeSingle()

  if (error) throw new Error(`Database error: ${error.message}`)
  if (!userPlant) return res.status(404).json({ error: 'Plant not found' })
  if (userPlant.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' })

  const { data: events, error: eventsErr } = await sb
    .from('care_events')
    .select('id, type, note, created_at')
    .eq('user_plant_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (eventsErr) throw new Error(`Database error: ${eventsErr.message}`)

  res.setHeader('Cache-Control', 'no-store')
  res.json({ user_plant: userPlant, care_events: events || [] })
}

async function handlePatchPlant(req, res, user, sb, id) {
  const { data: existing, error: fetchErr } = await sb
    .from('user_plants')
    .select(`id, user_id, last_watered,
      custom_watering_interval_days, custom_watering_interval_min_days,
      custom_watering_interval_max_days,
      fertilizing_interval_days, last_fertilized_at,
      repotting_interval_days, last_repotted_at,
      plant:plants(watering_interval_days)`)
    .eq('id', id)
    .eq('is_archived', false)
    .maybeSingle()

  if (fetchErr) throw new Error(`Database error: ${fetchErr.message}`)
  if (!existing) return res.status(404).json({ error: 'Plant not found' })
  if (existing.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' })

  const body = req.body || {}
  const updates = {}
  if (body.nickname !== undefined) updates.nickname = body.nickname?.trim() || null
  if (body.location !== undefined) updates.location = body.location?.trim() || null
  if (body.notes !== undefined) updates.notes = body.notes?.trim() || null

  const hasIntervalChange = body.custom_watering_interval_days !== undefined
    || body.custom_watering_interval_min_days !== undefined
    || body.custom_watering_interval_max_days !== undefined

  if (hasIntervalChange) {
    const result = buildIntervalUpdates(body, existing)
    if (result.error) return res.status(400).json({ error: result.error })
    Object.assign(updates, result.updates)
  }

  if (body.fertilizing_interval_days !== undefined) {
    const val = body.fertilizing_interval_days
    if (val === null) {
      updates.fertilizing_interval_days = null
      updates.next_fertilizing_at = null
    } else {
      const days = Number(val)
      if (!Number.isInteger(days) || days < 1 || days > 730)
        return res.status(400).json({ error: 'fertilizing_interval_days must be 1–730' })
      updates.fertilizing_interval_days = days
      const fromDate = existing.last_fertilized_at || new Date().toISOString()
      updates.next_fertilizing_at = new Date(new Date(fromDate).getTime() + days * 86400000).toISOString()
    }
  }

  if (body.repotting_interval_days !== undefined) {
    const val = body.repotting_interval_days
    if (val === null) {
      updates.repotting_interval_days = null
      updates.next_repotting_at = null
    } else {
      const days = Number(val)
      if (!Number.isInteger(days) || days < 1 || days > 730)
        return res.status(400).json({ error: 'repotting_interval_days must be 1–730' })
      updates.repotting_interval_days = days
      const fromDate = existing.last_repotted_at || new Date().toISOString()
      updates.next_repotting_at = new Date(new Date(fromDate).getTime() + days * 86400000).toISOString()
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' })
  }

  const { error: updateErr } = await sb.from('user_plants').update(updates).eq('id', id)
  if (updateErr) throw new Error(`Database error: ${updateErr.message}`)

  const { data: updated, error: refetchErr } = await sb
    .from('user_plants')
    .select(PLANT_SELECT)
    .eq('id', id)
    .single()
  if (refetchErr) throw new Error(`Database error: ${refetchErr.message}`)

  res.json({ user_plant: updated })
}

async function handleWater(req, res, user, sb, id) {
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
  if (!userPlant) return res.status(404).json({ error: 'Plant not found' })
  if (userPlant.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' })

  const now = new Date()
  const interval = getEffectiveInterval(userPlant)
  const dates = calcWateringDates(now, interval)

  const { error: eventErr } = await sb
    .from('care_events')
    .insert({ user_plant_id: id, user_id: user.id, type: 'watering' })
  if (eventErr) throw new Error(`Database error: ${eventErr.message}`)

  const { error: updateErr } = await sb
    .from('user_plants')
    .update({ last_watered: now.toISOString(), ...dates })
    .eq('id', id)
  if (updateErr) throw new Error(`Database error: ${updateErr.message}`)

  const result = await refetchPlantWithEvents(sb, id, user.id)
  res.json(result)
}

async function handleEvents(req, res, user, sb, id) {
  const { type, note } = req.body || {}
  const validTypes = ['watering', 'fertilizing', 'repotting', 'check', 'note']
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid event type' })
  }

  const { data: userPlant, error: fetchErr } = await sb
    .from('user_plants')
    .select(`id, user_id, plant_id,
      custom_watering_interval_days, custom_watering_interval_min_days,
      custom_watering_interval_max_days,
      fertilizing_interval_days, repotting_interval_days,
      plant:plants(watering_interval_days)`)
    .eq('id', id)
    .eq('is_archived', false)
    .maybeSingle()

  if (fetchErr) throw new Error(`Database error: ${fetchErr.message}`)
  if (!userPlant) return res.status(404).json({ error: 'Plant not found' })
  if (userPlant.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' })

  const { error: eventErr } = await sb
    .from('care_events')
    .insert({ user_plant_id: id, user_id: user.id, type, note: note?.trim() || null })
  if (eventErr) throw new Error(`Database error: ${eventErr.message}`)

  const now = new Date()
  if (type === 'watering') {
    const interval = getEffectiveInterval(userPlant)
    const dates = calcWateringDates(now, interval)
    const { error: updateErr } = await sb
      .from('user_plants')
      .update({ last_watered: now.toISOString(), ...dates })
      .eq('id', id)
    if (updateErr) throw new Error(`Database error: ${updateErr.message}`)
  } else if (type === 'fertilizing' && userPlant.fertilizing_interval_days) {
    const nextAt = new Date(now.getTime() + userPlant.fertilizing_interval_days * 86400000).toISOString()
    const { error: updateErr } = await sb
      .from('user_plants')
      .update({ last_fertilized_at: now.toISOString(), next_fertilizing_at: nextAt })
      .eq('id', id)
    if (updateErr) throw new Error(`Database error: ${updateErr.message}`)
  } else if (type === 'repotting' && userPlant.repotting_interval_days) {
    const nextAt = new Date(now.getTime() + userPlant.repotting_interval_days * 86400000).toISOString()
    const { error: updateErr } = await sb
      .from('user_plants')
      .update({ last_repotted_at: now.toISOString(), next_repotting_at: nextAt })
      .eq('id', id)
    if (updateErr) throw new Error(`Database error: ${updateErr.message}`)
  }

  const result = await refetchPlantWithEvents(sb, id, user.id)
  res.json(result)
}

async function handleArchive(req, res, user, sb, id) {
  const { data: userPlant, error: fetchErr } = await sb
    .from('user_plants')
    .select('id, user_id')
    .eq('id', id)
    .eq('is_archived', false)
    .maybeSingle()

  if (fetchErr) throw new Error(`Database error: ${fetchErr.message}`)
  if (!userPlant) return res.status(404).json({ error: 'Plant not found' })
  if (userPlant.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' })

  const { error: updateErr } = await sb
    .from('user_plants')
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq('id', id)
  if (updateErr) throw new Error(`Database error: ${updateErr.message}`)

  res.json({ success: true })
}

async function handleUnarchive(req, res, user, sb, id) {
  const { data: userPlant, error: fetchErr } = await sb
    .from('user_plants')
    .select(`id, user_id, is_archived, last_watered,
      custom_watering_interval_days, custom_watering_interval_min_days,
      custom_watering_interval_max_days,
      fertilizing_interval_days, last_fertilized_at,
      repotting_interval_days, last_repotted_at,
      plant:plants(watering_interval_days)`)
    .eq('id', id)
    .eq('is_archived', true)
    .maybeSingle()

  if (fetchErr) throw new Error(`Database error: ${fetchErr.message}`)
  if (!userPlant) return res.status(404).json({ error: 'Archived plant not found' })
  if (userPlant.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' })

  const now = new Date()
  const interval = getEffectiveInterval(userPlant)
  const baseDate = userPlant.last_watered || now
  const dates = calcWateringDates(baseDate, interval)

  if (userPlant.fertilizing_interval_days) {
    const fromDate = userPlant.last_fertilized_at || now
    dates.next_fertilizing_at = new Date(new Date(fromDate).getTime() + userPlant.fertilizing_interval_days * 86400000).toISOString()
  }
  if (userPlant.repotting_interval_days) {
    const fromDate = userPlant.last_repotted_at || now
    dates.next_repotting_at = new Date(new Date(fromDate).getTime() + userPlant.repotting_interval_days * 86400000).toISOString()
  }

  const { error: updateErr } = await sb
    .from('user_plants')
    .update({ is_archived: false, archived_at: null, ...dates })
    .eq('id', id)
  if (updateErr) throw new Error(`Database error: ${updateErr.message}`)

  res.json({ success: true })
}

export default async function handler(req, res) {
  try {
    const user = await requireAuth(req)
    const sb = getSupabase()

    const { id, action } = req.query

    if (!id || !UUID_RE.test(id)) {
      return res.status(400).json({ error: 'Invalid plant id' })
    }

    if (!action) {
      if (req.method === 'GET') return handleGetPlant(req, res, user, sb, id)
      if (req.method === 'PATCH') return handlePatchPlant(req, res, user, sb, id)
      return res.status(405).json({ error: 'Method not allowed' })
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    switch (action) {
      case 'water': return handleWater(req, res, user, sb, id)
      case 'events': return handleEvents(req, res, user, sb, id)
      case 'archive': return handleArchive(req, res, user, sb, id)
      case 'unarchive': return handleUnarchive(req, res, user, sb, id)
      default: return res.status(400).json({ error: 'Unknown action' })
    }
  } catch (e) {
    const msg = e.message
    const status = msg === 'Unauthorized' ? 401 : 500
    if (status === 500) console.error('/api/user-plant error:', msg)
    res.status(status).json({ error: msg })
  }
}
