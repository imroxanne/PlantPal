import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import './MyPlants.css'

export default function MyPlants() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .home()
      .then((data) => setUser(data.user))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="my-plants">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="my-plants">
        <div className="error">
          <p>Не удалось загрузить данные</p>
          <button onClick={() => window.location.reload()}>Обновить</button>
        </div>
      </div>
    )
  }

  return (
    <div className="my-plants">
      <header className="my-plants-header">
        <h1>Мои растения</h1>
        {user && <span className="user-greeting">Привет, {user.display_name}</span>}
      </header>

      <div className="empty-state">
        <div className="empty-state-icon">🌱</div>
        <h2>Добавьте первое растение</h2>
        <p>Здесь будет ваша коллекция комнатных растений с расписанием ухода</p>
        <button className="btn-primary" disabled>
          Добавить растение
        </button>
      </div>
    </div>
  )
}
