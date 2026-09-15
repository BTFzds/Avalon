import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Lobby } from './components/Lobby'
import { GameTable } from './components/GameTable'
import { RoleReveal } from './components/RoleReveal'
import { EmojiBurst } from './components/EmojiBar'
import { Manual } from './components/Manual'
import { ServerSettings } from './components/ServerSettings'
import { createGameSocket, type SendFn } from './lib/ws'
import type { EmojiEvent, GameState, PrivateState, PublicState } from './types'

const STORAGE_KEY = 'avalon-session'

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
  const [socketKey, setSocketKey] = useState(0)
  const sendRef = useRef<SendFn>(() => {})

  useEffect(() => {
    localStorage.setItem('avalon-name', name)
  }, [name])

  useEffect(() => {
    let alive = true
    const session = localStorage.getItem(STORAGE_KEY)
    setConnected(false)
    setError(null)
    const sock = createGameSocket({
      onOpen: () => {
        if (!alive) return
        setConnected(true)
        setError(null)
        if (session) {
          try {
            const { roomId, playerId } = JSON.parse(session)
            sock.send({ action: 'reconnect', roomId, playerId })
          } catch {
            /* ignore */
          }
        }
      },
      onClose: () => {
        if (!alive) return
        setConnected(false)
      },
      onError: (m) => {
        if (!alive) return
        // Stale room session from last test — drop it instead of blocking UI
        if (m.includes('无法重连') || m.includes('房间不存在') || m.includes('房间已失效')) {
          localStorage.removeItem(STORAGE_KEY)
          setError(null)
          return
        }
        setError(m)
      },
      onState: (raw) => {
        if (!alive) return
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
        if (!alive) return
        setEmojis((prev) => [...prev.slice(-4), e])
        setTimeout(() => {
          setEmojis((prev) => prev.slice(1))
        }, 2200)
      },
    })
    sendRef.current = sock.send
    return () => {
      alive = false
      sock.close()
    }
  }, [socketKey])

  const send = useCallback((payload: Record<string, unknown>) => sendRef.current(payload), [])

  const inRoom = !!state
  const isHost = state?.private.playerId === state?.public.hostId
  const mePlayer = state?.public.players.find((p) => p.id === state.private.playerId)
  const waitingAck =
    state && state.public.phase === 'role_reveal'
      ? state.public.players.filter((p) => !p.roleAcked).length
      : 0

  const inGame = !!(state && state.public.phase !== 'lobby')

  return (
    <div className="bg-grid relative min-h-dvh overflow-x-hidden px-4 pb-10 pt-5">
      <EmojiBurst events={emojis} />

      <header className="relative z-10 mx-auto mb-5 max-w-xl text-center">
        {!inGame && (
          <>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl font-bold text-gold-600 sm:text-5xl"
            >
              阿瓦隆
            </motion.h1>
            <p className="mt-1 text-sm text-ink-500">熟人联机 · 本地可 AI 单人测试</p>
          </>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span
            className={`rounded-full px-2.5 py-1 font-semibold ${
              connected ? 'bg-moss-500/15 text-moss-600' : 'bg-blood-500/15 text-blood-600'
            }`}
          >
            {connected ? '已连接' : '未连接'}
          </span>
          {state && (
            <span className="rounded-full bg-mist-100 px-2.5 py-1 font-bold tracking-wider text-ink-900">
              {state.public.roomId}
            </span>
          )}
          <button type="button" onClick={() => setManualOpen(true)} className="btn-ghost !py-1 !text-xs">
            说明书
          </button>
          {!connected && (
            <button type="button" onClick={() => setSocketKey((k) => k + 1)} className="btn-ghost !py-1 !text-xs">
              重新连接
            </button>
          )}
        </div>
        {!inGame && <ServerSettings onSaved={() => setSocketKey((k) => k + 1)} />}
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
