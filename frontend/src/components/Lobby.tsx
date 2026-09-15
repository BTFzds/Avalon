import { motion } from 'framer-motion'
import { ROLE_META } from '../lib/roles'

const ALL_ROLES = Object.keys(ROLE_META)

export function Lobby({
  name,
  setName,
  roomIdInput,
  setRoomIdInput,
  targetPlayers,
  setTargetPlayers,
  connected,
  inRoom,
  publicState,
  isHost,
  error,
  onCreate,
  onJoin,
  onStart,
  onConfigurePlayers,
  onSetCustomRoles,
  onClearCustom,
  onFillBots,
  onClearBots,
}: {
  name: string
  setName: (v: string) => void
  roomIdInput: string
  setRoomIdInput: (v: string) => void
  targetPlayers: number
  setTargetPlayers: (n: number) => void
  connected: boolean
  inRoom: boolean
  publicState: {
    roomId: string
    targetPlayers: number
    players: { id: string; name: string; isHost: boolean; connected: boolean; isAi?: boolean }[]
    rolesPreset: string[]
    usingCustomRoles: boolean
    goodEvil: [number, number]
    roleLabels: Record<string, string>
  } | null
  isHost: boolean
  error: string | null
  onCreate: () => void
  onJoin: () => void
  onStart: () => void
  onConfigurePlayers: (n: number) => void
  onSetCustomRoles: (roles: string[]) => void
  onClearCustom: () => void
  onFillBots: () => void
  onClearBots: () => void
}) {
  if (inRoom && publicState) {
    const full = publicState.players.length >= publicState.targetPlayers
    const counts: Record<string, number> = {}
    for (const r of publicState.rolesPreset) counts[r] = (counts[r] || 0) + 1

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-lg space-y-5"
      >
        <div className="rounded-3xl border border-gold-400/25 bg-night-900/80 p-6 shadow-glow backdrop-blur">
          <p className="text-xs tracking-[0.3em] text-gold-300/70">ROOM</p>
          <h2 className="font-display text-4xl tracking-widest text-gold-300">{publicState.roomId}</h2>
          <p className="mt-2 text-sm text-parchment/70">
            {publicState.players.length}/{publicState.targetPlayers} 人 · 好{' '}
            {publicState.goodEvil[0]}/{publicState.goodEvil[1]}
          </p>
          <ul className="mt-4 space-y-2">
            {publicState.players.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-night-950/50 px-3 py-2"
              >
                <span>
                  {p.name}
                  {p.isHost ? ' · 房主' : ''}
                  {p.isAi ? ' · AI' : ''}
                </span>
                <span className={`h-2 w-2 rounded-full ${p.connected ? 'bg-moss-400' : 'bg-blood-400'}`} />
              </li>
            ))}
          </ul>
        </div>

        {isHost && (
          <div className="rounded-3xl border border-white/10 bg-night-900/70 p-5 space-y-4">
            <div>
              <label className="text-xs tracking-widest text-parchment/60">目标人数</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onConfigurePlayers(n)}
                    className={`rounded-full px-3 py-1 text-sm ${
                      publicState.targetPlayers === n
                        ? 'bg-gold-400 text-night-950'
                        : 'border border-white/15 bg-night-800'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs tracking-widest text-parchment/60">
                  角色配置 {publicState.usingCustomRoles ? '(自定义)' : '(推荐)'}
                </label>
                {publicState.usingCustomRoles && (
                  <button type="button" className="text-xs text-gold-300" onClick={onClearCustom}>
                    恢复推荐
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_ROLES.map((role) => {
                  const count = counts[role] || 0
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        const next = [...publicState.rolesPreset]
                        if (count > 0) {
                          const idx = next.indexOf(role)
                          if (idx >= 0) next.splice(idx, 1)
                        } else {
                          next.push(role)
                        }
                        onSetCustomRoles(next)
                      }}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        count
                          ? 'border-gold-400/50 bg-gold-400/15 text-gold-300'
                          : 'border-white/10 text-parchment/50'
                      }`}
                    >
                      {ROLE_META[role].label}
                      {count > 1 ? ` ×${count}` : count === 1 ? '' : ''}
                      {role === 'servant' || role === 'minion' ? (
                        <span
                          className="ml-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSetCustomRoles([...publicState.rolesPreset, role])
                          }}
                        >
                          +
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-[11px] text-parchment/45">
                点选切换；忠臣/爪牙可点 + 追加。须满足好/坏人数且含梅林与刺客。
              </p>
            </div>
            <button
              type="button"
              disabled={!full}
              onClick={onStart}
              className="w-full rounded-full bg-gradient-to-r from-moss-700 to-moss-400 py-3 font-semibold text-night-950 disabled:opacity-40"
            >
              {full ? '开始游戏' : `等待人齐 (${publicState.players.length}/${publicState.targetPlayers})`}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={full}
                onClick={onFillBots}
                className="flex-1 rounded-full border border-gold-400/40 py-2 text-sm text-gold-300 disabled:opacity-40"
              >
                AI 填满空位
              </button>
              <button
                type="button"
                onClick={onClearBots}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-parchment/60"
              >
                清除 AI
              </button>
            </div>
            <p className="text-center text-[11px] text-parchment/40">
              单人测试：设好人数后点「AI 填满空位」再开始
            </p>
          </div>
        )}

        {!isHost && (
          <p className="text-center text-sm text-parchment/60">等待房主开始…</p>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-md space-y-4 rounded-3xl border border-gold-400/20 bg-night-900/75 p-6 shadow-glow backdrop-blur"
    >
      <label className="block text-xs tracking-widest text-parchment/60">昵称</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-night-950 px-4 py-3 outline-none focus:border-gold-400/50"
        placeholder="圆桌骑士"
        maxLength={12}
      />
      <label className="block text-xs tracking-widest text-parchment/60">开房人数</label>
      <div className="flex flex-wrap gap-2">
        {[5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setTargetPlayers(n)}
            className={`rounded-full px-3 py-1 text-sm ${
              targetPlayers === n ? 'bg-gold-400 text-night-950' : 'border border-white/15'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!connected || !name.trim()}
        onClick={onCreate}
        className="w-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300 py-3 font-semibold text-night-950 disabled:opacity-40"
      >
        创建房间
      </button>
      <div className="relative py-2 text-center text-xs text-parchment/40">或加入</div>
      <input
        value={roomIdInput}
        onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
        className="w-full rounded-xl border border-white/10 bg-night-950 px-4 py-3 tracking-[0.3em] outline-none focus:border-gold-400/50"
        placeholder="房间 ID"
        maxLength={6}
      />
      <button
        type="button"
        disabled={!connected || !name.trim() || roomIdInput.length < 4}
        onClick={onJoin}
        className="w-full rounded-full border border-gold-400/40 py-3 font-semibold text-gold-300 disabled:opacity-40"
      >
        加入房间
      </button>
      {!connected && <p className="text-center text-sm text-blood-400">连接服务器中…</p>}
      {error && <p className="text-center text-sm text-blood-400">{error}</p>}
    </motion.div>
  )
}
