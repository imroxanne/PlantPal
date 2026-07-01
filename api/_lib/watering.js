const DAY_MS = 24 * 60 * 60 * 1000

export function getEffectiveInterval(userPlant) {
  if (userPlant.custom_watering_interval_min_days && userPlant.custom_watering_interval_max_days) {
    return {
      min: userPlant.custom_watering_interval_min_days,
      max: userPlant.custom_watering_interval_max_days,
      isRange: true,
    }
  }
  const exact = userPlant.custom_watering_interval_days
    || userPlant.plant?.watering_interval_days
  if (!exact) return null
  return { min: exact, max: exact, isRange: false }
}

export function calcWateringDates(fromDate, interval) {
  if (!interval) return { next_watering_at: null, next_watering_window_end_at: null }
  const from = new Date(fromDate)
  const windowStart = new Date(from.getTime() + interval.min * DAY_MS).toISOString()
  const windowEnd = interval.isRange
    ? new Date(from.getTime() + interval.max * DAY_MS).toISOString()
    : null
  return { next_watering_at: windowStart, next_watering_window_end_at: windowEnd }
}

export function buildIntervalUpdates(body, existing) {
  const updates = {}
  const { custom_watering_interval_days, custom_watering_interval_min_days, custom_watering_interval_max_days } = body

  const minVal = custom_watering_interval_min_days !== undefined
    ? (custom_watering_interval_min_days && Number(custom_watering_interval_min_days) > 0 ? Number(custom_watering_interval_min_days) : null)
    : undefined
  const maxVal = custom_watering_interval_max_days !== undefined
    ? (custom_watering_interval_max_days && Number(custom_watering_interval_max_days) > 0 ? Number(custom_watering_interval_max_days) : null)
    : undefined

  if (minVal !== undefined && maxVal !== undefined && minVal && maxVal) {
    if (maxVal < minVal) {
      return { error: 'max_days must be >= min_days' }
    }
    updates.custom_watering_interval_min_days = minVal
    updates.custom_watering_interval_max_days = maxVal
    updates.custom_watering_interval_days = minVal
  } else if (custom_watering_interval_days !== undefined) {
    const exactVal = custom_watering_interval_days && Number(custom_watering_interval_days) > 0
      ? Number(custom_watering_interval_days) : null
    updates.custom_watering_interval_days = exactVal
    updates.custom_watering_interval_min_days = null
    updates.custom_watering_interval_max_days = null
  } else if (minVal !== undefined || maxVal !== undefined) {
    if (minVal === null && maxVal === null) {
      updates.custom_watering_interval_days = null
      updates.custom_watering_interval_min_days = null
      updates.custom_watering_interval_max_days = null
    } else if (minVal && !maxVal) {
      updates.custom_watering_interval_days = minVal
      updates.custom_watering_interval_min_days = null
      updates.custom_watering_interval_max_days = null
    }
  }

  if (Object.keys(updates).length > 0) {
    const merged = { ...existing, ...updates }
    const interval = getEffectiveInterval(merged)
    const fromDate = existing.last_watered || new Date().toISOString()
    const dates = calcWateringDates(fromDate, interval)
    Object.assign(updates, dates)
  }

  return { updates }
}
