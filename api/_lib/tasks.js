import { getSupabase } from './supabase.js'

const DAY_MS = 86400000

export async function getUserTasks(userId, referenceDate) {
  const sb = getSupabase()

  const { data, error } = await sb
    .from('user_plants')
    .select(`id, nickname, last_watered, next_watering_at, next_watering_window_end_at,
      custom_watering_interval_min_days, custom_watering_interval_max_days,
      plant:plants(id, common_name, latin_name, watering_interval_days, image_url)`)
    .eq('user_id', userId)
    .eq('is_archived', false)
    .not('next_watering_at', 'is', null)
    .order('next_watering_at', { ascending: true })

  if (error) throw new Error(`Database error: ${error.message}`)

  const now = referenceDate || new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart.getTime() + DAY_MS)
  const weekEnd = new Date(todayStart.getTime() + 7 * DAY_MS)

  const groups = { overdue: [], today: [], tomorrow: [], week: [] }

  for (const up of data || []) {
    const windowEnd = up.next_watering_window_end_at
      ? new Date(up.next_watering_window_end_at)
      : null
    const next = new Date(up.next_watering_at)

    if (windowEnd) {
      if (todayStart > windowEnd) groups.overdue.push(up)
      else if (todayStart >= next && todayStart <= windowEnd) groups.today.push(up)
      else if (next < tomorrowStart) groups.today.push(up)
      else if (next < new Date(tomorrowStart.getTime() + DAY_MS)) groups.tomorrow.push(up)
      else if (next < weekEnd) groups.week.push(up)
    } else {
      if (next < todayStart) groups.overdue.push(up)
      else if (next < tomorrowStart) groups.today.push(up)
      else if (next < new Date(tomorrowStart.getTime() + DAY_MS)) groups.tomorrow.push(up)
      else if (next < weekEnd) groups.week.push(up)
    }
  }

  return groups
}
