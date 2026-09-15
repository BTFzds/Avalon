import { useState } from 'react'
import { motion } from 'framer-motion'
import type { GameState } from '../types'
import { EmojiBar } from './EmojiBar'
import { RoleAvatar } from './RoleAvatar'

export function GameTable({
  state,
  onPropose,
  onVote,
  onQuest,
  onAssassinate,
  onRematch,
  onEmoji,
  draftTeam,
  setDraftTeam,
}: {
  state: GameState
  onPropose: () => void
  onVote: (approve: boolean) => void
  onQuest: (success: boolean) => void
  onAssassinate: (targetId: string) => void
  onRematch: () => void
  onEmoji: (emoji: string) => void
  draftTeam: string[]
  setDraftTeam: (ids: string[]) => void
}) {
  const { public: pub, private: priv } = state
  const me = priv.playerId
  const isLeader = pub.leaderId === me
  const size = pub.questTeamSize ?? 0
  const iAmOnQuest = pub.proposedTeam.includes(me)
  const voted = pub.votesSubmitted.includes(me)
  const quested = pub.questSubmitted.includes(me)
  const [showEmoji, setShowEmoji] = useState(false)
  const canPick = isLeader && pub.phase === 'team_propose'

  const toggleDraft = (id: string) => {
    if (!canPick) return
    if (draftTeam.includes(id)) setDraftTeam(draftTeam.filter((x) => x !== id))
    else if (draftTeam.length < size) setDraftTeam([...draftTeam, id])
  }

  const howTo = howToNow({
    phase: pub.phase,
    isLeader,
    size,
    picked: draftTeam.length,
    voted,
    iAmOnQuest,
    quested,
    canAssassinate: priv.canAssassinate,
    isGood: priv.isGood,
  })

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 pb-28">
      {/* Compact top status */}
      <div className="panel px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">当前阶段</p>
            <p className="text-lg font-bold text-ink-900">{howTo.title}</p>
          </div>
          <div className="text-right text-sm text-ink-500">
            <p>
              任务 {pub.questIndex + 1}/5 · 否决 {pub.rejectCount}/{pub.maxRejects}
            </p>
            <p>
              领袖：{pub.players.find((p) => p.id === pub.leaderId)?.name}
              {isLeader ? '（你）' : ''}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2">
          {pub.questResults.map((r, i) => {
            const done = r !== null
            const ok = r === true
            const current = !done && i === pub.questIndex
            return (
              <div
                key={i}
                className={`flex flex-col items-center justify-center rounded-xl border-2 px-1 py-2.5 ${
                  ok
                    ? 'border-moss-500 bg-moss-500 text-white'
                    : r === false
                      ? 'border-blood-500 bg-blood-500 text-white'
                      : current
                        ? 'border-gold-500 bg-gold-500/15 text-gold-600'
                        : 'border-mist-200 bg-mist-50 text-ink-500'
                }`}
              >
                <span className="text-[11px] font-bold opacity-90">第{i + 1}轮</span>
                <span className="text-lg font-black leading-none">
                  {ok ? '胜' : r === false ? '负' : current ? '进行' : '—'}
                </span>
                <span className="mt-0.5 text-[10px] font-semibold opacity-80">{pub.questSizes[i]}人</span>
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex justify-center gap-4 text-xs font-semibold">
          <span className="text-moss-600">
            正义 {pub.questResults.filter((r) => r === true).length}/3
          </span>
          <span className="text-blood-600">
            邪恶 {pub.questResults.filter((r) => r === false).length}/3
          </span>
        </div>
      </div>

      {/* Primary action first */}
      <div className="panel space-y-3 p-4">
        {pub.phase === 'team_propose' && isLeader && (
          <>
            <p className="text-center text-base font-semibold text-ink-900">
              已选{' '}
              <span className="text-gold-600">
                {draftTeam.length}/{size}
              </span>
            </p>
            <button
              type="button"
              disabled={draftTeam.length !== size}
              onClick={onPropose}
              className="btn-primary w-full !py-4 !text-lg"
            >
              提交队伍
            </button>
          </>
        )}

        {pub.phase === 'team_propose' && !isLeader && (
          <p className="py-2 text-center text-ink-700">等待领袖组队…</p>
        )}

        {pub.phase === 'team_vote' && (
          <>
            <p className="text-center text-sm text-ink-700">
              本轮队伍：
              <span className="font-semibold text-ink-900">
                {pub.proposedTeam.map((id) => pub.players.find((p) => p.id === id)?.name).join('、')}
              </span>
            </p>
            {!voted ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onVote(true)}
                  className="btn-good !min-h-[72px] !py-5 !text-xl"
                >
                  赞成
                </button>
                <button
                  type="button"
                  onClick={() => onVote(false)}
                  className="btn-bad !min-h-[72px] !py-5 !text-xl"
                >
                  反对
                </button>
              </div>
            ) : (
              <p className="text-center text-ink-500">
                已投票（还差 {pub.players.length - pub.votesSubmitted.length}）
              </p>
            )}
          </>
        )}

        {pub.phase === 'quest' && (
          <>
            {iAmOnQuest && !quested ? (
              <div className={`grid gap-3 ${priv.isGood === false ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <button type="button" onClick={() => onQuest(true)} className="btn-good !min-h-[72px] !py-5 !text-xl">
                  出成功
                </button>
                {priv.isGood === false && (
                  <button
                    type="button"
                    onClick={() => onQuest(false)}
                    className="btn-bad !min-h-[72px] !py-5 !text-xl"
                  >
                    出失败
                  </button>
                )}
              </div>
            ) : (
              <p className="py-2 text-center text-ink-700">
                {iAmOnQuest ? '已出牌，等待队友…' : '旁观等待结果…'}
              </p>
            )}
          </>
        )}

        {pub.phase === 'assassin' && (
          <>
            <p className="text-center text-lg font-bold text-blood-600">刺杀梅林</p>
            {priv.canAssassinate ? (
              <div className="flex flex-wrap justify-center gap-2">
                {pub.players
                  .filter((p) => p.id !== me)
                  .map((p) => (
                    <button key={p.id} type="button" onClick={() => onAssassinate(p.id)} className="btn-bad !py-4">
                      {p.name}
                    </button>
                  ))}
              </div>
            ) : (
              <p className="text-center text-ink-500">刺客选择中…</p>
            )}
          </>
        )}

        {pub.phase === 'ended' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h2 className={`font-display text-3xl ${pub.winner === 'good' ? 'text-moss-600' : 'text-blood-600'}`}>
              {pub.winner === 'good' ? '正义胜利' : '邪恶胜利'}
            </h2>
            <p className="mt-2 text-ink-700">{pub.winReason}</p>
            {me === pub.hostId && (
              <button type="button" onClick={onRematch} className="btn-primary mt-4 !py-4 !text-lg">
                再来一局
              </button>
            )}
          </motion.div>
        )}

        {pub.lastVoteTally && pub.phase !== 'team_vote' && pub.phase !== 'ended' && (
          <p className="text-center text-xs text-ink-500">
            上次投票 赞成{pub.lastVoteTally.approvals} / 反对{pub.lastVoteTally.rejects}
            {pub.lastQuestFailCount != null ? ` · 失败牌 ${pub.lastQuestFailCount}` : ''}
          </p>
        )}
      </div>

      {/* Players */}
      <div className="panel p-4">
        <p className="mb-3 text-sm font-semibold text-ink-500">
          玩家{canPick ? ' · 点击选择' : ''}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {pub.players.map((p) => {
            const selected =
              draftTeam.includes(p.id) ||
              (pub.phase !== 'team_propose' && pub.proposedTeam.includes(p.id))
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleDraft(p.id)}
                disabled={!canPick}
                className={`relative rounded-xl border-2 px-3 py-3 text-left transition ${
                  selected
                    ? 'border-gold-500 bg-gold-500/10'
                    : 'border-ink-900/10 bg-mist-50'
                } ${p.id === me ? 'ring-2 ring-moss-500/40' : ''} ${canPick ? 'active:scale-[0.98]' : ''}`}
              >
                {p.id === pub.leaderId && (
                  <span className="absolute -top-2 right-2 rounded-md bg-gold-500 px-1.5 text-[10px] font-bold text-white">
                    领袖
                  </span>
                )}
                <p className="truncate font-bold text-ink-900">{p.name}</p>
                <p className="text-xs text-ink-500">
                  {p.id === me ? '我' : p.isAi ? 'AI' : '玩家'}
                  {selected ? ' · 已选' : ''}
                </p>
                {pub.phase === 'ended' && p.role && (
                  <p className="mt-1 text-xs font-semibold text-gold-600">{pub.roleLabels[p.role]}</p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sticky role + optional emoji */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-900/10 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          {priv.role && (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <RoleAvatar role={priv.role} size={40} glow={false} />
              <div className="min-w-0">
                <p className="truncate font-bold text-ink-900">{priv.roleLabel}</p>
                <p className="text-xs text-ink-500">仅自己可见</p>
              </div>
            </div>
          )}
          <button type="button" className="btn-ghost shrink-0" onClick={() => setShowEmoji((v) => !v)}>
            {showEmoji ? '收起表情' : '表情'}
          </button>
        </div>
        {showEmoji && (
          <div className="mx-auto mt-2 max-w-xl">
            <EmojiBar onSend={onEmoji} />
          </div>
        )}
      </div>
    </div>
  )
}

function howToNow(opts: {
  phase: string
  isLeader: boolean
  size: number
  picked: number
  voted: boolean
  iAmOnQuest: boolean
  quested: boolean
  canAssassinate: boolean
  isGood: boolean | null
}): { title: string } {
  switch (opts.phase) {
    case 'team_propose':
      return { title: opts.isLeader ? '你来组队' : '等待组队' }
    case 'team_vote':
      return { title: opts.voted ? '已投票' : '请投票' }
    case 'quest':
      if (!opts.iAmOnQuest) return { title: '旁观任务' }
      if (opts.quested) return { title: '已出牌' }
      return { title: '秘密出牌' }
    case 'assassin':
      return { title: opts.canAssassinate ? '刺杀梅林' : '刺杀阶段' }
    case 'ended':
      return { title: '对局结束' }
    default:
      return { title: opts.phase }
  }
}
