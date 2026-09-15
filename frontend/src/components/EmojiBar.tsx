import { motion, AnimatePresence } from 'framer-motion'
import type { EmojiEvent } from '../types'

export function EmojiBurst({ events }: { events: EmojiEvent[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex flex-col items-center gap-2">
      <AnimatePresence>
        {events.map((e, i) => (
          <motion.div
            key={`${e.playerId}-${i}-${e.emoji}`}
            initial={{ opacity: 0, y: 16, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            className="rounded-full border border-ink-900/10 bg-white px-4 py-2 text-2xl shadow-card"
          >
            <span className="mr-2 text-xs text-ink-500">{e.name}</span>
            {e.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function EmojiBar({ onSend }: { onSend: (emoji: string) => void }) {
  const emojis = ['👍', '🤔', '😅', '🔥', '👀', '🛡️', '🗡️', '✨']
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {emojis.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onSend(e)}
          className="rounded-full border border-ink-900/10 bg-mist-50 px-3 py-1.5 text-lg hover:border-gold-500/50"
        >
          {e}
        </button>
      ))}
    </div>
  )
}
