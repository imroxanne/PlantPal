import { useState, useEffect, useCallback } from 'react'
import { initTelegram, getTelegramWebApp } from './utils/telegram'
import MyPlants from './pages/MyPlants'
import SearchPlant from './pages/SearchPlant'
import AddPlantDetails from './pages/AddPlantDetails'

export default function App() {
  const [screen, setScreen] = useState('my-plants')
  const [screenData, setScreenData] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    initTelegram()
  }, [])

  useEffect(() => {
    const tg = getTelegramWebApp()
    if (!tg) return

    const isStack = screen !== 'my-plants'
    if (isStack) {
      tg.BackButton.show()
    } else {
      tg.BackButton.hide()
    }

    const onBack = () => {
      if (screen === 'add-details') {
        navigate('search')
      } else {
        navigate('my-plants')
      }
    }
    tg.BackButton.onClick(onBack)
    return () => tg.BackButton.offClick(onBack)
  }, [screen])

  const navigate = useCallback((target, data) => {
    setScreen(target)
    setScreenData(data || null)
  }, [])

  const onPlantAdded = useCallback(() => {
    setRefreshKey((k) => k + 1)
    navigate('my-plants')
  }, [navigate])

  if (screen === 'search') {
    return (
      <SearchPlant
        onSelect={(plant) => navigate('add-details', { plant })}
        onBack={() => navigate('my-plants')}
      />
    )
  }

  if (screen === 'add-details') {
    return (
      <AddPlantDetails
        plant={screenData?.plant}
        onAdded={onPlantAdded}
        onBack={() => navigate('search')}
      />
    )
  }

  return (
    <MyPlants
      key={refreshKey}
      onAdd={() => navigate('search')}
    />
  )
}
