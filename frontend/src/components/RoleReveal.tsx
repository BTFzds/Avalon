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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 16 }}
        className={`w-full max-w-md rounded-3xl border bg-white px-6 py-8 text-center shadow-card ${
          isGood ? 'border-moss-500/40' : 'border-blood-500/40'
        }`}
      >
        <p className="text-xs font-semibold tracking-[0.3em] text-ink-500">身份揭示</p>
        <div className="relative mx-auto my-5 w-fit animate-float">
          <RoleAvatar role={role} size={150} />
        </div>
        <h2 className="font-display text-3xl text-ink-900">{meta.label}</h2>
        <p className={`mt-1 text-sm font-bold ${isGood ? 'text-moss-600' : 'text-blood-600'}`}>
          {isGood ? '正义阵营' : '邪恶阵营'}
        </p>
        <p className="mt-3 text-sm text-ink-700">{meta.blurb}</p>
        {visionText.length > 0 && (
          <div className="mt-4 rounded-2xl bg-mist-50 px-4 py-3 text-left text-sm text-ink-800">
            <p className="mb-1 text-xs font-semibold text-ink-500">你看到的信息</p>
            {visionText.map((line) => (
              <p key={line}>· {line}</p>
            ))}
          </div>
        )}
        <AnimatePresence>
          {!acked ? (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              type="button"
              onClick={onAck}
              className="btn-primary mt-6 w-full"
            >
              确认身份，开始白天
            </motion.button>
          ) : (
            <p className="mt-6 text-sm text-ink-500">已确认 · 等待其余 {waitingCount} 人…</p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
