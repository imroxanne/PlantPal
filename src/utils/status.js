const PLANT_EMOJI = ['🪴', '🌿', '🌱', '🌵', '🌸', '🍀']
const DAY_MS = 86400000

export function getPlantEmoji(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  return PLANT_EMOJI[Math.abs(hash) % PLANT_EMOJI.length]
}

function dayStart(date) {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function getWateringStatus(nextWateringAt, windowEndAt) {
  if (!nextWateringAt) return { color: 'var(--unknown)', text: 'Нет даты полива', key: 'unknown' }

  const today = dayStart(new Date())
  const nextDay = dayStart(nextWateringAt)

  if (windowEndAt) {
    const endDay = dayStart(windowEndAt)

    if (today > endDay) {
      const overdueDays = Math.round((today - endDay) / DAY_MS)
      return { color: 'var(--danger)', text: `Просрочен на ${overdueDays} дн.`, key: 'overdue' }
    }
    if (today >= nextDay) {
      return { color: 'var(--water-blue)', text: `Полить до ${formatDate(windowEndAt)}`, key: 'today' }
    }
    const daysLeft = Math.round((nextDay - today) / DAY_MS)
    if (daysLeft === 1) return { color: 'var(--warning)', text: 'Полить завтра', key: 'soon' }
    return { color: 'var(--success)', text: `Через ${daysLeft} дн.`, key: 'ok' }
  }

  const daysLeft = Math.round((nextDay - today) / DAY_MS)
  if (daysLeft < 0)
    return { color: 'var(--danger)', text: `Просрочен на ${Math.abs(daysLeft)} дн.`, key: 'overdue' }
  if (daysLeft === 0)
    return { color: 'var(--water-blue)', text: 'Полить сегодня', key: 'today' }
  if (daysLeft === 1)
    return { color: 'var(--warning)', text: 'Полить завтра', key: 'soon' }
  return { color: 'var(--success)', text: `Через ${daysLeft} дн.`, key: 'ok' }
}

export function formatWateringInterval(userPlant) {
  const { custom_watering_interval_min_days: min, custom_watering_interval_max_days: max,
    custom_watering_interval_days: exact } = userPlant
  const defaultInterval = userPlant.plant?.watering_interval_days

  if (min && max && min !== max) {
    return { text: `каждые ${min}–${max} дн.`, isCustom: true, isRange: true }
  }
  if (exact) {
    return { text: `каждые ${exact} дн.`, isCustom: true, isRange: false }
  }
  if (defaultInterval) {
    return { text: `каждые ${defaultInterval} дн.`, isCustom: false, isRange: false }
  }
  return { text: 'Не указан', isCustom: false, isRange: false }
}

export function formatNextWatering(nextWateringAt, windowEndAt) {
  if (!nextWateringAt) return null
  if (windowEndAt) {
    return `${formatDate(nextWateringAt)} – ${formatDate(windowEndAt)}`
  }
  return formatDate(nextWateringAt)
}

export function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function formatEventDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.floor((now - d) / 60000)
  if (diffMin < 1) return 'Только что'
  if (diffMin < 60) return `${diffMin} мин. назад`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} ч. назад`
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export const EVENT_LABELS = {
  watering: 'Полив',
  fertilizing: 'Подкормка',
  repotting: 'Пересадка',
  check: 'Проверка',
  note: 'Заметка',
}

export const EVENT_ICONS = {
  watering: '💧',
  fertilizing: '🧪',
  repotting: '🪴',
  check: '🔍',
  note: '📝',
}
