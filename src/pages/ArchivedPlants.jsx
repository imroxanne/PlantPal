import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { isTelegramEnv, hapticSuccess, hapticError } from '../utils/telegram'
import { formatDate } from '../utils/status'
import PlantAvatar from '../components/PlantAvatar'
import './ArchivedPlants.css'

export default function ArchivedPlants({ onBack, onShowToast, onRestored }) {
  const [plants, setPlants] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [restoring, setRestoring] = useState(null)

  useEffect(() => {
    api.getArchivedPlants()
      .then((d) => setPlants(d.user_plants))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleRestore = async (e, plantId) => {
    e.stopPropagation()
    setRestoring(plantId)
    try {
      await api.unarchivePlant(plantId)
      setPlants((prev) => prev.filter((p) => p.id !== plantId))
      hapticSuccess()
      onShowToast?.('Растение восстановлено')
      onRestored?.()
    } catch (err) {
      hapticError()
      onShowToast?.('Ошибка: ' + err.message, 'error')
    } finally {
      setRestoring(null)
    }
  }

  const count = plants?.length || 0

  return (
    <div className="archived-plants">
      <div className="archived-header">
        {!isTelegramEnv() && onBack && (
          <button className="header-back-btn" onClick={onBack}>←</button>
        )}
        <h1>Архив</h1>
        {!loading && !error && count > 0 && (
          <span className="archived-count">{count}</span>
        )}
      </div>

      {loading && (
        <div className="plant-list">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-avatar skel" />
              <div className="skeleton-lines">
                <div className="skeleton-line skeleton-line-short skel" />
                <div className="skeleton-line skeleton-line-long skel" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="error-state">
          <div className="error-state-icon">😔</div>
          <p>Не удалось загрузить архив</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Попробовать снова
          </button>
        </div>
      )}

      {!loading && !error && count === 0 && (
        <div className="archived-empty">
          <div className="archived-empty-icon">📦</div>
          <h2>В архиве пока пусто</h2>
          <p>Архивированные растения появятся здесь</p>
        </div>
      )}

      {!loading && !error && count > 0 && (
        <div className="plant-list">
          {plants.map((up, idx) => {
            const name = up.nickname || up.plant.common_name
            return (
              <div
                key={up.id}
                className="plant-card archived-card"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <PlantAvatar name={name} imageUrl={up.plant.image_url} photoUrl={up.photo_url} size={64} />
                <div className="plant-card-info">
                  <div className="plant-card-name">{name}</div>
                  {up.nickname && (
                    <div className="plant-card-species">{up.plant.common_name}</div>
                  )}
                  {up.archived_at && (
                    <div className="archived-date">
                      Архив: {formatDate(up.archived_at)}
                    </div>
                  )}
                </div>
                <button
                  className="archived-restore-btn"
                  onClick={(e) => handleRestore(e, up.id)}
                  disabled={restoring === up.id}
                >
                  {restoring === up.id ? '...' : 'Вернуть'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
