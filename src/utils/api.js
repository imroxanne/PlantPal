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
  getUserPlant: (id) => request('/user-plants/' + id),
  waterPlant: (id) => request('/user-plants/' + id + '/water', { method: 'POST' }),
  updateUserPlant: (id, fields) =>
    request('/user-plants/' + id, {
      method: 'PATCH',
      body: JSON.stringify(fields),
    }),
  archivePlant: (id) =>
    request('/user-plants/' + id + '/archive', { method: 'POST' }),
  createEvent: (id, type, note) =>
    request('/user-plants/' + id + '/events', {
      method: 'POST',
      body: JSON.stringify({ type, note: note || undefined }),
    }),
  getTasks: () => request('/tasks'),
  getCareEvents: () => request('/care-events'),
  deleteCareEvents: (period) =>
    request('/care-events', {
      method: 'DELETE',
      body: JSON.stringify({ period }),
    }),
}
