import { getPlantEmoji } from '../utils/status'
import './PlantAvatar.css'

const GRADIENTS = [
  ['#A8D5A2', '#4A6741'],
  ['#B5D6C7', '#2A7A5B'],
  ['#C4D7A4', '#5B7E3C'],
  ['#D4C5A9', '#7A6B3C'],
  ['#A8C5D5', '#3C6B7E'],
  ['#C5B8D4', '#5B3C7E'],
]

function hashName(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0
  return Math.abs(h)
}

export default function PlantAvatar({ name, imageUrl, photoUrl, size = 64 }) {
  const src = photoUrl || imageUrl

  if (src) {
    return (
      <div className="plant-avatar" style={{ width: size, height: size }}>
        <img
          src={src}
          alt={name}
          className="plant-avatar-img"
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
        />
        <Fallback name={name} size={size} style={{ display: 'none' }} />
      </div>
    )
  }

  return <Fallback name={name} size={size} />
}

function Fallback({ name, size, style }) {
  const h = hashName(name)
  const [c1, c2] = GRADIENTS[h % GRADIENTS.length]
  const emoji = getPlantEmoji(name)
  const fontSize = Math.round(size * 0.42)

  return (
    <div
      className="plant-avatar-fallback"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        fontSize,
        ...style,
      }}
    >
      {emoji}
    </div>
  )
}
