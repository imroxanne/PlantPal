export async function sendTelegramMessage(telegramId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured')

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramId,
      text,
      parse_mode: 'HTML',
    }),
  })

  const data = await res.json()
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`)
  }
  return data
}
