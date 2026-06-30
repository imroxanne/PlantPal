import { requireAuth } from '../../_lib/auth.js'
import { getSupabase } from '../../_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const user = await requireAuth(req)
    const sb = getSupabase()
    const { id } = req.query

    const { data: userPlant, error: fetchErr } = await sb
      .from('user_plants')
      .select('id, user_id')
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

    const { error: updateErr } = await sb
      .from('user_plants')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateErr) throw new Error(`Database error: ${updateErr.message}`)

    res.json({ success: true })
  } catch (e) {
    const msg = e.message
    const status = msg === 'Unauthorized' ? 401 : 500
    if (status === 500) console.error('/api/user-plants/[id]/archive error:', msg)
    res.status(status).json({ error: msg })
  }
}
