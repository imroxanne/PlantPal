const DAY_MS = 86400000

export function getPlantInsights(userPlant, events) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const insights = []

  const overdueWatering = checkOverdue(
    userPlant.next_watering_at,
    userPlant.next_watering_window_end_at,
    today
  )
  if (overdueWatering) {
    insights.push({ priority: 'high', icon: '⚠️', text: 'Полив просрочен. Лучше проверить грунт сегодня.' })
  }

  if (userPlant.fertilizing_interval_days && userPlant.next_fertilizing_at) {
    if (new Date(userPlant.next_fertilizing_at) < today) {
      insights.push({ priority: 'high', icon: '⚠️', text: 'Подкормка просрочена. Проверь, нужна ли подпитка.' })
    }
  }

  if (userPlant.repotting_interval_days && userPlant.next_repotting_at) {
    if (new Date(userPlant.next_repotting_at) < today) {
      insights.push({ priority: 'high', icon: '⚠️', text: 'Пересадка просрочена. Проверь, не тесно ли корням.' })
    }
  }

  if (events.length === 0) {
    const created = new Date(userPlant.created_at)
    const daysSinceCreated = Math.floor((now - created) / DAY_MS)
    if (daysSinceCreated > 7) {
      insights.push({ priority: 'high', icon: '⚠️', text: 'Нет записей ухода. Возможно, стоит проверить растение.' })
    }
  } else {
    const latestEvent = new Date(events[0].created_at)
    const daysSinceEvent = Math.floor((now - latestEvent) / DAY_MS)
    if (daysSinceEvent > 30) {
      insights.push({ priority: 'high', icon: '⚠️', text: 'За последние 30 дней нет записей ухода. Возможно, стоит проверить растение.' })
    }
  }

  if (!overdueWatering && userPlant.next_watering_at && userPlant.next_watering_window_end_at) {
    const windowStart = new Date(userPlant.next_watering_at)
    const windowEnd = new Date(userPlant.next_watering_window_end_at)
    if (today >= windowStart && today <= windowEnd) {
      insights.push({ priority: 'medium', icon: '🌿', text: 'Сейчас подходящий период для полива.' })
    }
  }

  if (userPlant.fertilizing_interval_days && !userPlant.last_fertilized_at) {
    insights.push({ priority: 'medium', icon: '🌿', text: 'Подкормка настроена, но ещё ни разу не отмечалась.' })
  }

  if (userPlant.repotting_interval_days && !userPlant.last_repotted_at) {
    insights.push({ priority: 'medium', icon: '🌿', text: 'Пересадка настроена, но ещё ни разу не отмечалась.' })
  }

  if (!userPlant.photo_url) {
    insights.push({ priority: 'low', icon: '🌿', text: 'Добавь фото, чтобы легче узнавать растение в коллекции.' })
  }

  if (!userPlant.location) {
    insights.push({ priority: 'low', icon: '🌿', text: 'Добавь место: подоконник, стол, полка — так проще ориентироваться.' })
  }

  if (events.length > 0) {
    const latestEvent = new Date(events[0].created_at)
    const daysSinceEvent = Math.floor((now - latestEvent) / DAY_MS)
    if (daysSinceEvent <= 30 && !overdueWatering) {
      insights.push({ priority: 'low', icon: '✅', text: 'Уход идёт регулярно: есть свежие записи за последние 30 дней.' })
    }
  }

  const order = { high: 0, medium: 1, low: 2 }
  insights.sort((a, b) => order[a.priority] - order[b.priority])

  return insights.slice(0, 3)
}

function checkOverdue(nextAt, windowEndAt, today) {
  if (!nextAt) return false
  if (windowEndAt) {
    return today > new Date(windowEndAt)
  }
  return new Date(nextAt) < today
}
