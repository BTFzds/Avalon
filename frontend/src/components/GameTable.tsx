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

  const toggleDraft = (id: string) => {
    if (!isLeader || pub.phase !== 'team_propose') return
    if (draftTeam.includes(id)) setDraftTeam(draftTeam.filter((x) => x !== id))
    else if (draftTeam.length < size) setDraftTeam([...draftTeam, id])
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 pb-8">
      <QuestTrack results={pub.questResults} sizes={pub.questSizes} index={pub.questIndex} />

      <div className="rounded-2xl border border-white/10 bg-night-900/70 px-4 py-3 text-center text-sm">
        <PhaseBanner phase={pub.phase} rejectCount={pub.rejectCount} maxRejects={pub.maxRejects} />
        {pub.leaderId && (
          <p className="mt-1 text-parchment/70">
            领袖：{pub.players.find((p) => p.id === pub.leaderId)?.name}
            {isLeader ? '（你）' : ''}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {pub.players.map((p) => {
          const selected =
            draftTeam.includes(p.id) ||
            (pub.phase !== 'team_propose' && pub.proposedTeam.includes(p.id))
          return (
            <motion.button
              key={p.id}
              type="button"
              layout
              onClick={() => toggleDraft(p.id)}
              className={`relative rounded-2xl border p-3 text-left transition ${
                selected
                  ? 'border-gold-400 bg-gold-400/10 shadow-glow'
                  : 'border-white/10 bg-night-900/60'
              } ${p.id === me ? 'ring-1 ring-moss-400/40' : ''}`}
            >
              {p.id === pub.leaderId && (
                <span className="absolute -top-2 right-2 rounded-full bg-gold-400 px-2 text-[10px] font-bold text-night-950">
                  领袖
                </span>
              )}
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-[11px] text-parchment/50">
                    {p.isAi ? 'AI' : p.connected ? '在线' : '断线'}
                  </p>
              {pub.phase === 'ended' && p.role && (
                <div className="mt-2 flex items-center gap-2">
                  <RoleAvatar role={p.role} size={36} glow={false} />
                  <span className="text-xs text-gold-300">{pub.roleLabels[p.role]}</span>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {pub.phase === 'team_propose' && isLeader && (
        <div className="rounded-2xl border border-gold-400/30 bg-night-900/80 p-4 text-center">
          <p className="text-sm">
            选择 {size} 人出任务（已选 {draftTeam.length}）
          </p>
          <button
            type="button"
            disabled={draftTeam.length !== size}
            onClick={onPropose}
            className="mt-3 rounded-full bg-gold-400 px-6 py-2 font-semibold text-night-950 disabled:opacity-40"
          >
            提交队伍
          </button>
        </div>
      )}

      {pub.phase === 'team_vote' && (
        <div className="rounded-2xl border border-white/10 bg-night-900/80 p-4 text-center">
          <p className="text-sm text-parchment/80">
            队伍：
            {pub.proposedTeam
              .map((id) => pub.players.find((p) => p.id === id)?.name)
              .join('、')}
          </p>
          {!voted ? (
            <div className="mt-3 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => onVote(true)}
                className="rounded-full bg-moss-500 px-6 py-2 font-semibold text-night-950"
              >
                赞成
              </button>
              <button
                type="button"
                onClick={() => onVote(false)}
                className="rounded-full bg-blood-500 px-6 py-2 font-semibold text-white"
              >
                反对
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-parchment/60">
              已投票 · 等待 {pub.players.length - pub.votesSubmitted.length} 人
            </p>
          )}
        </div>
      )}

      {pub.phase === 'quest' && (
        <div className="rounded-2xl border border-gold-400/20 bg-night-900/80 p-4 text-center">
          {iAmOnQuest ? (
            !quested ? (
              <>
                <p className="text-sm">秘密出牌（本轮失败需 {pub.failsNeeded} 张失败）</p>
                <div className="mt-3 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => onQuest(true)}
                    className="rounded-full bg-moss-500 px-6 py-2 font-semibold text-night-950"
                  >
                    成功
                  </button>
                  {priv.isGood === false && (
                    <button
                      type="button"
                      onClick={() => onQuest(false)}
                      className="rounded-full bg-blood-500 px-6 py-2 font-semibold text-white"
                    >
                      失败
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-parchment/60">已出牌，等待队友…</p>
            )
          ) : (
            <p className="text-sm text-parchment/60">你不在队伍中，等待任务结果…</p>
          )}
        </div>
      )}

      {pub.phase === 'assassin' && (
        <div className="rounded-2xl border border-blood-400/40 bg-night-900/80 p-4 text-center shadow-glow-evil">
          <p className="font-display text-lg text-blood-400">刺杀梅林</p>
          {priv.canAssassinate ? (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {pub.players
                .filter((p) => p.id !== me)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onAssassinate(p.id)}
                    className="rounded-full border border-blood-400/50 px-4 py-2 text-sm hover:bg-blood-700"
                  >
                    {p.name}
                  </button>
                ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-parchment/60">刺客正在抉择…</p>
          )}
        </div>
      )}

      {pub.phase === 'ended' && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`rounded-3xl border p-6 text-center ${
            pub.winner === 'good'
              ? 'border-moss-400/40 bg-moss-700/20 shadow-glow-good'
              : 'border-blood-400/40 bg-blood-700/20 shadow-glow-evil'
          }`}
        >
          <h2 className="font-display text-3xl">
            {pub.winner === 'good' ? '正义胜利' : '邪恶胜利'}
          </h2>
          <p className="mt-2 text-sm text-parchment/80">{pub.winReason}</p>
          {me === pub.hostId && (
            <button
              type="button"
              onClick={onRematch}
              className="mt-4 rounded-full bg-gold-400 px-6 py-2 font-semibold text-night-950"
            >
              再来一局
            </button>
          )}
        </motion.div>
      )}

      {pub.lastVoteTally && pub.phase !== 'team_vote' && (
        <p className="text-center text-xs text-parchment/45">
          上次投票：赞成 {pub.lastVoteTally.approvals} / 反对 {pub.lastVoteTally.rejects}
          {pub.lastQuestFailCount != null ? ` · 上次任务失败牌 ${pub.lastQuestFailCount}` : ''}
        </p>
      )}

      <div className="pt-2">
        <EmojiBar onSend={onEmoji} />
      </div>

      {priv.role && pub.phase !== 'role_reveal' && pub.phase !== 'lobby' && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/5 bg-night-950/50 p-3">
          <RoleAvatar role={priv.role} size={48} glow={false} />
          <div className="text-left text-sm">
            <p className="font-semibold text-gold-300">{priv.roleLabel}</p>
            <p className="text-xs text-parchment/50">仅自己可见</p>
          </div>
        </div>
      )}
    </div>
  )
}

function QuestTrack({
  results,
  sizes,
  index,
}: {
  results: (boolean | null)[]
  sizes: number[]
  index: number
}) {
  return (
    <div className="flex justify-center gap-2">
      {results.map((r, i) => (
        <div
          key={i}
          className={`flex h-14 w-14 flex-col items-center justify-center rounded-2xl border text-xs ${
            r === true
              ? 'border-moss-400 bg-moss-700/40 text-moss-400'
              : r === false
                ? 'border-blood-400 bg-blood-700/40 text-blood-400'
                : i === index
                  ? 'border-gold-400 bg-gold-400/10 text-gold-300 shadow-glow'
                  : 'border-white/10 bg-night-900/50 text-parchment/40'
          }`}
        >
          <span className="font-display text-sm">Q{i + 1}</span>
          <span>{sizes[i]}人</span>
        </div>
      ))}
    </div>
  )
}

function PhaseBanner({
  phase,
  rejectCount,
  maxRejects,
}: {
  phase: string
  rejectCount: number
  maxRejects: number
}) {
  const map: Record<string, string> = {
    team_propose: '组队提议',
    team_vote: '全员投票',
    quest: '执行任务',
    assassin: '刺客行动',
    ended: '对局结束',
    role_reveal: '身份确认',
  }
  return (
    <p className="font-display tracking-widest text-gold-300">
      {map[phase] || phase}
      {phase === 'team_propose' || phase === 'team_vote'
        ? ` · 否决 ${rejectCount}/${maxRejects}`
        : ''}
    </p>
  )
}
