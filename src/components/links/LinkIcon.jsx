import { useState } from 'react'
import { darkenColor } from '../../lib/eventType'
import { SYMBOLS } from '../../lib/linkSymbols'
import { initialsOf, lightenColor, readableTextColor } from '../../lib/quickLinks'

const RADIUS = { rounded: '28%', circle: '50%', square: '6px' }

/**
 * Ikona linku (symbol, litery, emoji albo ikona strony) w gradientowym kwadracie.
 * icon: { kind, value, color, shape }, size: bok w pikselach
 */
export default function LinkIcon({ icon, size = 32 }) {
  const [failedFavicon, setFailedFavicon] = useState(null)
  const { kind, value, color, shape } = icon

  const frame = {
    width: size,
    height: size,
    borderRadius: RADIUS[shape] ?? RADIUS.rounded,
  }
  const frameClass =
    'flex shrink-0 select-none items-center justify-center overflow-hidden font-bold leading-none'

  // Ikona strony (favicon); gdy się nie załaduje, pokazujemy litery
  if (kind === 'favicon' && failedFavicon !== value) {
    return (
      <span
        className={frameClass}
        style={{
          ...frame,
          background: '#ffffff',
          border: '1px solid rgba(100, 116, 139, 0.35)',
        }}
      >
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(value)}&sz=64`}
          alt=""
          width={Math.round(size * 0.68)}
          height={Math.round(size * 0.68)}
          onError={() => setFailedFavicon(value)}
        />
      </span>
    )
  }

  const background = `linear-gradient(135deg, ${lightenColor(color, 0.18)}, ${darkenColor(color, 0.22)})`

  let content
  if (kind === 'symbol') {
    const SymbolIcon = (SYMBOLS[value] ?? SYMBOLS.link).icon
    content = (
      <SymbolIcon style={{ width: size * 0.54, height: size * 0.54 }} strokeWidth={2.2} />
    )
  } else if (kind === 'emoji') {
    content = <span style={{ fontSize: size * 0.54 }}>{value}</span>
  } else {
    const text = kind === 'favicon' ? initialsOf(value) : value
    content = (
      <span style={{ fontSize: size * (text.length > 2 ? 0.3 : 0.4) }}>{text}</span>
    )
  }

  return (
    <span
      className={frameClass}
      style={{
        ...frame,
        background,
        color: readableTextColor(color),
        boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.18)',
      }}
    >
      {content}
    </span>
  )
}