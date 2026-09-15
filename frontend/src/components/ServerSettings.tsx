import { useState } from 'react'
import { getStoredWsUrl, setStoredWsUrl, wsUrl } from '../lib/ws'

export function ServerSettings({ onSaved }: { onSaved: () => void }) {
  const [url, setUrl] = useState(() => getStoredWsUrl())
  const [open, setOpen] = useState(false)
  const effective = url.trim() || wsUrl()

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-parchment/60 hover:border-gold-400/40"
      >
        服务器
      </button>
    )
  }

  return (
    <div className="mx-auto mt-3 w-full max-w-md rounded-2xl border border-gold-400/25 bg-night-900/90 p-4 text-left text-sm">
      <p className="text-xs tracking-widest text-gold-300/70">WEBSOCKET</p>
      <p className="mt-1 text-[11px] text-parchment/55">
        Netlify 只托管网页。联机需填写公网后端地址，例如{' '}
        <code className="text-gold-300">wss://xxxx.trycloudflare.com/ws</code>
      </p>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="wss://你的后端/ws"
        className="mt-3 w-full rounded-xl border border-white/10 bg-night-950 px-3 py-2 text-xs outline-none focus:border-gold-400/50"
      />
      <p className="mt-1 truncate text-[10px] text-parchment/40">当前将连接：{effective}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setStoredWsUrl(url)
            onSaved()
            setOpen(false)
          }}
          className="flex-1 rounded-full bg-gold-400 py-2 text-xs font-semibold text-night-950"
        >
          保存并重连
        </button>
        <button
          type="button"
          onClick={() => {
            setUrl('')
            setStoredWsUrl('')
            onSaved()
            setOpen(false)
          }}
          className="rounded-full border border-white/15 px-3 py-2 text-xs text-parchment/60"
        >
          清除
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-white/15 px-3 py-2 text-xs text-parchment/60"
        >
          取消
        </button>
      </div>
    </div>
  )
}
