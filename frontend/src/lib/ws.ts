const LS_WS = 'avalon-ws-url'

export function getStoredWsUrl(): string {
  return localStorage.getItem(LS_WS) || ''
}

export function setStoredWsUrl(url: string): void {
  const trimmed = url.trim()
  if (trimmed) localStorage.setItem(LS_WS, trimmed)
  else localStorage.removeItem(LS_WS)
}

export function isLocalHost(): boolean {
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1'
}

/**
 * Local: talk to FastAPI directly (avoid flaky Vite WS proxy).
 * Netlify / remote: use stored tunnel URL or env.
 */
export function wsUrl(): string {
  if (isLocalHost()) {
    // Prefer explicit local backend; ignore leftover Netlify/tunnel settings
    return 'ws://127.0.0.1:8000/ws'
  }
  const stored = getStoredWsUrl()
  if (stored) return stored
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
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
  if (isLocalHost() && getStoredWsUrl()) {
    setStoredWsUrl('')
  }

  const url = wsUrl()
  let socket: WebSocket
  let opened = false
  try {
    socket = new WebSocket(url)
  } catch {
    handlers.onError(`无法创建连接：${url}`)
    handlers.onClose?.()
    return { send: () => undefined, close: () => undefined }
  }

  socket.onopen = () => {
    opened = true
    handlers.onOpen?.()
  }
  socket.onerror = () => {
    // Browsers often fire error+close together; only surface if never opened
    if (!opened) {
      handlers.onError(`连接失败，请确认后端已在 8000 端口运行（当前：${url}）`)
    }
  }
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
    close: () => {
      try {
        socket.onclose = null
        socket.onerror = null
        socket.onmessage = null
        socket.onopen = null
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close()
        }
      } catch {
        /* ignore */
      }
    },
  }
}
