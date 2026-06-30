import { useState, useEffect, useCallback } from 'react'
import { initTelegram, getTelegramWebApp } from './utils/telegram'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'
import MyPlants from './pages/MyPlants'
import SearchPlant from './pages/SearchPlant'
import AddPlantDetails from './pages/AddPlantDetails'
import PlantDetail from './pages/PlantDetail'
import PlantSettings from './pages/PlantSettings'
import Tasks from './pages/Tasks'
import History from './pages/History'

export default function App() {
  const [tab, setTab] = useState('plants')
  const [screen, setScreen] = useState(null)
  const [screenData, setScreenData] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [taskCount, setTaskCount] = useState(0)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    initTelegram()
  }, [])

  useEffect(() => {
    const tg = getTelegramWebApp()
    if (!tg) return

    if (screen) {
      tg.BackButton.show()
    } else {
      tg.BackButton.hide()
    }

    const onBack = () => {
      if (screen === 'add-details') {
        setScreen('search')
      } else if (screen === 'settings') {
        setScreen('plant-detail')
      } else if (screen) {
        setScreen(null)
        setScreenData(null)
        setRefreshKey((k) => k + 1)
      }
    }
    tg.BackButton.onClick(onBack)
    return () => tg.BackButton.offClick(onBack)
  }, [screen])

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
  }, [])

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
      <>
        <SearchPlant
          onSelect={(plant) => navigateScreen('add-details', { plant })}
          onBack={() => { setScreen(null); setScreenData(null) }}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      </>
    )
  }

  if (screen === 'add-details') {
    return (
      <>
        <AddPlantDetails
          plant={screenData?.plant}
          onAdded={onPlantAdded}
          onBack={() => setScreen('search')}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      </>
    )
  }

  if (screen === 'plant-detail') {
    return (
      <>
        <PlantDetail
          userPlantId={screenData?.userPlantId}
          onBack={() => {
            setScreen(null)
            setScreenData(null)
            setRefreshKey((k) => k + 1)
          }}
          onSettings={(userPlant) => navigateScreen('settings', { userPlant })}
          onShowToast={showToast}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      </>
    )
  }

  if (screen === 'settings') {
    return (
      <>
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
          onBack={() => setScreen('plant-detail')}
          onShowToast={showToast}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      </>
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
        />
      )}
      {tab === 'tasks' && (
        <Tasks
          key={refreshKey}
          onPlantTap={(userPlantId) => navigateScreen('plant-detail', { userPlantId })}
          onShowToast={showToast}
        />
      )}
      {tab === 'history' && (
        <History key={refreshKey} />
      )}
      {showBottomNav && (
        <BottomNav active={tab} taskCount={taskCount} onTab={handleTab} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </>
  )
}
