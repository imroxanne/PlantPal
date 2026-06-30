import './BottomNav.css'

const TABS = [
  { id: 'plants', icon: '🌿', label: 'Растения' },
  { id: 'tasks', icon: '✓', label: 'Задачи' },
  { id: 'add', icon: '+', label: 'Добавить', isCenter: true },
  { id: 'history', icon: '📋', label: 'История' },
]

export default function BottomNav({ active, taskCount, onTab }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        if (tab.isCenter) {
          return (
            <button
              key={tab.id}
              className="bottom-nav-center"
              onClick={() => onTab(tab.id)}
            >
              <span className="bottom-nav-center-icon">+</span>
              <span className="bottom-nav-center-label">Добавить</span>
            </button>
          )
        }
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            className={`bottom-nav-tab ${isActive ? 'bottom-nav-tab-active' : ''}`}
            onClick={() => onTab(tab.id)}
          >
            <span className={`bottom-nav-icon ${isActive ? 'bottom-nav-icon-active' : ''}`}>
              {tab.icon}
              {tab.id === 'tasks' && taskCount > 0 && (
                <span className="bottom-nav-badge" />
              )}
            </span>
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
