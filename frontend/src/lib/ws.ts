const LS_WS = 'avalon-ws-url'

export function getStoredWsUrl(): string {
  return localStorage.getItem(LS_WS) || ''
}

export function setStoredWsUrl(url: string): void {
  const trimmed = url.trim()
  if (trimmed) localStorage.setItem(LS_WS, trimmed)
  else localStorage.removeItem(LS_WS)
}

export function wsUrl(): string {
  const stored = getStoredWsUrl()
  if (stored) return stored
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  // Same-origin proxy (local Vite) or custom host
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `${proto}//${window.location.host}/ws`
  }
  // Netlify / static host default: try same host (only works if you reverse-proxy /ws)
  return `${proto}//${window.location.host}/ws`
}

export type SendFn = (payload: Record<string, unknown>) => void

export function createGameSocket(handlers: {
  onState: (state: unknown) => void
  onEmoji: (e: { playerId: string; name: string; emoji: string }) => void
  onError: (message: string) => void
  onOpen?: () => void
  onClose?: () => void
}): { send: SendFn; close: () => void } {
  const socket = new WebSocket(wsUrl())

  socket.onopen = () => handlers.onOpen?.()
  socket.onclose = () => handlers.onClose?.()
  socket.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data as string)
      if (data.type === 'state') handlers.onState(data)
      else if (data.type === 'emoji') handlers.onEmoji(data)
      else if (data.type === 'error') handlers.onError(data.message || '错误')
    } catch {
      handlers.onError('消息解析失败')
    }
  }

  return {
    send: (payload) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload))
      }
    },
    close: () => socket.close(),
  }
}
