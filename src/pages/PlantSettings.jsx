import { useState } from 'react'
import { api } from '../utils/api'
import { isTelegramEnv } from '../utils/telegram'
import ConfirmDialog from '../components/ConfirmDialog'
import './PlantSettings.css'

export default function PlantSettings({ userPlant, onSaved, onArchived, onBack, onShowToast }) {
  const plant = userPlant.plant
  const [nickname, setNickname] = useState(userPlant.nickname || '')
  const [location, setLocation] = useState(userPlant.location || '')
  const [customInterval, setCustomInterval] = useState(
    userPlant.custom_watering_interval_days?.toString() || ''
  )
  const [notes, setNotes] = useState(userPlant.notes || '')
  const [saving, setSaving] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const displayName = userPlant.nickname || plant.common_name

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.updateUserPlant(userPlant.id, {
        nickname: nickname.trim() || null,
        location: location.trim() || null,
        custom_watering_interval_days: customInterval ? Number(customInterval) : null,
        notes: notes.trim() || null,
      })
      onSaved(res.user_plant)
      onShowToast?.('Сохранено')
    } catch (e) {
      onShowToast?.('Ошибка: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    setArchiving(true)
    try {
      await api.archivePlant(userPlant.id)
      setShowArchiveDialog(false)
      onArchived()
    } catch (e) {
      setShowArchiveDialog(false)
      onShowToast?.('Ошибка: ' + e.message, 'error')
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div className="plant-settings">
      <div className="ps-header">
        {!isTelegramEnv() && onBack && (
          <button className="header-back-btn" onClick={onBack}>←</button>
        )}
        <h1>Параметры</h1>
      </div>

      <div className="ps-body">
        <div className="ps-section-label">Основное</div>
        <div className="ps-card">
          <div className="ps-field">
            <label className="ps-label">Имя</label>
            <input
              className="ps-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={plant.common_name}
              maxLength={50}
            />
          </div>
          <div className="ps-field">
            <label className="ps-label">Вид</label>
            <div className="ps-value-readonly">{plant.common_name}</div>
          </div>
          {plant.latin_name && (
            <div className="ps-field ps-field-last">
              <label className="ps-label">Латинское</label>
              <div className="ps-value-readonly">{plant.latin_name}</div>
            </div>
          )}
        </div>

        <div className="ps-section-label">Мои условия</div>
        <div className="ps-card">
          <div className="ps-field">
            <label className="ps-label">Расположение</label>
            <input
              className="ps-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Южное окно, балкон..."
              maxLength={100}
            />
          </div>
          <div className="ps-field ps-field-last">
            <label className="ps-label">Заметки</label>
            <textarea
              className="ps-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Особенности ухода, наблюдения..."
              maxLength={500}
              rows={3}
            />
          </div>
        </div>

        <div className="ps-section-label">Расписание</div>
        <div className="ps-card">
          <div className="ps-field">
            <label className="ps-label">Стандартный интервал</label>
            <div className="ps-value-readonly">
              {plant.watering_interval_days
                ? `Каждые ${plant.watering_interval_days} дн.`
                : 'Не указан'}
            </div>
          </div>
          <div className="ps-field ps-field-last">
            <label className="ps-label">Мой интервал (дней)</label>
            <input
              className="ps-input"
              type="number"
              min="1"
              max="365"
              value={customInterval}
              onChange={(e) => setCustomInterval(e.target.value)}
              placeholder={plant.watering_interval_days?.toString() || 'Дней'}
            />
          </div>
        </div>

        <button
          className="btn-primary ps-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Сохраняю...' : 'Сохранить'}
        </button>

        <button
          className="ps-archive-btn"
          onClick={() => setShowArchiveDialog(true)}
        >
          Архивировать растение
        </button>
      </div>

      {showArchiveDialog && (
        <ConfirmDialog
          icon="📦"
          title={`Архивировать ${displayName}?`}
          text="Скроется из коллекции. История и карточка сохранятся — вернуть можно в любой момент."
          confirmLabel={archiving ? 'Архивирую...' : 'Архивировать'}
          onConfirm={handleArchive}
          onCancel={() => setShowArchiveDialog(false)}
        />
      )}
    </div>
  )
}
