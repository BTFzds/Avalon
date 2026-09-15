import { motion, AnimatePresence } from 'framer-motion'
import { RoleAvatar } from './RoleAvatar'
import { ROLE_META } from '../lib/roles'

export function RoleReveal({
  role,
  visionText,
  onAck,
  acked,
  waitingCount,
}: {
  role: string
  visionText: string[]
  onAck: () => void
  acked: boolean
  waitingCount: number
}) {
  const meta = ROLE_META[role] ?? ROLE_META.servant
  const isGood = meta.alignment === 'good'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-night-950/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.6, rotateY: 90, opacity: 0 }}
        animate={{ scale: 1, rotateY: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        className={`relative w-full max-w-md rounded-3xl border px-6 py-8 text-center shadow-glow ${
          isGood ? 'border-moss-400/40 bg-night-900/95' : 'border-blood-400/40 bg-night-900/95'
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-0 rounded-3xl opacity-30 ${
            isGood ? 'bg-[radial-gradient(circle_at_50%_20%,#3d8f5c,transparent_55%)]' : 'bg-[radial-gradient(circle_at_50%_20%,#7a2222,transparent_55%)]'
          }`}
        />
        <p className="font-display text-xs tracking-[0.35em] text-gold-300/80">IDENTITY REVEALED</p>
        <div className="relative mx-auto my-5 w-fit animate-float">
          <span
            className={`absolute inset-0 rounded-full animate-pulseRing ${
              isGood ? 'bg-moss-400/30' : 'bg-blood-400/30'
            }`}
          />
          <RoleAvatar role={role} size={168} />
        </div>
        <h2 className="font-display text-3xl text-gold-300">{meta.label}</h2>
        <p className={`mt-1 text-sm font-semibold ${isGood ? 'text-moss-400' : 'text-blood-400'}`}>
          {isGood ? '正义阵营' : '邪恶阵营'}
        </p>
        <p className="mt-3 text-sm text-parchment/80">{meta.blurb}</p>
        {visionText.length > 0 && (
          <div className="mt-4 rounded-2xl border border-gold-400/20 bg-night-950/60 px-4 py-3 text-left text-sm">
            <p className="mb-1 text-xs tracking-widest text-gold-400/70">你看到的信息</p>
            {visionText.map((line) => (
              <p key={line} className="text-parchment/90">
                · {line}
              </p>
            ))}
          </div>
        )}
        <AnimatePresence>
          {!acked ? (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              type="button"
              onClick={onAck}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300 px-6 py-3 font-semibold text-night-950 shadow-glow transition hover:brightness-110"
            >
              确认身份，进入白天
            </motion.button>
          ) : (
            <p className="mt-6 text-sm text-parchment/70">已确认 · 等待其余 {waitingCount} 人…</p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
