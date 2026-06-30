const PLANT_EMOJI = ['🪴', '🌿', '🌱', '🌵', '🌸', '🍀']

export function getPlantEmoji(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  return PLANT_EMOJI[Math.abs(hash) % PLANT_EMOJI.length]
}

export function getWateringStatus(lastWatered, intervalDays) {
  if (!lastWatered) return { color: 'var(--unknown)', text: 'Нет даты полива', key: 'unknown' }
  const now = new Date()
  const last = new Date(lastWatered)
  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24))
  const daysLeft = intervalDays - diffDays
  if (daysLeft < 0)
    return { color: 'var(--danger)', text: `Просрочен на ${Math.abs(daysLeft)} дн.`, key: 'overdue' }
  if (daysLeft === 0)
    return { color: 'var(--water-blue)', text: 'Полить сегодня', key: 'today' }
  if (daysLeft === 1)
    return { color: 'var(--warning)', text: 'Полить завтра', key: 'soon' }
  return { color: 'var(--success)', text: `Через ${daysLeft} дн.`, key: 'ok' }
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
