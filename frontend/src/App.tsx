import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lobby } from './components/Lobby'
import { GameTable } from './components/GameTable'
import { RoleReveal } from './components/RoleReveal'
import { EmojiBurst } from './components/EmojiBar'
import { Manual } from './components/Manual'
import { useAvalonOnline } from './hooks/useAvalonOnline'
import type { PrivateState } from './types'

function visionLines(priv: PrivateState): string[] {
  const v = priv.vision || {}
  const lines: string[] = []
  if (v.sees_evil?.length) lines.push(`邪恶（可见）：${v.sees_evil.map((x) => x.name).join('、')}`)
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
  const [manualOpen, setManualOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const g = useAvalonOnline()

  const inRoom = !!g.game
  const isHost = g.game?.private.playerId === g.game?.public.hostId
  const mePlayer = g.game?.public.players.find((p) => p.id === g.game?.private.playerId)
  const waitingAck =
    g.game && g.game.public.phase === 'role_reveal'
      ? g.game.public.players.filter((p) => !p.roleAcked).length
      : 0
  const inGame = !!(g.game && g.game.public.phase !== 'lobby')

  return (
    <div className="bg-grid relative min-h-dvh overflow-x-hidden px-4 pb-10 pt-5">
      <EmojiBurst events={g.emojis} />

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
            <p className="mt-1 text-sm text-ink-500">熟人联机 · Firebase · 发链接即可一起玩</p>
          </>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span
            className={`rounded-full px-2.5 py-1 font-semibold ${
              g.connected ? 'bg-moss-500/15 text-moss-600' : 'bg-blood-500/15 text-blood-600'
            }`}
          >
            {g.connected ? 'Firebase 已就绪' : '未配置 Firebase'}
          </span>
          {g.game && (
            <span className="rounded-full bg-mist-100 px-2.5 py-1 font-bold tracking-wider text-ink-900">
              {g.game.public.roomId}
            </span>
          )}
          <button type="button" onClick={() => setManualOpen(true)} className="btn-ghost !py-1 !text-xs">
            说明书
          </button>
          {g.inviteLink && (
            <button
              type="button"
              className="btn-ghost !py-1 !text-xs"
              onClick={async () => {
                await g.copyInvite()
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1500)
              }}
            >
              {copied ? '已复制链接' : '邀请好友'}
            </button>
          )}
        </div>
        {!g.firebaseReady && (
          <p className="mt-2 text-sm text-blood-600">请按 docs/FIREBASE_SETUP.md 配置环境变量后重启</p>
        )}
      </header>

      <Manual open={manualOpen} onClose={() => setManualOpen(false)} />

      <main className="relative z-10">
        {(!g.game || g.game.public.phase === 'lobby') && (
          <Lobby
            name={g.name}
            setName={g.setName}
            roomIdInput={g.roomIdInput}
            setRoomIdInput={g.setRoomIdInput}
            targetPlayers={g.targetPlayers}
            setTargetPlayers={g.setTargetPlayers}
            connected={g.connected}
            inRoom={inRoom && g.game?.public.phase === 'lobby'}
            publicState={g.game?.public ?? null}
            isHost={!!isHost}
            error={g.error}
            onCreate={() => void g.createRoom()}
            onJoin={() => void g.joinRoom()}
            onStart={() => void g.send({ type: 'start' })}
            onConfigurePlayers={(n) => void g.send({ type: 'configure', targetPlayers: n })}
            onSetCustomRoles={(roles) => void g.send({ type: 'configure', customRoles: roles })}
            onClearCustom={() => void g.send({ type: 'configure', clearCustom: true })}
            onFillBots={() => void g.send({ type: 'fill_bots' })}
            onClearBots={() => void g.send({ type: 'clear_bots' })}
          />
        )}

        {g.game && g.game.public.phase !== 'lobby' && g.game.public.phase !== 'role_reveal' && (
          <GameTable
            state={g.game}
            draftTeam={g.draftTeam}
            setDraftTeam={g.setDraftTeam}
            onPropose={() => void g.send({ type: 'propose_team', team: g.draftTeam })}
            onVote={(approve) => void g.send({ type: 'team_vote', approve })}
            onQuest={(success) => void g.send({ type: 'quest_card', success })}
            onAssassinate={(targetId) => void g.send({ type: 'assassinate', targetId })}
            onRematch={() => void g.send({ type: 'rematch' })}
            onEmoji={(emoji) => void g.send({ type: 'emoji', emoji })}
          />
        )}
      </main>

      {g.game && g.game.public.phase === 'role_reveal' && g.game.private.role && (
        <RoleReveal
          role={g.game.private.role}
          visionText={visionLines(g.game.private)}
          acked={!!mePlayer?.roleAcked}
          waitingCount={Math.max(0, waitingAck - (mePlayer?.roleAcked ? 0 : 1))}
          onAck={() => void g.send({ type: 'ack_role' })}
        />
      )}

      {g.error && g.game && g.game.public.phase !== 'lobby' && (
        <p className="relative z-10 mt-4 text-center text-sm text-blood-600">{g.error}</p>
      )}
    </div>
  )
}
