import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'
import './PlantDetail.css'

const PLANT_EMOJI = ['🪴', '🌿', '🌱', '🌵', '🌸', '🍀']

function getPlantEmoji(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  return PLANT_EMOJI[Math.abs(hash) % PLANT_EMOJI.length]
}

function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function getWateringStatus(lastWatered, intervalDays) {
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

function formatEventDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Только что'
  if (diffMin < 60) return `${diffMin} мин. назад`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} ч. назад`
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

const EVENT_LABELS = { watering: 'Полив' }
const EVENT_ICONS = { watering: '💧' }

export default function PlantDetail({ userPlantId, onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [watering, setWatering] = useState(false)
  const [toast, setToast] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .getUserPlant(userPlantId)
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [userPlantId])

  useEffect(() => { load() }, [load])

  const handleWater = async () => {
    setWatering(true)
    try {
      const d = await api.waterPlant(userPlantId)
      setData(d)
      setToast('Полив отмечен!')
      setTimeout(() => setToast(null), 2500)
    } catch (e) {
      setToast('Ошибка: ' + e.message)
      setTimeout(() => setToast(null), 3000)
    } finally {
      setWatering(false)
    }
  }

  if (loading) {
    return (
      <div className="plant-detail">
        <div className="pd-header"><h1>Загрузка...</h1></div>
        <div className="pd-body">
          <div className="pd-hero-skeleton">
            <div className="pd-avatar-skeleton skel" />
            <div className="skeleton-line skeleton-line-short skel" style={{ marginTop: 16 }} />
            <div className="skeleton-line skeleton-line-long skel" style={{ marginTop: 8 }} />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="plant-detail">
        <div className="pd-header"><h1>Ошибка</h1></div>
        <div className="error-state">
          <div className="error-state-icon">😔</div>
          <p>{error}</p>
          <button className="btn-primary" onClick={load}>Попробовать снова</button>
        </div>
      </div>
    )
  }

  const up = data.user_plant
  const plant = up.plant
  const events = data.care_events || []
  const name = up.nickname || plant.common_name
  const status = getWateringStatus(up.last_watered, plant.watering_interval_days)

  const careInfo = [
    { icon: '💧', label: 'Полив', value: `каждые ${plant.watering_interval_days} дн.` },
    plant.light && { icon: '☀️', label: 'Свет', value: plant.light },
    plant.humidity && { icon: '💨', label: 'Влажность', value: plant.humidity },
    plant.temperature && { icon: '🌡', label: 'Температура', value: plant.temperature },
    plant.soil && { icon: '🪴', label: 'Грунт', value: plant.soil },
    plant.toxicity && { icon: '⚠️', label: 'Токсичность', value: plant.toxicity },
  ].filter(Boolean)

  return (
    <div className="plant-detail">
      <div className="pd-header">
        <h1>{name}</h1>
      </div>

      <div className="pd-body">
        <div className="pd-hero">
          <div className="pd-avatar">{getPlantEmoji(name)}</div>
          <div className="pd-name">{name}</div>
          {plant.latin_name && <div className="pd-latin">{plant.latin_name}</div>}
          {up.nickname && <div className="pd-species">{plant.common_name}</div>}
        </div>

        <div className="pd-status-card">
          <div className="pd-status-row">
            <span className="pd-status-dot" style={{ background: status.color }} />
            <span className="pd-status-text" style={{ color: status.color }}>{status.text}</span>
          </div>
          <div className="pd-status-dates">
            {up.last_watered && (
              <div className="pd-date-item">
                <span className="pd-date-label">Последний полив</span>
                <span className="pd-date-value">{formatDate(up.last_watered)}</span>
              </div>
            )}
            {up.next_watering_at && (
              <div className="pd-date-item">
                <span className="pd-date-label">Следующий полив</span>
                <span className="pd-date-value">{formatDate(up.next_watering_at)}</span>
              </div>
            )}
            {!up.last_watered && !up.next_watering_at && (
              <div className="pd-date-item">
                <span className="pd-date-label">Статус</span>
                <span className="pd-date-value">Нет данных о поливе</span>
              </div>
            )}
          </div>
        </div>

        <div className="pd-water-action">
          <button
            className="btn-water"
            onClick={handleWater}
            disabled={watering}
          >
            <span className="btn-water-icon">💧</span>
            {watering ? 'Сохраняю...' : 'Полил'}
          </button>
        </div>

        {careInfo.length > 0 && (
          <div className="pd-care-section">
            <div className="pd-section-title">Уход</div>
            <div className="pd-care-grid">
              {careInfo.map((item) => (
                <div key={item.label} className="pd-care-item">
                  <span className="pd-care-icon">{item.icon}</span>
                  <div className="pd-care-content">
                    <span className="pd-care-label">{item.label}</span>
                    <span className="pd-care-value">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pd-history-section">
          <div className="pd-section-title">История</div>
          {events.length === 0 ? (
            <div className="pd-history-empty">
              <span>📋</span>
              <p>Пока нет записей</p>
            </div>
          ) : (
            <div className="pd-history-list">
              {events.map((ev) => (
                <div key={ev.id} className="pd-history-item">
                  <span className="pd-history-icon">{EVENT_ICONS[ev.type] || '📋'}</span>
                  <div className="pd-history-info">
                    <span className="pd-history-type">{EVENT_LABELS[ev.type] || ev.type}</span>
                    <span className="pd-history-date">{formatEventDate(ev.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`pd-toast ${toast.startsWith('Ошибка') ? 'pd-toast-error' : ''}`}>
          {toast}
        </div>
      )}
    </div>
  )
}
