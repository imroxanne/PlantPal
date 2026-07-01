import { useState, useEffect, useCallback } from 'react'
import { initTelegram, getTelegramWebApp, isTelegramEnv } from './utils/telegram'
import { api } from './utils/api'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'
import MyPlants from './pages/MyPlants'
import SearchPlant from './pages/SearchPlant'
import AddPlantDetails from './pages/AddPlantDetails'
import PlantDetail from './pages/PlantDetail'
import PlantSettings from './pages/PlantSettings'
import Tasks from './pages/Tasks'
import History from './pages/History'
import ArchivedPlants from './pages/ArchivedPlants'
import Settings from './pages/Settings'

export default function App() {
  const [tab, setTab] = useState('plants')
  const [screen, setScreen] = useState(null)
  const [screenData, setScreenData] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [taskCount, setTaskCount] = useState(0)
  const [toast, setToast] = useState(null)

  const refreshTaskCount = useCallback(() => {
    api.getTasks()
      .then((d) => {
        const total = Object.values(d.tasks).reduce((s, g) => s + g.length, 0)
        setTaskCount(total)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    initTelegram()
    refreshTaskCount()
  }, [refreshTaskCount])

  const goBack = useCallback(() => {
    if (screen === 'add-details') {
      setScreen('search')
    } else if (screen === 'settings') {
      setScreen('plant-detail')
      setScreenData((prev) => ({ userPlantId: prev?.userPlant?.id }))
    } else if (screen === 'plant-history') {
      setScreen('plant-detail')
      setScreenData((prev) => ({ userPlantId: prev?.userPlantId }))
    } else if (screen === 'archived') {
      setScreen(null)
      setScreenData(null)
      setTab('plants')
      setRefreshKey((k) => k + 1)
    } else if (screen === 'app-settings') {
      setScreen(null)
      setScreenData(null)
      setTab('plants')
    } else if (screen) {
      setScreen(null)
      setScreenData(null)
      setRefreshKey((k) => k + 1)
    }
  }, [screen])

  useEffect(() => {
    const tg = getTelegramWebApp()
    if (!tg) return

    if (screen) {
      tg.BackButton.show()
    } else {
      tg.BackButton.hide()
    }

    if (screen === 'settings') return

    tg.BackButton.onClick(goBack)
    return () => tg.BackButton.offClick(goBack)
  }, [screen, goBack])

  const showToast = useCallback((message, type) => {
    setToast({ message, type: type || 'success' })
  }, [])

  const clearToast = useCallback(() => setToast(null), [])

  const navigateScreen = useCallback((target, data) => {
    setScreen(target)
    setScreenData(data || null)
  }, [])

  const onPlantAdded = useCallback(() => {
    setRefreshKey((k) => k + 1)
    setScreen(null)
    setScreenData(null)
    setTab('plants')
    refreshTaskCount()
  }, [refreshTaskCount])

  const handleTab = useCallback((id) => {
    if (id === 'add') {
      setScreen('search')
      return
    }
    setScreen(null)
    setScreenData(null)
    setTab(id)
    setRefreshKey((k) => k + 1)
  }, [])

  const showBottomNav = !screen

  if (screen === 'search') {
    return (
      <div className="screen-enter" key="search">
        <SearchPlant
          onSelect={(plant) => navigateScreen('add-details', { plant })}
          onBack={goBack}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      </div>
    )
  }

  if (screen === 'add-details') {
    return (
      <div className="screen-enter" key="add-details">
        <AddPlantDetails
          plant={screenData?.plant}
          onAdded={onPlantAdded}
          onBack={goBack}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      </div>
    )
  }

  if (screen === 'plant-detail') {
    return (
      <div className="screen-enter" key="plant-detail">
        <PlantDetail
          userPlantId={screenData?.userPlantId}
          onBack={goBack}
          onSettings={(userPlant) => navigateScreen('settings', { userPlant })}
          onShowToast={showToast}
          onTaskCountChange={refreshTaskCount}
          onViewHistory={(plantId, plantName) => navigateScreen('plant-history', { userPlantId: plantId, plantName })}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      </div>
    )
  }

  if (screen === 'plant-history') {
    return (
      <div className="screen-enter" key="plant-history">
        <History
          userPlantId={screenData?.userPlantId}
          plantName={screenData?.plantName}
          onPlantTap={(userPlantId) => navigateScreen('plant-detail', { userPlantId })}
          onShowToast={showToast}
          onBack={goBack}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      </div>
    )
  }

  if (screen === 'app-settings') {
    return (
      <div className="screen-enter" key="app-settings">
        <Settings
          onBack={goBack}
          onShowToast={showToast}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      </div>
    )
  }

  if (screen === 'archived') {
    return (
      <div className="screen-enter" key="archived">
        <ArchivedPlants
          onBack={goBack}
          onShowToast={showToast}
          onRestored={refreshTaskCount}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      </div>
    )
  }

  if (screen === 'settings') {
    return (
      <div className="screen-enter" key="settings">
        <PlantSettings
          userPlant={screenData?.userPlant}
          onSaved={(updated) => {
            setScreen('plant-detail')
            setScreenData({ userPlantId: updated.id })
          }}
          onArchived={() => {
            setScreen(null)
            setScreenData(null)
            setTab('plants')
            setRefreshKey((k) => k + 1)
            showToast('Растение архивировано')
          }}
          onBack={goBack}
          onShowToast={showToast}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      </div>
    )
  }

  return (
    <>
      {tab === 'plants' && (
        <MyPlants
          key={refreshKey}
          onAdd={() => setScreen('search')}
          onPlantTap={(userPlantId) => navigateScreen('plant-detail', { userPlantId })}
          onShowToast={showToast}
          onTaskCountChange={refreshTaskCount}
          onArchive={() => navigateScreen('archived')}
          onOpenSettings={() => navigateScreen('app-settings')}
        />
      )}
      {tab === 'tasks' && (
        <Tasks
          key={refreshKey}
          onPlantTap={(userPlantId) => navigateScreen('plant-detail', { userPlantId })}
          onShowToast={showToast}
          onTaskCountChange={refreshTaskCount}
        />
      )}
      {tab === 'history' && (
        <History
          key={refreshKey}
          onPlantTap={(userPlantId) => navigateScreen('plant-detail', { userPlantId })}
          onShowToast={showToast}
        />
      )}
      {showBottomNav && (
        <BottomNav active={tab} taskCount={taskCount} onTab={handleTab} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </>
  )
}
