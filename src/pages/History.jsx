import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { EVENT_LABELS, EVENT_ICONS, formatEventDate } from '../utils/status'
import { isTelegramEnv, hapticSuccess, hapticError, hapticSelection } from '../utils/telegram'
import ConfirmDialog from '../components/ConfirmDialog'
import './History.css'

function groupByDate(events) {
  const groups = []
  let currentLabel = null
  let currentGroup = null

  for (const ev of events) {
    const d = new Date(ev.created_at)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 86400000)
    const evDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())

    let label
    if (evDate.getTime() === today.getTime()) label = 'Сегодня'
    else if (evDate.getTime() === yesterday.getTime()) label = 'Вчера'
    else label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

    if (label !== currentLabel) {
      currentLabel = label
      currentGroup = { label, events: [] }
      groups.push(currentGroup)
    }
    currentGroup.events.push(ev)
  }
  return groups
}

const PERIODS = [
  { id: 'today', label: 'За сегодня' },
  { id: '7d', label: 'За 7 дней' },
  { id: '30d', label: 'За 30 дней' },
  { id: 'all', label: 'Всю историю' },
]

export default function History({ onPlantTap, onShowToast, userPlantId, plantName, onBack }) {
  const [events, setEvents] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCleanup, setShowCleanup] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const isFiltered = !!userPlantId

  const load = () => {
    setLoading(true)
    setError(null)
    api.getCareEvents(userPlantId)
      .then((d) => setEvents(d.care_events))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSelectPeriod = (id) => {
    hapticSelection()
    setSelectedPeriod(id)
  }

  const handleDelete = async () => {
    if (!selectedPeriod) return
    setDeleting(true)
    try {
      await api.deleteCareEvents(selectedPeriod)
      setShowCleanup(false)
      setSelectedPeriod(null)
      hapticSuccess()
      onShowToast?.('История очищена')
      load()
    } catch (e) {
      hapticError()
      onShowToast?.('Ошибка: ' + e.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="history-page">
      <div className="history-header">
        {isFiltered && !isTelegramEnv() && onBack && (
          <button className="header-back-btn" onClick={onBack}>←</button>
        )}
        <h1>{isFiltered && plantName ? `История: ${plantName}` : 'История'}</h1>
        {!loading && !error && events?.length > 0 && !isFiltered && (
          <button
            className="history-cleanup-btn"
            onClick={() => { setShowCleanup(true); setSelectedPeriod(null) }}
          >
            Очистить
          </button>
        )}
      </div>

      {loading && (
        <div className="history-skeleton">
          <div className="history-skeleton-card">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="history-skeleton-item">
                <div className="skel" style={{ width: 34, height: 34, borderRadius: 10 }} />
                <div style={{ flex: 1 }}>
                  <div className="skel" style={{ width: '55%', height: 13, borderRadius: 5 }} />
                  <div className="skel" style={{ width: '70%', height: 11, borderRadius: 5, marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="error-state">
          <div className="error-state-icon">😔</div>
          <p>Не удалось загрузить историю</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Попробовать снова
          </button>
        </div>
      )}

      {!loading && !error && events?.length === 0 && (
        <div className="history-empty">
          <div className="history-empty-icon">📋</div>
          <h2>Пока нет записей</h2>
          <p>Когда вы отметите полив, подкормку или другое действие — оно появится здесь</p>
        </div>
      )}

      {!loading && !error && events?.length > 0 && (
        <div className="history-body">
          {groupByDate(events).map((group) => (
            <div key={group.label} className="history-group">
              <div className="history-group-label">{group.label}</div>
              <div className="history-group-list">
                {group.events.map((ev, idx) => {
                  const plantName =
                    ev.user_plant?.nickname || ev.user_plant?.plant?.common_name || '—'
                  const userPlantId = ev.user_plant?.id
                  return (
                    <div
                      key={ev.id}
                      className={`history-item ${userPlantId ? 'history-item-clickable' : ''}`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                      onClick={() => userPlantId && onPlantTap?.(userPlantId)}
                    >
                      <div className="history-item-icon">
                        {EVENT_ICONS[ev.type] || '📋'}
                      </div>
                      <div className="history-item-info">
                        <div className="history-item-top">
                          <span className="history-item-type">
                            {EVENT_LABELS[ev.type] || ev.type}
                          </span>
                          <span className="history-item-time">
                            {formatEventDate(ev.created_at)}
                          </span>
                        </div>
                        <div className="history-item-plant">{plantName}</div>
                        {ev.note && <div className="history-item-note">{ev.note}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      {showCleanup && (
        <div className="confirm-overlay" onClick={() => setShowCleanup(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">🗑</div>
            <div className="confirm-title">Очистить историю</div>
            <div className="confirm-text">Выберите период. Это не повлияет на расписание полива.</div>
            <div className="history-period-chips">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  className={`history-period-chip ${selectedPeriod === p.id ? 'history-period-chip-active' : ''}`}
                  onClick={() => handleSelectPeriod(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              className="confirm-btn-danger"
              onClick={handleDelete}
              disabled={!selectedPeriod || deleting}
            >
              {deleting ? 'Удаляю...' : 'Удалить'}
            </button>
            <button className="confirm-btn-cancel" onClick={() => setShowCleanup(false)}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
