import { getSupabase } from '../_lib/supabase.js'
import { getUserTasks } from '../_lib/tasks.js'
import { sendTelegramMessage } from '../_lib/telegramBot.js'

const DAY_MS = 86400000

function getUserLocalDate(timezone) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date())
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Moscow',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date())
  }
}

function alreadySentToday(lastSentAt, timezone) {
  if (!lastSentAt) return false
  const todayStr = getUserLocalDate(timezone)
  try {
    const sentStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date(lastSentAt))
    return sentStr === todayStr
  } catch {
    return false
  }
}

function formatReminderDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

const TASK_LABELS = {
  watering: 'полив',
  fertilizing: 'подкормка',
  repotting: 'пересадка',
}

function buildMessage(tasks) {
  const items = []

  for (const up of tasks.overdue) {
    const name = up.nickname || up.plant.common_name
    const label = TASK_LABELS[up.taskType] || 'полив'
    let endDate
    if (up.taskType === 'watering') {
      endDate = up.next_watering_window_end_at || up.next_watering_at
    } else if (up.taskType === 'fertilizing') {
      endDate = up.next_fertilizing_at
    } else {
      endDate = up.next_repotting_at
    }
    const overdueDays = Math.max(1, Math.round((Date.now() - new Date(endDate).getTime()) / DAY_MS))
    items.push(`• ${name} — ${label}, просрочено на ${overdueDays} дн.`)
  }

  for (const up of tasks.today) {
    const name = up.nickname || up.plant.common_name
    const label = TASK_LABELS[up.taskType] || 'полив'
    if (up.taskType === 'watering' && up.next_watering_window_end_at) {
      items.push(`• ${name} — полить до ${formatReminderDate(up.next_watering_window_end_at)}`)
    } else {
      items.push(`• ${name} — ${label}`)
    }
  }

  if (items.length === 0) return null

  const MAX_ITEMS = 7
  let lines = items.slice(0, MAX_ITEMS)
  if (items.length > MAX_ITEMS) {
    lines.push(`\nИ ещё ${items.length - MAX_ITEMS} задач.`)
  }

  return `🌿 <b>PlantPal</b>\n\nСегодня нужен уход:\n${lines.join('\n')}\n\nОткрой PlantPal, чтобы отметить уход.`
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const cronSecret = process.env.CRON_SECRET?.trim()
  if (!cronSecret) {
    res.status(500).json({ error: 'CRON_SECRET not configured' })
    return
  }

  const auth = req.headers.authorization
  if (auth !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const sb = getSupabase()
  const summary = {
    users_checked: 0,
    messages_sent: 0,
    skipped_no_tasks: 0,
    skipped_already_sent: 0,
    errors: 0,
  }

  try {
    const { data: users, error } = await sb
      .from('users')
      .select('id, telegram_id, notification_time, timezone, last_notification_sent_at')
      .not('notification_time', 'is', null)

    if (error) throw new Error(`Database error: ${error.message}`)

    summary.users_checked = (users || []).length

    for (const user of users || []) {
      try {
        const tz = user.timezone || 'Europe/Moscow'

        if (alreadySentToday(user.last_notification_sent_at, tz)) {
          summary.skipped_already_sent++
          continue
        }

        const tasks = await getUserTasks(user.id)
        const actionable = [...tasks.overdue, ...tasks.today]

        if (actionable.length === 0) {
          summary.skipped_no_tasks++
          continue
        }

        const message = buildMessage(tasks)
        if (!message) {
          summary.skipped_no_tasks++
          continue
        }

        await sendTelegramMessage(user.telegram_id, message)

        await sb
          .from('users')
          .update({ last_notification_sent_at: new Date().toISOString() })
          .eq('id', user.id)

        summary.messages_sent++
      } catch (err) {
        console.error(`Reminder error for user ${user.id}:`, err.message)
        summary.errors++
      }
    }

    res.json(summary)
  } catch (e) {
    console.error('/api/cron/send-reminders error:', e.message)
    res.status(500).json({ error: e.message })
  }
}
