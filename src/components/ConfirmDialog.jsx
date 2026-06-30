import './ConfirmDialog.css'

export default function ConfirmDialog({ icon, title, text, confirmLabel, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        {icon && <div className="confirm-icon">{icon}</div>}
        <div className="confirm-title">{title}</div>
        {text && <div className="confirm-text">{text}</div>}
        <button className="confirm-btn-danger" onClick={onConfirm}>
          {confirmLabel || 'Подтвердить'}
        </button>
        <button className="confirm-btn-cancel" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  )
}
