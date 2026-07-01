import { getSupabase } from './supabase.js'

const DAY_MS = 86400000

export async function getUserTasks(userId, referenceDate) {
  const sb = getSupabase()

  const { data, error } = await sb
    .from('user_plants')
    .select(`id, nickname, photo_url, last_watered, next_watering_at, next_watering_window_end_at,
      custom_watering_interval_min_days, custom_watering_interval_max_days,
      last_fertilized_at, next_fertilizing_at, fertilizing_interval_days,
      last_repotted_at, next_repotting_at, repotting_interval_days,
      plant:plants(id, common_name, latin_name, watering_interval_days, image_url)`)
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('next_watering_at', { ascending: true })

  if (error) throw new Error(`Database error: ${error.message}`)

  const now = referenceDate || new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart.getTime() + DAY_MS)
  const weekEnd = new Date(todayStart.getTime() + 7 * DAY_MS)

  const groups = { overdue: [], today: [], tomorrow: [], week: [] }

  for (const up of data || []) {
    addCareTask(groups, up, 'watering', up.next_watering_at, up.next_watering_window_end_at, todayStart, tomorrowStart, weekEnd)
    addCareTask(groups, up, 'fertilizing', up.next_fertilizing_at, null, todayStart, tomorrowStart, weekEnd)
    addCareTask(groups, up, 'repotting', up.next_repotting_at, null, todayStart, tomorrowStart, weekEnd)
  }

  return groups
}

function addCareTask(groups, up, taskType, nextAt, windowEndAt, todayStart, tomorrowStart, weekEnd) {
  if (!nextAt) return

  const task = { ...up, taskType }
  const next = new Date(nextAt)
  const windowEnd = windowEndAt ? new Date(windowEndAt) : null

  if (windowEnd) {
    if (todayStart > windowEnd) groups.overdue.push(task)
    else if (todayStart >= next && todayStart <= windowEnd) groups.today.push(task)
    else if (next < tomorrowStart) groups.today.push(task)
    else if (next < new Date(tomorrowStart.getTime() + DAY_MS)) groups.tomorrow.push(task)
    else if (next < weekEnd) groups.week.push(task)
  } else {
    if (next < todayStart) groups.overdue.push(task)
    else if (next < tomorrowStart) groups.today.push(task)
    else if (next < new Date(tomorrowStart.getTime() + DAY_MS)) groups.tomorrow.push(task)
    else if (next < weekEnd) groups.week.push(task)
  }
}
