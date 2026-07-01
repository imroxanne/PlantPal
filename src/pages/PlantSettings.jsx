import { useState, useMemo, useCallback, useEffect } from 'react'
import { api } from '../utils/api'
import { isTelegramEnv, hapticSuccess, hapticError, getTelegramWebApp } from '../utils/telegram'
import ConfirmDialog from '../components/ConfirmDialog'
import './PlantSettings.css'

export default function PlantSettings({ userPlant, onSaved, onArchived, onBack, onShowToast }) {
  const plant = userPlant.plant
  const [nickname, setNickname] = useState(userPlant.nickname || '')
  const [location, setLocation] = useState(userPlant.location || '')
  const [notes, setNotes] = useState(userPlant.notes || '')
  const [saving, setSaving] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)

  const hasRange = !!(userPlant.custom_watering_interval_min_days && userPlant.custom_watering_interval_max_days)
  const hasExact = !!(userPlant.custom_watering_interval_days && !hasRange)

  const initialMode = hasRange ? 'range' : hasExact ? 'exact' : 'default'
  const [intervalMode, setIntervalMode] = useState(initialMode)
  const [exactDays, setExactDays] = useState(
    hasExact ? userPlant.custom_watering_interval_days.toString() : ''
  )
  const [minDays, setMinDays] = useState(
    hasRange ? userPlant.custom_watering_interval_min_days.toString() : ''
  )
  const [maxDays, setMaxDays] = useState(
    hasRange ? userPlant.custom_watering_interval_max_days.toString() : ''
  )

  const initialNickname = userPlant.nickname || ''
  const initialLocation = userPlant.location || ''
  const initialNotes = userPlant.notes || ''
  const initialExactDays = hasExact ? userPlant.custom_watering_interval_days.toString() : ''
  const initialMinDays = hasRange ? userPlant.custom_watering_interval_min_days.toString() : ''
  const initialMaxDays = hasRange ? userPlant.custom_watering_interval_max_days.toString() : ''

  const isDirty = useMemo(() => {
    if (nickname !== initialNickname) return true
    if (location !== initialLocation) return true
    if (notes !== initialNotes) return true
    if (intervalMode !== initialMode) return true
    if (intervalMode === 'exact' && exactDays !== initialExactDays) return true
    if (intervalMode === 'range' && (minDays !== initialMinDays || maxDays !== initialMaxDays)) return true
    return false
  }, [nickname, location, notes, intervalMode, exactDays, minDays, maxDays,
      initialNickname, initialLocation, initialNotes, initialMode, initialExactDays, initialMinDays, initialMaxDays])

  const handleBack = useCallback(() => {
    if (isDirty) {
      setShowDiscardDialog(true)
    } else {
      onBack()
    }
  }, [isDirty, onBack])

  useEffect(() => {
    const tg = getTelegramWebApp()
    if (!tg) return

    tg.BackButton.onClick(handleBack)
    return () => tg.BackButton.offClick(handleBack)
  }, [handleBack])

  const displayName = userPlant.nickname || plant.common_name

  const handleSave = async () => {
    const body = {
      nickname: nickname.trim() || null,
      location: location.trim() || null,
      notes: notes.trim() || null,
    }

    if (intervalMode === 'exact') {
      const val = Number(exactDays)
      if (!exactDays || val < 1 || val > 365) {
        onShowToast?.('Укажите интервал от 1 до 365 дней', 'error')
        return
      }
      body.custom_watering_interval_days = val
      body.custom_watering_interval_min_days = null
      body.custom_watering_interval_max_days = null
    } else if (intervalMode === 'range') {
      const minVal = Number(minDays)
      const maxVal = Number(maxDays)
      if (!minDays || minVal < 1 || !maxDays || maxVal < 1) {
        onShowToast?.('Укажите оба значения диапазона', 'error')
        return
      }
      if (maxVal < minVal) {
        onShowToast?.('Максимум должен быть больше минимума', 'error')
        return
      }
      if (minVal > 365 || maxVal > 365) {
        onShowToast?.('Максимальное значение — 365 дней', 'error')
        return
      }
      body.custom_watering_interval_min_days = minVal
      body.custom_watering_interval_max_days = maxVal
    } else {
      body.custom_watering_interval_days = null
      body.custom_watering_interval_min_days = null
      body.custom_watering_interval_max_days = null
    }

    setSaving(true)
    try {
      const res = await api.updateUserPlant(userPlant.id, body)
      onSaved(res.user_plant)
      hapticSuccess()
      onShowToast?.('Сохранено')
    } catch (e) {
      hapticError()
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
          <button className="header-back-btn" onClick={handleBack}>←</button>
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

        <div className="ps-section-label">Интервал полива</div>
        <div className="ps-card">
          <div className="ps-field">
            <label className="ps-label">Стандартный интервал</label>
            <div className="ps-value-readonly">
              {plant.watering_interval_days
                ? `Каждые ${plant.watering_interval_days} дн.`
                : 'Не указан'}
            </div>
          </div>

          <div className="ps-field">
            <label className="ps-label">Мой интервал</label>
            <div className="ps-mode-chips">
              <button
                className={`ps-chip ${intervalMode === 'default' ? 'ps-chip-active' : ''}`}
                onClick={() => setIntervalMode('default')}
                type="button"
              >
                Как в каталоге
              </button>
              <button
                className={`ps-chip ${intervalMode === 'exact' ? 'ps-chip-active' : ''}`}
                onClick={() => setIntervalMode('exact')}
                type="button"
              >
                Точно
              </button>
              <button
                className={`ps-chip ${intervalMode === 'range' ? 'ps-chip-active' : ''}`}
                onClick={() => setIntervalMode('range')}
                type="button"
              >
                Диапазон
              </button>
            </div>
          </div>

          {intervalMode === 'exact' && (
            <div className="ps-field ps-field-last">
              <label className="ps-label">Каждые N дней</label>
              <input
                className="ps-input ps-input-number"
                type="number"
                min="1"
                max="365"
                value={exactDays}
                onChange={(e) => setExactDays(e.target.value)}
                placeholder={plant.watering_interval_days?.toString() || 'Дней'}
              />
            </div>
          )}

          {intervalMode === 'range' && (
            <div className="ps-field ps-field-last">
              <label className="ps-label">Диапазон (дней)</label>
              <div className="ps-range-inputs">
                <input
                  className="ps-input ps-input-number ps-range-input"
                  type="number"
                  min="1"
                  max="365"
                  value={minDays}
                  onChange={(e) => setMinDays(e.target.value)}
                  placeholder="от"
                />
                <span className="ps-range-sep">–</span>
                <input
                  className="ps-input ps-input-number ps-range-input"
                  type="number"
                  min="1"
                  max="365"
                  value={maxDays}
                  onChange={(e) => setMaxDays(e.target.value)}
                  placeholder="до"
                />
              </div>
              <span className="ps-range-hint">
                PlantPal покажет период, когда растение пора полить
              </span>
            </div>
          )}

          {intervalMode === 'default' && (
            <div className="ps-field ps-field-last">
              <span className="ps-range-hint">
                Будет использоваться стандартный интервал из каталога
              </span>
            </div>
          )}
        </div>

        <button
          className="btn-primary ps-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Сохраняю...' : 'Сохранить'}
        </button>

        <div className="ps-section-label">Опасная зона</div>
        <div className="ps-danger-zone">
          <p className="ps-danger-text">
            Растение исчезнет из активной коллекции, но история останется.
          </p>
          <button
            className="ps-archive-btn"
            onClick={() => setShowArchiveDialog(true)}
          >
            Архивировать растение
          </button>
        </div>
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

      {showDiscardDialog && (
        <ConfirmDialog
          icon="⚠️"
          title="Есть несохранённые изменения"
          text="Выйти без сохранения?"
          confirmLabel="Выйти"
          onConfirm={onBack}
          onCancel={() => setShowDiscardDialog(false)}
        />
      )}
    </div>
  )
}
