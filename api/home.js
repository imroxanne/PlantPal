import { requireAuth } from './_lib/auth.js'

export default async function handler(req, res) {
  try {
    const user = await requireAuth(req)
    res.json({
      user: {
        id: user.id,
        display_name: user.display_name,
        telegram_id: user.telegram_id,
        role: user.role,
      },
    })
  } catch (e) {
    const status = e.message === 'Unauthorized' ? 401 : 500
    res.status(status).json({ error: e.message })
  }
}
