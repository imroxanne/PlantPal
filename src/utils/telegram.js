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

export function hapticImpact(style = 'light') {
  try { getTelegramWebApp()?.HapticFeedback?.impactOccurred(style) } catch {}
}

export function hapticSuccess() {
  try { getTelegramWebApp()?.HapticFeedback?.notificationOccurred('success') } catch {}
}

export function hapticError() {
  try { getTelegramWebApp()?.HapticFeedback?.notificationOccurred('error') } catch {}
}

export function hapticSelection() {
  try { getTelegramWebApp()?.HapticFeedback?.selectionChanged() } catch {}
}
