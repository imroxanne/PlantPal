import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { getWateringStatus } from '../utils/status'
import { hapticSuccess, hapticError } from '../utils/telegram'
import PlantAvatar from '../components/PlantAvatar'
import './MyPlants.css'

function SkeletonCards() {
  return (
    <div className="plant-list">
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-avatar skel" />
          <div className="skeleton-lines">
            <div className="skeleton-line skeleton-line-short skel" />
            <div className="skeleton-line skeleton-line-long skel" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MyPlants({ onAdd, onPlantTap, onShowToast, onTaskCountChange, onArchive, onOpenSettings }) {
  const [userPlants, setUserPlants] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wateringId, setWateringId] = useState(null)

  useEffect(() => {
    api
      .getUserPlants()
      .then((data) => setUserPlants(data.user_plants))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleQuickWater = async (e, plantId) => {
    e.stopPropagation()
    setWateringId(plantId)
    try {
      const res = await api.createEvent(plantId, 'watering')
      setUserPlants((prev) =>
        prev.map((p) =>
          p.id === plantId
            ? { ...p, last_watered: res.user_plant.last_watered,
                next_watering_at: res.user_plant.next_watering_at,
                next_watering_window_end_at: res.user_plant.next_watering_window_end_at }
            : p
        )
      )
      onTaskCountChange?.()
      hapticSuccess()
      onShowToast?.('Полив отмечен!')
    } catch (err) {
      hapticError()
      onShowToast?.('Ошибка: ' + err.message, 'error')
    } finally {
      setWateringId(null)
    }
  }

  const count = userPlants?.length || 0

  return (
    <div className="my-plants">
      <div className="my-plants-header">
        <h1>Мои растения</h1>
        <div className="my-plants-header-right">
          {!loading && !error && count > 0 && (
            <span className="my-plants-count">{count}</span>
          )}
          {onArchive && (
            <button className="my-plants-archive-btn" onClick={onArchive}>
              📦
            </button>
          )}
          {onOpenSettings && (
            <button className="my-plants-archive-btn" onClick={onOpenSettings}>
              ⚙
            </button>
          )}
        </div>
      </div>

      {loading && <SkeletonCards />}

      {error && (
        <div className="error-state">
          <div className="error-state-icon">😔</div>
          <p>Не удалось загрузить данные</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Попробовать снова
          </button>
        </div>
      )}

      {!loading && !error && count === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🌱</div>
          <h2>Добавьте первое растение</h2>
          <p>PlantPal поможет не забыть о поливе и уходе за вашими зелёными друзьями</p>
          <button className="btn-primary" onClick={onAdd}>
            Добавить растение
          </button>
        </div>
      )}

      {!loading && !error && count > 0 && (
        <div className="plant-list">
          {userPlants.map((up, idx) => {
            const name = up.nickname || up.plant.common_name
            const status = getWateringStatus(up.next_watering_at, up.next_watering_window_end_at)
            const showWaterBtn = status.key === 'today' || status.key === 'overdue'
            return (
              <div
                key={up.id}
                className={`plant-card ${status.key === 'overdue' ? 'plant-card-overdue' : ''}`}
                style={{ animationDelay: `${idx * 60}ms` }}
                onClick={() => onPlantTap(up.id)}
              >
                <PlantAvatar name={name} imageUrl={up.plant.image_url} photoUrl={up.photo_url} size={64} />
                <div className="plant-card-info">
                  <div className="plant-card-name">{name}</div>
                  {up.nickname && (
                    <div className="plant-card-species">{up.plant.common_name}</div>
                  )}
                  <div className="plant-card-watering" style={{ color: status.color }}>
                    <span className="plant-card-dot" style={{ background: status.color }} />
                    {status.text}
                  </div>
                </div>
                <div className="plant-card-right">
                  {showWaterBtn ? (
                    <button
                      className="plant-card-water-btn"
                      onClick={(e) => handleQuickWater(e, up.id)}
                      disabled={wateringId === up.id}
                    >
                      {wateringId === up.id ? '...' : '💧'}
                    </button>
                  ) : (
                    <span className="plant-card-status" style={{ background: status.color }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
