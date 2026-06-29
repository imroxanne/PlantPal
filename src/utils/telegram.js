export function getTelegramWebApp() {
  return window.Telegram?.WebApp
}

export function getTelegramInitData() {
  return getTelegramWebApp()?.initData || ''
}

export function getTelegramUser() {
  return getTelegramWebApp()?.initDataUnsafe?.user || null
}

export function initTelegram() {
  const tg = getTelegramWebApp()
  if (!tg) return
  tg.ready()
  tg.expand()
}

export function isTelegramEnv() {
  return !!getTelegramWebApp()?.initData
}
