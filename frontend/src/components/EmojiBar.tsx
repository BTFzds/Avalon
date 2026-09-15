import { motion, AnimatePresence } from 'framer-motion'
import type { EmojiEvent } from '../types'

export function EmojiBurst({ events }: { events: EmojiEvent[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2">
      <AnimatePresence>
        {events.map((e, i) => (
          <motion.div
            key={`${e.playerId}-${i}-${e.emoji}`}
            initial={{ opacity: 0, y: 20, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.5 }}
            className="rounded-full border border-gold-400/30 bg-night-900/90 px-4 py-2 text-2xl shadow-glow"
          >
            <span className="mr-2 text-xs text-parchment/70">{e.name}</span>
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
          className="rounded-full border border-white/10 bg-night-800/80 px-3 py-1.5 text-lg transition hover:border-gold-400/50 hover:bg-night-700"
        >
          {e}
        </button>
      ))}
    </div>
  )
}
