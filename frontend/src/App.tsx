import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Lobby } from './components/Lobby'
import { GameTable } from './components/GameTable'
import { RoleReveal } from './components/RoleReveal'
import { EmojiBurst } from './components/EmojiBar'
import { Manual } from './components/Manual'
import { createGameSocket, type SendFn } from './lib/ws'
import type { EmojiEvent, GameState, PrivateState, PublicState } from './types'

const STORAGE_KEY = 'avalon-session'

function Particles() {
  const dots = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        left: `${(i * 17) % 100}%`,
        delay: `${(i % 9) * 0.7}s`,
        duration: `${10 + (i % 5)}s`,
      })),
    [],
  )
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {dots.map((d, i) => (
        <span
          key={i}
          className="particle"
          style={{ left: d.left, animationDelay: d.delay, animationDuration: d.duration }}
        />
      ))}
    </div>
  )
}

function visionLines(priv: PrivateState): string[] {
  const v = priv.vision || {}
  const lines: string[] = []
  if (v.sees_evil?.length) {
    lines.push(`邪恶（可见）：${v.sees_evil.map((x) => x.name).join('、')}`)
  }
  if (v.sees_merlin_candidates?.length) {
    lines.push(`疑似梅林：${v.sees_merlin_candidates.map((x) => x.name).join('、')}`)
  }
  if (v.sees_evil_allies?.length) {
    lines.push(`邪恶队友：${v.sees_evil_allies.map((x) => x.name).join('、')}`)
  }
  if (priv.role === 'oberon') lines.push('你是奥伯伦：看不到其他邪恶，他们也看不到你')
  if (priv.role === 'servant') lines.push('你没有额外夜间信息')
  return lines
}

export default function App() {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState(() => localStorage.getItem('avalon-name') || '')
  const [roomIdInput, setRoomIdInput] = useState('')
  const [targetPlayers, setTargetPlayers] = useState(7)
  const [state, setState] = useState<GameState | null>(null)
  const [emojis, setEmojis] = useState<EmojiEvent[]>([])
  const [draftTeam, setDraftTeam] = useState<string[]>([])
  const [manualOpen, setManualOpen] = useState(false)
  const sendRef = useRef<SendFn>(() => {})

  useEffect(() => {
    localStorage.setItem('avalon-name', name)
  }, [name])

  useEffect(() => {
    const session = localStorage.getItem(STORAGE_KEY)
    const sock = createGameSocket({
      onOpen: () => {
        setConnected(true)
        if (session) {
          try {
            const { roomId, playerId } = JSON.parse(session)
            sock.send({ action: 'reconnect', roomId, playerId })
          } catch {
            /* ignore */
          }
        }
      },
      onClose: () => setConnected(false),
      onError: (m) => setError(m),
      onState: (raw) => {
        const data = raw as { public: PublicState; private: PrivateState }
        setState({ public: data.public, private: data.private })
        setError(null)
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ roomId: data.public.roomId, playerId: data.private.playerId }),
        )
        if (data.public.phase === 'team_propose') {
          setDraftTeam([])
        }
      },
      onEmoji: (e) => {
        setEmojis((prev) => [...prev.slice(-4), e])
        setTimeout(() => {
          setEmojis((prev) => prev.slice(1))
        }, 2200)
      },
    })
    sendRef.current = sock.send
    return () => sock.close()
  }, [])

  const send = useCallback((payload: Record<string, unknown>) => sendRef.current(payload), [])

  const inRoom = !!state
  const isHost = state?.private.playerId === state?.public.hostId
  const mePlayer = state?.public.players.find((p) => p.id === state.private.playerId)
  const waitingAck =
    state && state.public.phase === 'role_reveal'
      ? state.public.players.filter((p) => !p.roleAcked).length
      : 0

  return (
    <div className="bg-grid relative min-h-dvh overflow-x-hidden px-4 pb-10 pt-8">
      <Particles />
      <EmojiBurst events={emojis} />

      <header className="relative z-10 mx-auto mb-8 max-w-3xl text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs tracking-[0.45em] text-gold-300/70"
        >
          THE RESISTANCE
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-display text-5xl font-bold tracking-wide text-gold-300 sm:text-6xl"
        >
          阿瓦隆
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-2 text-sm text-parchment/65"
        >
          忠诚与暗影交织的圆桌对决 · 熟人联机
        </motion.p>
        <div className="mt-3 flex justify-center gap-2 text-[11px]">
          <span
            className={`rounded-full px-2 py-0.5 ${connected ? 'bg-moss-700/40 text-moss-400' : 'bg-blood-700/40 text-blood-400'}`}
          >
            {connected ? '已连接' : '未连接'}
          </span>
          {state && (
            <span className="rounded-full bg-night-800 px-2 py-0.5 text-parchment/60">
              {state.public.roomId}
            </span>
          )}
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="rounded-full border border-gold-400/40 px-2 py-0.5 text-gold-300 hover:bg-gold-400/10"
          >
            说明书
          </button>
        </div>
      </header>

      <Manual open={manualOpen} onClose={() => setManualOpen(false)} />

      <main className="relative z-10">
        {(!state || state.public.phase === 'lobby') && (
          <Lobby
            name={name}
            setName={setName}
            roomIdInput={roomIdInput}
            setRoomIdInput={setRoomIdInput}
            targetPlayers={targetPlayers}
            setTargetPlayers={setTargetPlayers}
            connected={connected}
            inRoom={inRoom && state?.public.phase === 'lobby'}
            publicState={state?.public ?? null}
            isHost={!!isHost}
            error={error}
            onCreate={() => send({ action: 'create', name, targetPlayers })}
            onJoin={() => send({ action: 'join', name, roomId: roomIdInput })}
            onStart={() => send({ action: 'start' })}
            onConfigurePlayers={(n) => send({ action: 'configure', targetPlayers: n })}
            onSetCustomRoles={(roles) => send({ action: 'configure', customRoles: roles })}
            onClearCustom={() => send({ action: 'configure', clearCustom: true })}
            onFillBots={() => send({ action: 'fill_bots' })}
            onClearBots={() => send({ action: 'clear_bots' })}
          />
        )}

        {state && state.public.phase !== 'lobby' && state.public.phase !== 'role_reveal' && (
          <GameTable
            state={state}
            draftTeam={draftTeam}
            setDraftTeam={setDraftTeam}
            onPropose={() => send({ action: 'propose_team', team: draftTeam })}
            onVote={(approve) => send({ action: 'team_vote', approve })}
            onQuest={(success) => send({ action: 'quest_card', success })}
            onAssassinate={(targetId) => send({ action: 'assassinate', targetId })}
            onRematch={() => send({ action: 'rematch' })}
            onEmoji={(emoji) => send({ action: 'emoji', emoji })}
          />
        )}
      </main>

      {state && state.public.phase === 'role_reveal' && state.private.role && (
        <RoleReveal
          role={state.private.role}
          visionText={visionLines(state.private)}
          acked={!!mePlayer?.roleAcked}
          waitingCount={Math.max(0, waitingAck - (mePlayer?.roleAcked ? 0 : 1))}
          onAck={() => send({ action: 'ack_role' })}
        />
      )}

      {error && state && (
        <p className="relative z-10 mt-4 text-center text-sm text-blood-400">{error}</p>
      )}
    </div>
  )
}
