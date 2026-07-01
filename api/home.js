import { requireAuth } from './_lib/auth.js'

export default async function handler(req, res) {
  try {
    const user = await requireAuth(req)
    res.setHeader('Cache-Control', 'no-store')
    res.json({
      user: {
        id: user.id,
        display_name: user.display_name,
        telegram_id: user.telegram_id,
        role: user.role,
      },
    })
  } catch (e) {
    const msg = e.message
    const status = msg === 'Unauthorized' ? 401
      : msg === 'Forbidden' ? 403
      : 500
    if (status === 500) console.error('/api/home error:', msg)
    res.status(status).json({ error: msg })
  }
}
