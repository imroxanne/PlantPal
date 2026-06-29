import { useState } from 'react'
import { api } from '../utils/api'
import './AddPlantDetails.css'

export default function AddPlantDetails({ plant, onAdded, onBack }) {
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  if (!plant) return null

  const handleAdd = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.addUserPlant(plant.id, nickname.trim())
      onAdded()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="add-details">
      <div className="add-details-header">
        <h1>Новое растение</h1>
      </div>

      <div className="add-details-body">
        <div className="add-details-icon">🌿</div>

        <div className="add-details-plant-name">{plant.common_name}</div>
        {plant.latin_name && (
          <div className="add-details-plant-latin">{plant.latin_name}</div>
        )}

        <div className="add-details-info">
          <div className="add-details-info-item">
            <span className="add-details-info-icon">💧</span>
            <span className="add-details-info-label">Полив</span>
            <span className="add-details-info-value">
              каждые {plant.watering_interval_days} дн.
            </span>
          </div>
          {plant.category && (
            <div className="add-details-info-item">
              <span className="add-details-info-icon">🏷</span>
              <span className="add-details-info-label">Категория</span>
              <span className="add-details-info-value">{plant.category}</span>
            </div>
          )}
        </div>

        <div className="add-details-nickname">
          <label>Дайте имя растению</label>
          <input
            type="text"
            placeholder="Например, Монти"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={50}
            autoComplete="off"
          />
          <span className="add-details-nickname-hint">Необязательно — можно оставить пустым</span>
        </div>

        <div className="add-details-actions">
          <button
            className="btn-primary"
            onClick={handleAdd}
            disabled={saving}
          >
            {saving ? 'Добавляю...' : 'Добавить в коллекцию'}
          </button>
        </div>

        {error && <div className="add-details-error">{error}</div>}
      </div>
    </div>
  )
}
