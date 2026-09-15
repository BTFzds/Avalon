import { useState } from 'react'
import { getStoredWsUrl, setStoredWsUrl, wsUrl, isLocalHost } from '../lib/ws'

export function ServerSettings({ onSaved }: { onSaved: () => void }) {
  const [url, setUrl] = useState(() => getStoredWsUrl())
  const [open, setOpen] = useState(false)

  if (isLocalHost()) {
    return null
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost mt-2 !py-1 !text-xs">
        服务器设置
      </button>
    )
  }

  return (
    <div className="panel mx-auto mt-3 w-full max-w-md p-4 text-left text-sm">
      <p className="font-semibold text-ink-900">WebSocket 地址</p>
      <p className="mt-1 text-xs text-ink-500">Netlify 页面需填写公网后端，例如 wss://xxx.trycloudflare.com/ws</p>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="wss://你的后端/ws"
        className="mt-3 w-full rounded-xl border border-ink-900/15 bg-mist-50 px-3 py-2 text-xs outline-none focus:border-gold-500"
      />
      <p className="mt-1 truncate text-[10px] text-ink-500">当前：{url.trim() || wsUrl()}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="btn-primary flex-1 !py-2 !text-xs"
          onClick={() => {
            setStoredWsUrl(url)
            onSaved()
            setOpen(false)
          }}
        >
          保存并重连
        </button>
        <button
          type="button"
          className="btn-ghost !text-xs"
          onClick={() => {
            setUrl('')
            setStoredWsUrl('')
            onSaved()
            setOpen(false)
          }}
        >
          清除
        </button>
      </div>
    </div>
  )
}
