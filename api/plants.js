import { requireAuth } from './_lib/auth.js'
import { getSupabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  try {
    await requireAuth(req)
    const sb = getSupabase()
    const q = (req.query.q || '').trim()

    let query = sb
      .from('plants')
      .select('id, common_name, latin_name, category, watering_interval_days')
      .eq('status', 'published')
      .order('common_name')

    if (q.length >= 2) {
      query = query.or(`common_name.ilike.%${q}%,latin_name.ilike.%${q}%`)
    }

    const { data, error } = await query.limit(20)
    if (error) throw new Error(`Database error: ${error.message}`)

    res.json({ plants: data })
  } catch (e) {
    const msg = e.message
    const status = msg === 'Unauthorized' ? 401 : 500
    if (status === 500) console.error('/api/plants error:', msg)
    res.status(status).json({ error: msg })
  }
}
