import { getTelegramInitData, isTelegramEnv } from './telegram'

const DEV_TELEGRAM_ID = '12345678'

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (isTelegramEnv()) {
    headers['x-telegram-init-data'] = getTelegramInitData()
  } else {
    headers['x-dev-telegram-id'] = DEV_TELEGRAM_ID
  }

  const res = await fetch('/api' + path, {
    ...options,
    headers,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  home: () => request('/home'),
  searchPlants: (q) => request('/plants?q=' + encodeURIComponent(q)),
  getPlants: () => request('/plants'),
  getUserPlants: () => request('/user-plants'),
  addUserPlant: (plantId, nickname) =>
    request('/user-plants', {
      method: 'POST',
      body: JSON.stringify({ plant_id: plantId, nickname: nickname || undefined }),
    }),
}
