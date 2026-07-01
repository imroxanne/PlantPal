import { useEffect } from 'react'
import './Toast.css'

const ICONS = {
  success: '✓',
  error: '✕',
}

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, type === 'error' ? 3000 : 2500)
    return () => clearTimeout(t)
  }, [message, type, onClose])

  if (!message) return null

  const kind = type === 'error' ? 'error' : 'success'
  const icon = ICONS[kind]

  return (
    <div className={`toast toast-${kind}`}>
      <span className="toast-icon">{icon}</span>
      {message}
    </div>
  )
}
