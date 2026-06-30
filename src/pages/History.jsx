import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { EVENT_LABELS, EVENT_ICONS, formatEventDate } from '../utils/status'
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

export default function History() {
  const [events, setEvents] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getCareEvents()
      .then((d) => setEvents(d.care_events))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>История</h1>
      </div>

      {loading && (
        <div className="history-skeleton">
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
          <p>Здесь появится история ухода за растениями</p>
        </div>
      )}

      {!loading && !error && events?.length > 0 && (
        <div className="history-body">
          {groupByDate(events).map((group) => (
            <div key={group.label} className="history-group">
              <div className="history-group-label">{group.label}</div>
              <div className="history-group-list">
                {group.events.map((ev) => {
                  const plantName =
                    ev.user_plant?.nickname || ev.user_plant?.plant?.common_name || '—'
                  return (
                    <div key={ev.id} className="history-item">
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
    </div>
  )
}
