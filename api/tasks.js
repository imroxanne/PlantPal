import { requireAuth } from './_lib/auth.js'
import { getUserTasks } from './_lib/tasks.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const user = await requireAuth(req)
    const groups = await getUserTasks(user.id)

    res.setHeader('Cache-Control', 'no-store')
    res.json({ tasks: groups })
  } catch (e) {
    const msg = e.message
    const status = msg === 'Unauthorized' ? 401 : 500
    if (status === 500) console.error('/api/tasks error:', msg)
    res.status(status).json({ error: msg })
  }
}
