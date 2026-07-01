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

  const url = '/api' + path
  const res = await fetch(url, {
    ...options,
    headers,
  })

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(`API returned non-JSON response (${res.status} ${url})`)
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

function plantUrl(id, action) {
  return '/user-plant?id=' + id + (action ? '&action=' + action : '')
}

export const api = {
  home: () => request('/home'),
  searchPlants: (q) => request('/plants?q=' + encodeURIComponent(q)),
  getPlants: () => request('/plants'),
  getUserPlants: () => request('/user-plants'),
  getArchivedPlants: () => request('/user-plants?archived=true'),
  addUserPlant: (plantId, nickname) =>
    request('/user-plants', {
      method: 'POST',
      body: JSON.stringify({ plant_id: plantId, nickname: nickname || undefined }),
    }),
  getUserPlant: (id) => request(plantUrl(id)),
  waterPlant: (id) => request(plantUrl(id, 'water'), { method: 'POST' }),
  updateUserPlant: (id, fields) =>
    request(plantUrl(id), {
      method: 'PATCH',
      body: JSON.stringify(fields),
    }),
  archivePlant: (id) =>
    request(plantUrl(id, 'archive'), { method: 'POST' }),
  unarchivePlant: (id) =>
    request(plantUrl(id, 'unarchive'), { method: 'POST' }),
  createEvent: (id, type, note) =>
    request(plantUrl(id, 'events'), {
      method: 'POST',
      body: JSON.stringify({ type, note: note || undefined }),
    }),
  getTasks: () => request('/tasks'),
  getCareEvents: (userPlantId) =>
    request('/care-events' + (userPlantId ? '?userPlantId=' + userPlantId : '')),
  deleteCareEvents: (period) =>
    request('/care-events', {
      method: 'DELETE',
      body: JSON.stringify({ period }),
    }),
  getSettings: () => request('/settings'),
  updateSettings: (fields) =>
    request('/settings', {
      method: 'PATCH',
      body: JSON.stringify(fields),
    }),
}
