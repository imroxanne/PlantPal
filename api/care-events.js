import { requireAuth } from './_lib/auth.js'
import { getSupabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const user = await requireAuth(req)
    const sb = getSupabase()

    if (req.method === 'DELETE') {
      const { period } = req.body || {}
      if (!['today', '7d', '30d', 'all'].includes(period)) {
        res.status(400).json({ error: 'Invalid period' })
        return
      }

      let query = sb
        .from('care_events')
        .delete()
        .eq('user_id', user.id)

      if (period !== 'all') {
        const now = new Date()
        let since
        if (period === 'today') {
          since = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        } else if (period === '7d') {
          since = new Date(now.getTime() - 7 * 86400000)
        } else if (period === '30d') {
          since = new Date(now.getTime() - 30 * 86400000)
        }
        query = query.gte('created_at', since.toISOString())
      }

      const { error: delErr } = await query
      if (delErr) throw new Error(`Database error: ${delErr.message}`)

      res.json({ ok: true })
      return
    }

    const { data, error } = await sb
      .from('care_events')
      .select('id, type, note, created_at, user_plant:user_plants(id, nickname, plant:plants(common_name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw new Error(`Database error: ${error.message}`)

    res.setHeader('Cache-Control', 'no-store')
    res.json({ care_events: data || [] })
  } catch (e) {
    const msg = e.message
    const status = msg === 'Unauthorized' ? 401 : 500
    if (status === 500) console.error('/api/care-events error:', msg)
    res.status(status).json({ error: msg })
  }
}
