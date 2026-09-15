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
        className="mx-auto w-full max-w-lg space-y-4"
      >
        <div className="panel p-5 text-center">
          <p className="text-sm font-semibold text-ink-500">房间号</p>
          <h2 className="font-display text-4xl tracking-[0.2em] text-gold-600">{publicState.roomId}</h2>
          <p className="mt-1 text-sm text-ink-700">
            {publicState.players.length}/{publicState.targetPlayers} 人 · 好 {publicState.goodEvil[0]}/
            {publicState.goodEvil[1]}
          </p>
          <ul className="mt-4 space-y-2 text-left">
            {publicState.players.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl bg-mist-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-ink-900">
                  {p.name}
                  {p.isHost ? ' · 房主' : ''}
                  {p.isAi ? ' · AI' : ''}
                </span>
                <span className={`h-2.5 w-2.5 rounded-full ${p.connected ? 'bg-moss-500' : 'bg-blood-500'}`} />
              </li>
            ))}
          </ul>
        </div>

        {isHost && (
          <div className="panel space-y-4 p-5">
            <div>
              <p className="mb-2 text-sm font-semibold text-ink-500">人数</p>
              <div className="flex flex-wrap gap-2">
                {[5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onConfigurePlayers(n)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                      publicState.targetPlayers === n
                        ? 'bg-gold-500 text-white'
                        : 'bg-mist-100 text-ink-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-500">
                  角色 {publicState.usingCustomRoles ? '(自定义)' : '(推荐)'}
                </p>
                {publicState.usingCustomRoles && (
                  <button type="button" className="text-xs font-semibold text-gold-600" onClick={onClearCustom}>
                    恢复推荐
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
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
                        } else next.push(role)
                        onSetCustomRoles(next)
                      }}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                        count
                          ? 'border-gold-500 bg-gold-500/10 text-gold-600'
                          : 'border-ink-900/10 text-ink-500'
                      }`}
                    >
                      {ROLE_META[role].label}
                      {count > 1 ? `×${count}` : ''}
                      {(role === 'servant' || role === 'minion') && (
                        <span
                          className="ml-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSetCustomRoles([...publicState.rolesPreset, role])
                          }}
                        >
                          +
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            <button type="button" disabled={!full} onClick={onStart} className="btn-primary w-full">
              {full ? '开始游戏' : `等人齐 ${publicState.players.length}/${publicState.targetPlayers}`}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={full} onClick={onFillBots} className="btn-ghost">
                AI 填满
              </button>
              <button type="button" onClick={onClearBots} className="btn-ghost">
                清除 AI
              </button>
            </div>
            <p className="text-center text-xs text-ink-500">点顶栏「邀请好友」复制链接发给同伴</p>
          </div>
        )}

        {!isHost && <p className="text-center text-sm text-ink-500">等待房主开始…</p>}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel mx-auto w-full max-w-md space-y-4 p-5"
    >
      <label className="block text-sm font-semibold text-ink-500">昵称</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border border-ink-900/15 bg-mist-50 px-4 py-3 text-ink-900 outline-none focus:border-gold-500"
        placeholder="圆桌骑士"
        maxLength={12}
      />
      <label className="block text-sm font-semibold text-ink-500">开房人数</label>
      <div className="flex flex-wrap gap-2">
        {[5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setTargetPlayers(n)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              targetPlayers === n ? 'bg-gold-500 text-white' : 'bg-mist-100 text-ink-700'
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
        className="btn-primary w-full"
      >
        创建房间（自动生成房间码）
      </button>
      <p className="text-center text-xs text-ink-500">或加入已有房间</p>
      <input
        value={roomIdInput}
        onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
        className="w-full rounded-xl border border-ink-900/15 bg-mist-50 px-4 py-3 tracking-[0.25em] text-ink-900 outline-none focus:border-gold-500"
        placeholder="房间 ID"
        maxLength={6}
      />
      <button
        type="button"
        disabled={!connected || !name.trim() || roomIdInput.length < 4}
        onClick={onJoin}
        className="btn-ghost w-full py-3"
      >
        加入房间
      </button>
      {!connected && (
        <p className="text-center text-sm text-blood-600">未连上服务器，请确认后端在 8000 端口</p>
      )}
      {error && <p className="text-center text-sm text-blood-600">{error}</p>}
    </motion.div>
  )
}
