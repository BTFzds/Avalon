import {
  ASSASSIN,
  EVIL_ROLES,
  failsNeeded,
  GOOD_ROLES,
  OBERON,
  QUEST_TEAM_SIZES,
} from './config'
import type { Player, RoomState } from './engine'
import {
  ackRole,
  assassinate,
  castTeamVote,
  playQuestCard,
  proposeTeam,
} from './engine'

function evilIds(state: RoomState): Set<string> {
  return new Set(state.players.filter((p) => p.role && EVIL_ROLES.has(p.role)).map((p) => p.id))
}

function pickTeam(state: RoomState, leader: Player, size: number): string[] {
  const ids = state.players.map((p) => p.id)
  const evil = evilIds(state)
  const isEvil = leader.role && EVIL_ROLES.has(leader.role) && leader.role !== OBERON
  const team = [leader.id]
  const pool = isEvil
    ? [...ids.filter((id) => evil.has(id) && id !== leader.id), ...ids.filter((id) => !evil.has(id))]
    : ids.filter((id) => id !== leader.id).sort(() => Math.random() - 0.5)
  for (const id of pool) {
    if (team.length >= size) break
    if (!team.includes(id)) team.push(id)
  }
  while (team.length < size) {
    const cand = ids[Math.floor(Math.random() * ids.length)]
    if (!team.includes(cand)) team.push(cand)
  }
  return team.slice(0, size)
}

function voteApprove(state: RoomState, voter: Player): boolean {
  const team = new Set(state.proposedTeam)
  const evil = evilIds(state)
  const onTeam = team.has(voter.id)
  const pressure = state.rejectCount >= 3
  if (voter.role && GOOD_ROLES.has(voter.role)) {
    if (pressure) return true
    return onTeam ? Math.random() < 0.85 : Math.random() < 0.55
  }
  const evilOn = [...team].filter((id) => evil.has(id)).length
  if (pressure) return true
  return evilOn >= 1 ? Math.random() < 0.75 : Math.random() < 0.35
}

function questSuccess(state: RoomState, player: Player): boolean {
  if (player.role && GOOD_ROLES.has(player.role)) return true
  const successes = state.questResults.filter((r) => r === true).length
  let failChance = 0.55
  if (successes >= 2) failChance = 0.9
  if (failsNeeded(state.targetPlayers, state.questIndex) >= 2) failChance = Math.min(0.95, failChance + 0.1)
  return Math.random() >= failChance
}

/** Host-side: apply at most one AI action. */
export function stepBots(state: RoomState): RoomState | null {
  const bots = state.players.filter((p) => p.isAi)
  if (!bots.length) return null

  if (state.phase === 'role_reveal') {
    const bot = bots.find((b) => !b.roleAcked)
    return bot ? ackRole(state, bot.id) : null
  }
  if (state.phase === 'team_propose' && state.leaderId) {
    const leader = state.players.find((p) => p.id === state.leaderId)
    if (leader?.isAi) {
      const size = QUEST_TEAM_SIZES[state.targetPlayers][state.questIndex]
      return proposeTeam(state, leader.id, pickTeam(state, leader, size))
    }
    return null
  }
  if (state.phase === 'team_vote') {
    const bot = bots.find((b) => !(b.id in state.teamVotes))
    return bot ? castTeamVote(state, bot.id, voteApprove(state, bot)) : null
  }
  if (state.phase === 'quest') {
    const bot = bots.find(
      (b) => state.proposedTeam.includes(b.id) && !(b.id in state.questCards),
    )
    return bot ? playQuestCard(state, bot.id, questSuccess(state, bot)) : null
  }
  if (state.phase === 'assassin') {
    const assassin = bots.find((b) => b.role === ASSASSIN)
    if (!assassin) return null
    const evil = evilIds(state)
    const candidates = state.players.filter((p) => !evil.has(p.id))
    const target = candidates[Math.floor(Math.random() * candidates.length)] || assassin
    return assassinate(state, assassin.id, target.id)
  }
  return null
}
