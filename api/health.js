import { getSupabase } from './_lib/supabase.js'

export default async function handler(req, res) {
  const checks = {
    TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    database: false,
  }

  if (checks.SUPABASE_URL && checks.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const sb = getSupabase()
      const { error } = await sb.from('users').select('id').limit(1)
      checks.database = !error
      if (error) checks.database_error = error.message
    } catch (e) {
      checks.database_error = e.message
    }
  }

  const ok = checks.TELEGRAM_BOT_TOKEN && checks.database
  res.status(ok ? 200 : 503).json({ ok, checks })
}
