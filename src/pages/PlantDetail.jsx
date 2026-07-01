import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'
import { isTelegramEnv } from '../utils/telegram'
import { getWateringStatus, formatDate, formatEventDate, EVENT_LABELS, EVENT_ICONS } from '../utils/status'
import PlantAvatar from '../components/PlantAvatar'
import './PlantDetail.css'

export default function PlantDetail({ userPlantId, onBack, onSettings, onShowToast, onTaskCountChange }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [acting, setActing] = useState(null)
  const [showMore, setShowMore] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api.getUserPlant(userPlantId)
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [userPlantId])

  useEffect(() => { load() }, [load])

  const handleAction = async (type) => {
    if (type === 'note') {
      setShowNoteInput(true)
      setShowMore(false)
      return
    }
    setActing(type)
    setShowMore(false)
    try {
      const d = await api.createEvent(userPlantId, type)
      setData(d)
      if (type === 'watering') onTaskCountChange?.()
      const labels = { watering: 'Полив отмечен!', fertilizing: 'Подкормка отмечена!', repotting: 'Пересадка отмечена!', check: 'Проверка отмечена!' }
      onShowToast?.(labels[type] || 'Отмечено!')
    } catch (e) {
      onShowToast?.('Ошибка: ' + e.message, 'error')
    } finally {
      setActing(null)
    }
  }

  const handleNote = async () => {
    if (!noteText.trim()) return
    setActing('note')
    try {
      const d = await api.createEvent(userPlantId, 'note', noteText.trim())
      setData(d)
      setNoteText('')
      setShowNoteInput(false)
      onShowToast?.('Заметка добавлена!')
    } catch (e) {
      onShowToast?.('Ошибка: ' + e.message, 'error')
    } finally {
      setActing(null)
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
  const effectiveInterval = up.custom_watering_interval_days || plant.watering_interval_days
  const status = getWateringStatus(up.last_watered, effectiveInterval)

  const careInfo = [
    { icon: '💧', label: 'Полив', value: up.custom_watering_interval_days
        ? `каждые ${up.custom_watering_interval_days} дн. (свой)`
        : `каждые ${plant.watering_interval_days} дн.` },
    plant.light && { icon: '☀️', label: 'Свет', value: plant.light },
    plant.humidity && { icon: '💨', label: 'Влажность', value: plant.humidity },
    plant.temperature && { icon: '🌡', label: 'Температура', value: plant.temperature },
    plant.soil && { icon: '🪴', label: 'Грунт', value: plant.soil },
    plant.toxicity && { icon: '⚠️', label: 'Токсичность', value: plant.toxicity },
  ].filter(Boolean)

  return (
    <div className="plant-detail">
      <div className="pd-header">
        {!isTelegramEnv() && onBack && (
          <button className="header-back-btn" onClick={onBack}>←</button>
        )}
        <h1>{name}</h1>
        <button className="pd-settings-btn" onClick={() => onSettings(up)}>
          ⚙
        </button>
      </div>

      <div className="pd-body">
        <div className="pd-hero">
          <PlantAvatar name={name} imageUrl={plant.image_url} photoUrl={up.photo_url} size={96} />
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

        <div className="pd-quick-actions">
          <button
            className="pd-action-btn pd-action-water"
            onClick={() => handleAction('watering')}
            disabled={acting === 'watering'}
          >
            <span className="pd-action-icon">💧</span>
            <span>{acting === 'watering' ? '...' : 'Полил'}</span>
          </button>
          <button
            className="pd-action-btn"
            onClick={() => handleAction('fertilizing')}
            disabled={acting === 'fertilizing'}
          >
            <span className="pd-action-icon">🧪</span>
            <span>{acting === 'fertilizing' ? '...' : 'Подкормил'}</span>
          </button>
          <button
            className="pd-action-btn"
            onClick={() => handleAction('repotting')}
            disabled={acting === 'repotting'}
          >
            <span className="pd-action-icon">🪴</span>
            <span>{acting === 'repotting' ? '...' : 'Пересадил'}</span>
          </button>
          <button
            className="pd-action-btn"
            onClick={() => setShowMore(!showMore)}
          >
            <span className="pd-action-icon">...</span>
            <span>Ещё</span>
          </button>
        </div>

        {showMore && (
          <div className="pd-more-menu">
            <button className="pd-more-item" onClick={() => handleAction('check')}>
              <span>🔍</span> Проверил растение
            </button>
            <button className="pd-more-item" onClick={() => handleAction('note')}>
              <span>📝</span> Заметка
            </button>
          </div>
        )}

        {showNoteInput && (
          <div className="pd-note-input">
            <textarea
              className="pd-note-textarea"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Текст заметки..."
              rows={3}
              maxLength={500}
              autoFocus
            />
            <div className="pd-note-actions">
              <button
                className="btn-primary pd-note-save"
                onClick={handleNote}
                disabled={!noteText.trim() || acting === 'note'}
              >
                {acting === 'note' ? 'Сохраняю...' : 'Сохранить'}
              </button>
              <button
                className="pd-note-cancel"
                onClick={() => { setShowNoteInput(false); setNoteText('') }}
              >
                Отмена
              </button>
            </div>
          </div>
        )}

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
                    {ev.note && <span className="pd-history-note">{ev.note}</span>}
                    <span className="pd-history-date">{formatEventDate(ev.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
