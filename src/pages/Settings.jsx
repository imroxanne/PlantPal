import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { isTelegramEnv, hapticSuccess, hapticError, hapticSelection } from '../utils/telegram'
import './Settings.css'

export default function Settings({ onBack, onShowToast }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    api.getSettings()
      .then((data) => setEnabled(data.reminders_enabled))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = () => {
    hapticSelection()
    setEnabled((v) => !v)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateSettings({ reminders_enabled: enabled })
      hapticSuccess()
      onShowToast?.('Настройки сохранены')
    } catch (e) {
      hapticError()
      onShowToast?.('Ошибка: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        {!isTelegramEnv() && onBack && (
          <button className="header-back-btn" onClick={onBack}>←</button>
        )}
        <h1>Настройки</h1>
      </div>

      <div className="settings-body">
        {loading && (
          <div className="settings-skeleton">
            <div className="skeleton-line skel" style={{ width: '60%' }} />
            <div className="skeleton-line skel" style={{ width: '80%' }} />
          </div>
        )}

        {error && !loading && (
          <div className="error-state">
            <div className="error-state-icon">😔</div>
            <p>Не удалось загрузить настройки</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Попробовать снова
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="settings-card">
            <div className="settings-card-title">Напоминания</div>

            <div className="settings-row">
              <span className="settings-row-label">Ежедневные напоминания</span>
              <label className="settings-toggle">
                <input type="checkbox" checked={enabled} onChange={handleToggle} />
                <span className="settings-toggle-track" />
                <span className="settings-toggle-thumb" />
              </label>
            </div>

            <div className="settings-hint">
              PlantPal пришлёт утреннее напоминание в Telegram, если есть растения, которые пора полить.
            </div>

            <div className="settings-save-area">
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Сохраняю...' : 'Сохранить'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
