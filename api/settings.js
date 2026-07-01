import { requireAuth } from './_lib/auth.js'
import { getSupabase } from './_lib/supabase.js'

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
        reminders_enabled: !!data.notification_time,
      })
      return
    }

    const { reminders_enabled } = req.body || {}

    if (typeof reminders_enabled !== 'boolean') {
      res.status(400).json({ error: 'reminders_enabled must be a boolean' })
      return
    }

    const updates = {
      notification_time: reminders_enabled ? '07:00' : null,
    }

    const { error } = await sb
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (error) throw new Error(`Database error: ${error.message}`)

    res.json({ reminders_enabled })
  } catch (e) {
    const msg = e.message
    const status = msg === 'Unauthorized' ? 401 : 500
    if (status === 500) console.error('/api/settings error:', msg)
    res.status(status).json({ error: msg })
  }
}
