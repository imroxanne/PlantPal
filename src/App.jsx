import { useEffect } from 'react'
import { initTelegram } from './utils/telegram'
import MyPlants from './pages/MyPlants'

export default function App() {
  useEffect(() => {
    initTelegram()
  }, [])

  return <MyPlants />
}
