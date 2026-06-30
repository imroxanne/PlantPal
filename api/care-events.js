import { requireAuth } from './_lib/auth.js'
import { getSupabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const user = await requireAuth(req)
    const sb = getSupabase()

    const { data, error } = await sb
      .from('care_events')
      .select('id, type, note, created_at, user_plant:user_plants(id, nickname, plant:plants(common_name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw new Error(`Database error: ${error.message}`)

    res.json({ care_events: data || [] })
  } catch (e) {
    const msg = e.message
    const status = msg === 'Unauthorized' ? 401 : 500
    if (status === 500) console.error('/api/care-events error:', msg)
    res.status(status).json({ error: msg })
  }
}
