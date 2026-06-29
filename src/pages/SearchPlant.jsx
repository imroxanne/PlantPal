import { useState, useEffect, useRef } from 'react'
import { api } from '../utils/api'
import './SearchPlant.css'

const POPULAR = ['Монстера', 'Фикус', 'Алоэ', 'Кактус', 'Потос']

export default function SearchPlant({ onSelect, onBack }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    clearTimeout(timerRef.current)
    const q = query.trim()

    if (q.length < 2) {
      setResults(null)
      setLoading(false)
      return
    }

    setLoading(true)
    timerRef.current = setTimeout(() => {
      api
        .searchPlants(q)
        .then((data) => setResults(data.plants))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 300)

    return () => clearTimeout(timerRef.current)
  }, [query])

  const handleChip = (name) => {
    setQuery(name)
  }

  return (
    <div className="search-plant">
      <div className="search-header">
        <h1>Добавить растение</h1>
      </div>

      <div className="search-body">
        <div className="search-field">
          <span className="search-field-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Название растения..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')}>
              ✕
            </button>
          )}
        </div>

        {loading && (
          <div className="search-progress">
            <div className="search-progress-bar" />
          </div>
        )}

        {!query && (
          <div className="search-popular">
            <div className="search-popular-label">Популярные</div>
            <div className="search-chips">
              {POPULAR.map((name) => (
                <button key={name} className="search-chip" onClick={() => handleChip(name)}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {results && results.length > 0 && (
          <div className="search-results">
            {results.map((plant) => (
              <div
                key={plant.id}
                className="search-result-item"
                onClick={() => onSelect(plant)}
              >
                <div className="search-result-name">{plant.common_name}</div>
                {plant.latin_name && (
                  <div className="search-result-latin">{plant.latin_name}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {results && results.length === 0 && !loading && (
          <div className="search-no-results">Ничего не найдено</div>
        )}
      </div>
    </div>
  )
}
