import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { formatNextWatering } from '../utils/status'
import PlantAvatar from '../components/PlantAvatar'
import './Tasks.css'

const GROUP_META = {
  overdue: { title: 'Просрочено', color: 'var(--danger)', dotColor: '#C0392B' },
  today: { title: 'Сегодня', color: 'var(--water-blue)', dotColor: '#7BA7BC' },
  tomorrow: { title: 'Завтра', color: 'var(--text-primary)', dotColor: '#9E9E9E' },
  week: { title: 'На этой неделе', color: 'var(--text-primary)', dotColor: '#9E9E9E' },
}

function SkeletonTasks() {
  return (
    <div className="tasks-skeleton">
      {[0, 1, 2].map((i) => (
        <div key={i} className="task-skeleton-card">
          <div className="skel" style={{ width: 40, height: 40, borderRadius: 10 }} />
          <div style={{ flex: 1 }}>
            <div className="skel" style={{ width: '60%', height: 14, borderRadius: 5 }} />
            <div className="skel" style={{ width: '40%', height: 11, borderRadius: 5, marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Tasks({ onPlantTap, onShowToast, onTaskCountChange }) {
  const [tasks, setTasks] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completing, setCompleting] = useState(null)

  useEffect(() => {
    api.getTasks()
      .then((d) => setTasks(d.tasks))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleComplete = async (e, plantId) => {
    e.stopPropagation()
    setCompleting(plantId)
    try {
      await api.createEvent(plantId, 'watering')
      setTasks((prev) => {
        const next = {}
        for (const [key, items] of Object.entries(prev)) {
          next[key] = items.filter((p) => p.id !== plantId)
        }
        return next
      })
      onTaskCountChange?.()
      onShowToast?.('Полив отмечен!')
    } catch (err) {
      onShowToast?.('Ошибка: ' + err.message, 'error')
    } finally {
      setCompleting(null)
    }
  }

  const totalTasks = tasks
    ? Object.values(tasks).reduce((sum, g) => sum + g.length, 0)
    : 0

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <h1>Задачи</h1>
        {!loading && !error && totalTasks > 0 && (
          <span className="tasks-count">{totalTasks}</span>
        )}
      </div>

      {loading && <SkeletonTasks />}

      {error && (
        <div className="error-state">
          <div className="error-state-icon">😔</div>
          <p>Не удалось загрузить задачи</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Попробовать снова
          </button>
        </div>
      )}

      {!loading && !error && totalTasks === 0 && (
        <div className="tasks-empty">
          <div className="tasks-empty-icon">🌿</div>
          <h2>Всё в порядке</h2>
          <p>Сегодня ничего делать не нужно</p>
        </div>
      )}

      {!loading && !error && tasks && (
        <div className="tasks-body">
          {['overdue', 'today', 'tomorrow', 'week'].map((groupKey) => {
            const items = tasks[groupKey]
            if (!items || items.length === 0) return null
            const meta = GROUP_META[groupKey]
            return (
              <div key={groupKey} className="tasks-group">
                <div className="tasks-group-title" style={{ color: meta.color }}>
                  <span className="tasks-group-dot" style={{ background: meta.dotColor }} />
                  {meta.title}
                  <span className="tasks-group-count">{items.length}</span>
                </div>
                <div className="tasks-group-list">
                  {items.map((up, idx) => {
                    const name = up.nickname || up.plant.common_name
                    return (
                      <div
                        key={up.id}
                        className={`task-card ${groupKey === 'overdue' ? 'task-card-overdue' : ''}`}
                        style={{ animationDelay: `${idx * 60}ms` }}
                        onClick={() => onPlantTap(up.id)}
                      >
                        <PlantAvatar name={name} imageUrl={up.plant.image_url} size={40} />
                        <div className="task-card-info">
                          <div className="task-card-name">{name}</div>
                          <div className="task-card-species">
                            {up.next_watering_window_end_at
                              ? formatNextWatering(up.next_watering_at, up.next_watering_window_end_at)
                              : up.plant.common_name}
                          </div>
                        </div>
                        <button
                          className="task-card-done"
                          onClick={(e) => handleComplete(e, up.id)}
                          disabled={completing === up.id}
                        >
                          {completing === up.id ? '...' : 'Готово'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
