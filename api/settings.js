import { requireAuth } from './_lib/auth.js'
import { getSupabase } from './_lib/supabase.js'

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const user = await requireAuth(req)
    const sb = getSupabase()

    if (req.method === 'GET') {
      const { data, error } = await sb
        .from('users')
        .select('notification_time, timezone')
        .eq('id', user.id)
        .single()

      if (error) throw new Error(`Database error: ${error.message}`)

      res.setHeader('Cache-Control', 'no-store')
      res.json({
        notification_time: data.notification_time || null,
        timezone: data.timezone || 'Europe/Moscow',
        reminders_enabled: !!data.notification_time,
      })
      return
    }

    const { reminders_enabled, notification_time, timezone } = req.body || {}
    const updates = {}

    if (reminders_enabled === false) {
      updates.notification_time = null
    } else if (notification_time !== undefined) {
      if (!TIME_RE.test(notification_time)) {
        res.status(400).json({ error: 'Invalid time format, expected HH:mm' })
        return
      }
      updates.notification_time = notification_time
    }

    if (timezone !== undefined && typeof timezone === 'string' && timezone.length > 0) {
      updates.timezone = timezone
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' })
      return
    }

    const { error } = await sb
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (error) throw new Error(`Database error: ${error.message}`)

    const { data: updated, error: fetchErr } = await sb
      .from('users')
      .select('notification_time, timezone')
      .eq('id', user.id)
      .single()

    if (fetchErr) throw new Error(`Database error: ${fetchErr.message}`)

    res.json({
      notification_time: updated.notification_time || null,
      timezone: updated.timezone || 'Europe/Moscow',
      reminders_enabled: !!updated.notification_time,
    })
  } catch (e) {
    const msg = e.message
    const status = msg === 'Unauthorized' ? 401 : 500
    if (status === 500) console.error('/api/settings error:', msg)
    res.status(status).json({ error: msg })
  }
}
