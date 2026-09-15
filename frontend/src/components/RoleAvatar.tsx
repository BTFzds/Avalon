import type { ReactNode } from 'react'

/** Stylized SVG portraits per role — no external image assets needed. */
export function RoleAvatar({
  role,
  size = 160,
  glow = true,
}: {
  role: string
  size?: number
  glow?: boolean
}) {
  const common = { width: size, height: size, viewBox: '0 0 200 200' }

  const frame = (inner: ReactNode, stroke: string) => (
    <svg {...common} className={glow ? 'drop-shadow-[0_0_18px_rgba(212,168,75,0.45)]' : undefined}>
      <defs>
        <radialGradient id={`bg-${role}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1a2d45" />
          <stop offset="100%" stopColor="#070b12" />
        </radialGradient>
        <linearGradient id={`rim-${role}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={stroke} />
          <stop offset="100%" stopColor="#e8c86a" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill={`url(#bg-${role})`} stroke={`url(#rim-${role})`} strokeWidth="4" />
      {inner}
    </svg>
  )

  switch (role) {
    case 'merlin':
      return frame(
        <>
          <path d="M60 150 Q100 40 140 150" fill="#dfe9f5" opacity="0.9" />
          <circle cx="100" cy="78" r="28" fill="#f5f0e6" />
          <path d="M72 70 Q100 20 128 70" fill="#6fbf8a" />
          <circle cx="100" cy="55" r="8" fill="#e8c86a" />
          <path d="M55 155 H145 L130 175 H70 Z" fill="#3d8f5c" />
        </>,
        '#6fbf8a',
      )
    case 'percival':
      return frame(
        <>
          <circle cx="100" cy="85" r="30" fill="#f0e6d2" />
          <path d="M70 70 H130 V55 Q100 35 70 55 Z" fill="#7ec8e3" />
          <rect x="78" y="112" width="44" height="50" rx="6" fill="#2a4a6a" />
          <path d="M88 55 L100 30 L112 55" fill="#e8c86a" />
        </>,
        '#7ec8e3',
      )
    case 'servant':
      return frame(
        <>
          <circle cx="100" cy="82" r="28" fill="#f0e6d2" />
          <path d="M65 70 Q100 40 135 70" fill="#8b7355" />
          <path d="M70 115 H130 L120 170 H80 Z" fill="#c9b27c" />
          <path d="M95 120 L105 145 L95 145 Z" fill="#d4a84b" />
        </>,
        '#c9b27c',
      )
    case 'assassin':
      return frame(
        <>
          <circle cx="100" cy="88" r="26" fill="#d8c4b0" />
          <path d="M60 70 Q100 20 140 70 L130 95 H70 Z" fill="#1a1010" />
          <path d="M75 120 H125 L135 175 H65 Z" fill="#3a1515" />
          <path d="M118 100 L155 70 L150 78 L130 108 Z" fill="#e07070" />
        </>,
        '#e07070',
      )
    case 'morgana':
      return frame(
        <>
          <path d="M55 150 Q100 30 145 150" fill="#2a1838" />
          <circle cx="100" cy="80" r="26" fill="#e8d5c4" />
          <path d="M60 75 Q100 10 140 75" fill="#c77dff" />
          <circle cx="88" cy="82" r="3" fill="#5b1a6a" />
          <circle cx="112" cy="82" r="3" fill="#5b1a6a" />
          <path d="M70 120 H130 L125 170 H75 Z" fill="#4a2060" />
        </>,
        '#c77dff',
      )
    case 'mordred':
      return frame(
        <>
          <circle cx="100" cy="90" r="28" fill="#cbb59a" />
          <path d="M55 75 Q100 15 145 75 L130 100 H70 Z" fill="#2b2118" />
          <path d="M72 120 H128 L140 175 H60 Z" fill="#4a3728" />
          <path d="M85 55 H115 V70 H85 Z" fill="#8b6b4a" />
          <circle cx="100" cy="48" r="10" fill="#5a4030" />
        </>,
        '#8b6b4a',
      )
    case 'oberon':
      return frame(
        <>
          <circle cx="100" cy="88" r="27" fill="#d2c2b0" />
          <path d="M62 78 Q100 25 138 78" fill="#3a4578" />
          <path d="M70 118 H130 L138 172 H62 Z" fill="#2a3558" />
          <path d="M78 55 L100 35 L122 55" fill="#5b7cfa" />
          <circle cx="100" cy="100" r="6" fill="#5b7cfa" opacity="0.7" />
        </>,
        '#5b7cfa',
      )
    default:
      return frame(
        <>
          <circle cx="100" cy="85" r="28" fill="#d8c4b0" />
          <path d="M68 70 Q100 45 132 70" fill="#5a3030" />
          <path d="M72 118 H128 L135 170 H65 Z" fill="#a85858" />
          <circle cx="100" cy="130" r="10" fill="#7a2222" />
        </>,
        '#a85858',
      )
  }
}
