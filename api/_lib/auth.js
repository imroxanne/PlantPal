import { createHmac } from 'crypto'
import { getSupabase } from './supabase.js'

export function parseTelegramInitData(initData) {
  if (!initData) return null

  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim()
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  }

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null

  params.delete('hash')
  const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b))
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n')

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest()

  const expectedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')

  if (expectedHash !== hash) return null

  const userStr = params.get('user')
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export async function getOrCreateUser(telegramUser) {
  const sb = getSupabase()
  const tid = String(telegramUser.id)

  const { data: existing, error: selectError } = await sb
    .from('users')
    .select('*')
    .eq('telegram_id', tid)
    .maybeSingle()

  if (selectError) {
    throw new Error(`Database error: ${selectError.message}`)
  }

  if (existing) {
    await sb
      .from('users')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', existing.id)
    return existing
  }

  const { data: created, error: insertError } = await sb
    .from('users')
    .insert({
      telegram_id: tid,
      display_name: telegramUser.first_name || 'Пользователь',
      role: 'user',
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(`Database error: ${insertError.message}`)
  }

  return created
}

export async function requireAuth(req) {
  const initData = req.headers['x-telegram-init-data']

  if (process.env.NODE_ENV !== 'production' && req.headers['x-dev-telegram-id']) {
    const devId = req.headers['x-dev-telegram-id']
    const user = await getOrCreateUser({ id: devId, first_name: 'Dev User' })
    if (!user) throw new Error('Failed to create dev user')
    return user
  }

  if (!initData) {
    throw new Error('Unauthorized')
  }

  const telegramUser = parseTelegramInitData(initData)
  if (!telegramUser) {
    throw new Error('Unauthorized')
  }

  const user = await getOrCreateUser(telegramUser)
  if (!user) throw new Error('Failed to get or create user')
  return user
}

export async function requireAdmin(req) {
  const user = await requireAuth(req)
  const adminId = String(process.env.ADMIN_TELEGRAM_ID || '').trim()
  if (String(user.telegram_id) !== adminId) {
    throw new Error('Forbidden')
  }
  return user
}
