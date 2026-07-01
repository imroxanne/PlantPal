import { requireAuth } from './_lib/auth.js'
import { getSupabase } from './_lib/supabase.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 3 * 1024 * 1024

export default async function handler(req, res) {
  try {
    const user = await requireAuth(req)
    const sb = getSupabase()

    if (req.method === 'POST') {
      const { id, photo, content_type } = req.body || {}

      if (!id || !UUID_RE.test(id))
        return res.status(400).json({ error: 'Invalid plant id' })
      if (!photo || !content_type)
        return res.status(400).json({ error: 'photo and content_type are required' })
      if (!ALLOWED_TYPES.includes(content_type))
        return res.status(400).json({ error: 'Можно загрузить только изображение (JPEG, PNG, WebP)' })

      const buffer = Buffer.from(photo, 'base64')
      if (buffer.length > MAX_SIZE)
        return res.status(400).json({ error: 'Файл слишком большой. Максимум 3 МБ.' })

      const { data: plant, error: fetchErr } = await sb
        .from('user_plants')
        .select('id, user_id')
        .eq('id', id)
        .maybeSingle()

      if (fetchErr) throw new Error(`Database error: ${fetchErr.message}`)
      if (!plant) return res.status(404).json({ error: 'Растение не найдено' })
      if (plant.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' })

      const path = `${user.id}/${id}/photo`

      const { error: uploadErr } = await sb.storage.from('plant-photos').upload(path, buffer, {
        contentType: content_type,
        upsert: true,
      })
      if (uploadErr) throw new Error(`Storage error: ${uploadErr.message}`)

      const { data: urlData } = sb.storage.from('plant-photos').getPublicUrl(path)
      const photo_url = urlData.publicUrl + '?t=' + Date.now()

      const { error: updateErr } = await sb
        .from('user_plants')
        .update({ photo_url })
        .eq('id', id)
      if (updateErr) throw new Error(`Database error: ${updateErr.message}`)

      return res.json({ photo_url })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query

      if (!id || !UUID_RE.test(id))
        return res.status(400).json({ error: 'Invalid plant id' })

      const { data: plant, error: fetchErr } = await sb
        .from('user_plants')
        .select('id, user_id')
        .eq('id', id)
        .maybeSingle()

      if (fetchErr) throw new Error(`Database error: ${fetchErr.message}`)
      if (!plant) return res.status(404).json({ error: 'Растение не найдено' })
      if (plant.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' })

      const path = `${user.id}/${id}/photo`
      await sb.storage.from('plant-photos').remove([path])

      const { error: updateErr } = await sb
        .from('user_plants')
        .update({ photo_url: null })
        .eq('id', id)
      if (updateErr) throw new Error(`Database error: ${updateErr.message}`)

      return res.json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    const msg = e.message
    const status = msg === 'Unauthorized' ? 401 : 500
    if (status === 500) console.error('/api/user-plant-photo error:', msg)
    res.status(status).json({ error: msg })
  }
}
