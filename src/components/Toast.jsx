import { useEffect } from 'react'
import './Toast.css'

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, type === 'error' ? 3000 : 2500)
    return () => clearTimeout(t)
  }, [message, type, onClose])

  if (!message) return null

  return (
    <div className={`toast ${type === 'error' ? 'toast-error' : ''}`}>
      {message}
    </div>
  )
}
