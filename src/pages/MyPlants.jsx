import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import './MyPlants.css'

const PLANT_EMOJI = ['🪴', '🌿', '🌱', '🌵', '🌸', '🍀']

function getPlantEmoji(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  return PLANT_EMOJI[Math.abs(hash) % PLANT_EMOJI.length]
}

function getWateringStatus(lastWatered, intervalDays) {
  if (!lastWatered) return { color: 'var(--unknown)', text: 'Когда поливали?', key: 'unknown' }

  const now = new Date()
  const last = new Date(lastWatered)
  const diffMs = now - last
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const daysLeft = intervalDays - diffDays

  if (daysLeft < 0)
    return { color: 'var(--danger)', text: `Просрочен на ${Math.abs(daysLeft)} дн.`, key: 'overdue' }
  if (daysLeft === 0)
    return { color: 'var(--water-blue)', text: 'Полить сегодня', key: 'today' }
  if (daysLeft === 1)
    return { color: 'var(--warning)', text: 'Полить завтра', key: 'soon' }
  return { color: 'var(--success)', text: `Полить через ${daysLeft} дн.`, key: 'ok' }
}

function SkeletonCards() {
  return (
    <div className="loading-skeleton">
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-avatar skel" />
          <div style={{ flex: 1 }}>
            <div className="skeleton-line skeleton-line-short skel" />
            <div className="skeleton-line skeleton-line-long skel" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MyPlants({ onAdd }) {
  const [userPlants, setUserPlants] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .getUserPlants()
      .then((data) => setUserPlants(data.user_plants))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="my-plants">
      <div className="my-plants-header">
        <h1>Мои растения</h1>
      </div>

      {loading && <SkeletonCards />}

      {error && (
        <div className="error-state">
          <p>Не удалось загрузить данные</p>
          <button onClick={() => window.location.reload()}>Обновить</button>
        </div>
      )}

      {!loading && !error && userPlants?.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🌱</div>
          <h2>Добавьте первое растение</h2>
          <p>PlantPal возьмёт уход на себя</p>
          <button className="btn-primary" onClick={onAdd}>
            Добавить растение
          </button>
        </div>
      )}

      {!loading && !error && userPlants?.length > 0 && (
        <>
          <div className="plant-list">
            {userPlants.map((up) => {
              const name = up.nickname || up.plant.common_name
              const status = getWateringStatus(up.last_watered, up.plant.watering_interval_days)
              return (
                <div key={up.id} className="plant-card">
                  <span className="plant-card-status" style={{ background: status.color }} />
                  <div className="plant-card-avatar">{getPlantEmoji(name)}</div>
                  <div className="plant-card-info">
                    <div className="plant-card-name">{name}</div>
                    <div className="plant-card-status-text" style={{ color: status.color }}>
                      {status.text}
                    </div>
                    {up.nickname && (
                      <div className="plant-card-species">{up.plant.common_name}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="my-plants-footer">
            <button className="btn-primary" onClick={onAdd}>
              Добавить растение
            </button>
          </div>
        </>
      )}
    </div>
  )
}
