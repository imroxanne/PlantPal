import { requireAuth } from './_lib/auth.js'
import { getSupabase } from './_lib/supabase.js'

function escapeIlike(str) {
  return str.replace(/[\\%_]/g, (ch) => '\\' + ch)
}

export default async function handler(req, res) {
  try {
    await requireAuth(req)
    const sb = getSupabase()
    const q = (req.query.q || '').trim().slice(0, 80)

    let query = sb
      .from('plants')
      .select('id, common_name, latin_name, category, watering_interval_days, image_url')
      .eq('status', 'published')
      .order('common_name')

    if (q.length >= 2) {
      const escaped = escapeIlike(q)
      query = query.or(`common_name.ilike.%${escaped}%,latin_name.ilike.%${escaped}%`)
    }

    const { data, error } = await query.limit(20)
    if (error) throw new Error(`Database error: ${error.message}`)

    res.setHeader('Cache-Control', 'no-store')
    res.json({ plants: data })
  } catch (e) {
    const msg = e.message
    const status = msg === 'Unauthorized' ? 401 : 500
    if (status === 500) console.error('/api/plants error:', msg)
    res.status(status).json({ error: msg })
  }
}
