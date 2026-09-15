import {
  ASSASSIN,
  DEFAULT_ROLES,
  EVIL_ROLES,
  failsNeeded,
  GOOD_ROLES,
  GOOD_EVIL_COUNT,
  MAX_TEAM_REJECTIONS,
  MERLIN,
  MORGANA,
  OBERON,
  QUEST_TEAM_SIZES,
  QUESTS_TO_WIN,
  ROLE_LABELS_ZH,
  validateRoleList,
  BOT_NAMES,
  MORDRED,
} from './config'

export type Phase =
  | 'lobby'
  | 'role_reveal'
  | 'team_propose'
  | 'team_vote'
  | 'quest'
  | 'assassin'
  | 'ended'

export interface Player {
  id: string
  name: string
  seat: number
  connected: boolean
  role: string | null
  roleAcked: boolean
  isAi: boolean
}

export interface RoomState {
  roomId: string
  hostId: string
  targetPlayers: number
  customRoles: string[] | null
  phase: Phase
  players: Player[]
  leaderId: string | null
  questIndex: number
  questResults: (boolean | null)[]
  rejectCount: number
  proposedTeam: string[]
  teamVotes: Record<string, boolean>
  questCards: Record<string, boolean>
  assassinTarget: string | null
  winner: 'good' | 'evil' | null
  winReason: string | null
  lastVoteTally: {
    approvals: number
    rejects: number
    votes: Record<string, boolean>
    approved: boolean
  } | null
  lastQuestFailCount: number | null
  updatedAt: number
}

function uid(): string {
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

export function randomRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export function roleList(state: RoomState): string[] {
  return state.customRoles ? [...state.customRoles] : [...DEFAULT_ROLES[state.targetPlayers]]
}

function ordered(state: RoomState): Player[] {
  return [...state.players].sort((a, b) => a.seat - b.seat)
}

function nextLeader(state: RoomState): string {
  const ids = ordered(state).map((p) => p.id)
  if (!state.leaderId || !ids.includes(state.leaderId)) return ids[0]
  const idx = ids.indexOf(state.leaderId)
  return ids[(idx + 1) % ids.length]
}

function touch(state: RoomState): RoomState {
  return { ...state, updatedAt: Date.now() }
}

export function createLobby(hostName: string, targetPlayers: number, hostId?: string): RoomState {
  if (!(targetPlayers in GOOD_EVIL_COUNT)) throw new Error('人数须为 5–10')
  const id = hostId || uid()
  return touch({
    roomId: randomRoomId(),
    hostId: id,
    targetPlayers,
    customRoles: null,
    phase: 'lobby',
    players: [
      {
        id,
        name: hostName.trim() || '房主',
        seat: 0,
        connected: true,
        role: null,
        roleAcked: false,
        isAi: false,
      },
    ],
    leaderId: null,
    questIndex: 0,
    questResults: [null, null, null, null, null],
    rejectCount: 0,
    proposedTeam: [],
    teamVotes: {},
    questCards: {},
    assassinTarget: null,
    winner: null,
    winReason: null,
    lastVoteTally: null,
    lastQuestFailCount: null,
    updatedAt: 0,
  })
}

export function addPlayer(state: RoomState, name: string, playerId?: string): RoomState {
  if (state.phase !== 'lobby') throw new Error('对局已开始，无法加入')
  if (state.players.length >= state.targetPlayers) throw new Error('房间已满')
  const id = playerId || uid()
  if (state.players.some((p) => p.id === id)) return state
  return touch({
    ...state,
    players: [
      ...state.players,
      {
        id,
        name: name.trim() || `玩家${state.players.length + 1}`,
        seat: state.players.length,
        connected: true,
        role: null,
        roleAcked: false,
        isAi: false,
      },
    ],
  })
}

export function setTargetPlayers(state: RoomState, n: number, actorId: string): RoomState {
  if (actorId !== state.hostId) throw new Error('仅房主可改设置')
  if (state.phase !== 'lobby') throw new Error('对局已开始')
  if (!(n in GOOD_EVIL_COUNT)) throw new Error('人数须为 5–10')
  if (state.players.length > n) throw new Error('当前人数已超过目标人数')
  return touch({ ...state, targetPlayers: n, customRoles: null })
}

export function setCustomRoles(state: RoomState, roles: string[] | null, actorId: string): RoomState {
  if (actorId !== state.hostId) throw new Error('仅房主可改设置')
  if (state.phase !== 'lobby') throw new Error('对局已开始')
  if (roles) {
    const err = validateRoleList(roles, state.targetPlayers)
    if (err) throw new Error(err)
  }
  return touch({ ...state, customRoles: roles })
}

export function addBots(state: RoomState, actorId: string): RoomState {
  if (actorId !== state.hostId) throw new Error('仅房主可添加 AI')
  if (state.phase !== 'lobby') throw new Error('对局已开始')
  const slots = state.targetPlayers - state.players.length
  if (slots <= 0) throw new Error('房间已满')
  const used = new Set(state.players.map((p) => p.name))
  const names = BOT_NAMES.filter((n) => !used.has(n)).sort(() => Math.random() - 0.5)
  const players = [...state.players]
  for (let i = 0; i < slots; i++) {
    players.push({
      id: uid(),
      name: names[i] || `AI-${i}`,
      seat: players.length,
      connected: true,
      role: null,
      roleAcked: false,
      isAi: true,
    })
  }
  return touch({ ...state, players })
}

export function clearBots(state: RoomState, actorId: string): RoomState {
  if (actorId !== state.hostId) throw new Error('仅房主可移除 AI')
  if (state.phase !== 'lobby') throw new Error('对局已开始')
  const players = state.players
    .filter((p) => !p.isAi)
    .map((p, i) => ({ ...p, seat: i }))
  return touch({ ...state, players })
}

export function startGame(state: RoomState, actorId: string): RoomState {
  if (actorId !== state.hostId) throw new Error('仅房主可开始')
  if (state.players.length !== state.targetPlayers) {
    throw new Error(`需要 ${state.targetPlayers} 人齐才能开始`)
  }
  const roles = roleList(state)
  const err = validateRoleList(roles, state.targetPlayers)
  if (err) throw new Error(err)
  const shuffled = [...roles].sort(() => Math.random() - 0.5)
  const players = ordered(state).map((p, i) => ({
    ...p,
    role: shuffled[i],
    roleAcked: false,
  }))
  return touch({
    ...state,
    players,
    phase: 'role_reveal',
    questIndex: 0,
    questResults: [null, null, null, null, null],
    rejectCount: 0,
    proposedTeam: [],
    teamVotes: {},
    questCards: {},
    winner: null,
    winReason: null,
    assassinTarget: null,
    lastVoteTally: null,
    lastQuestFailCount: null,
    leaderId: players[Math.floor(Math.random() * players.length)].id,
  })
}

export function ackRole(state: RoomState, playerId: string): RoomState {
  if (state.phase !== 'role_reveal') throw new Error('当前不是身份确认阶段')
  const players = state.players.map((p) =>
    p.id === playerId ? { ...p, roleAcked: true } : p,
  )
  const all = players.every((p) => p.roleAcked)
  return touch({
    ...state,
    players,
    phase: all ? 'team_propose' : 'role_reveal',
  })
}

export function proposeTeam(state: RoomState, actorId: string, team: string[]): RoomState {
  if (state.phase !== 'team_propose') throw new Error('当前不能提议队伍')
  if (actorId !== state.leaderId) throw new Error('只有领袖可以提议队伍')
  const size = QUEST_TEAM_SIZES[state.targetPlayers][state.questIndex]
  if (team.length !== size) throw new Error(`本轮需要 ${size} 人`)
  if (new Set(team).size !== team.length) throw new Error('队伍成员重复')
  for (const id of team) {
    if (!state.players.some((p) => p.id === id)) throw new Error('无效队员')
  }
  return touch({
    ...state,
    proposedTeam: team,
    teamVotes: {},
    phase: 'team_vote',
  })
}

export function castTeamVote(state: RoomState, playerId: string, approve: boolean): RoomState {
  if (state.phase !== 'team_vote') throw new Error('当前不是投票阶段')
  const teamVotes = { ...state.teamVotes, [playerId]: approve }
  if (Object.keys(teamVotes).length < state.players.length) {
    return touch({ ...state, teamVotes })
  }
  const approvals = Object.values(teamVotes).filter(Boolean).length
  const rejected = approvals <= state.players.length / 2
  const lastVoteTally = {
    approvals,
    rejects: state.players.length - approvals,
    votes: teamVotes,
    approved: !rejected,
  }
  if (rejected) {
    const rejectCount = state.rejectCount + 1
    if (rejectCount >= MAX_TEAM_REJECTIONS) {
      return touch({
        ...state,
        teamVotes,
        lastVoteTally,
        rejectCount,
        winner: 'evil',
        winReason: '连续五次组队被否决',
        phase: 'ended',
      })
    }
    const next = { ...state, teamVotes, lastVoteTally, rejectCount, proposedTeam: [], leaderId: state.leaderId }
    next.leaderId = nextLeader(next)
    next.phase = 'team_propose'
    next.teamVotes = {}
    return touch(next)
  }
  return touch({
    ...state,
    teamVotes,
    lastVoteTally,
    rejectCount: 0,
    questCards: {},
    phase: 'quest',
  })
}

export function playQuestCard(state: RoomState, playerId: string, success: boolean): RoomState {
  if (state.phase !== 'quest') throw new Error('当前不是出任务阶段')
  if (!state.proposedTeam.includes(playerId)) throw new Error('你不在任务队伍中')
  const player = state.players.find((p) => p.id === playerId)
  if (player?.role && GOOD_ROLES.has(player.role) && !success) {
    throw new Error('好人必须出成功')
  }
  const questCards = { ...state.questCards, [playerId]: success }
  if (Object.keys(questCards).length < state.proposedTeam.length) {
    return touch({ ...state, questCards })
  }
  const failCount = Object.values(questCards).filter((ok) => !ok).length
  const needed = failsNeeded(state.targetPlayers, state.questIndex)
  const failed = failCount >= needed
  const questResults = [...state.questResults]
  questResults[state.questIndex] = !failed
  const successes = questResults.filter((r) => r === true).length
  const failures = questResults.filter((r) => r === false).length
  if (failures >= QUESTS_TO_WIN) {
    return touch({
      ...state,
      questCards,
      questResults,
      lastQuestFailCount: failCount,
      winner: 'evil',
      winReason: '三次任务失败',
      phase: 'ended',
    })
  }
  if (successes >= QUESTS_TO_WIN) {
    return touch({
      ...state,
      questCards,
      questResults,
      lastQuestFailCount: failCount,
      phase: 'assassin',
    })
  }
  const next: RoomState = {
    ...state,
    questCards: {},
    questResults,
    lastQuestFailCount: failCount,
    questIndex: state.questIndex + 1,
    proposedTeam: [],
    teamVotes: {},
    phase: 'team_propose',
    leaderId: state.leaderId,
  }
  next.leaderId = nextLeader(next)
  return touch(next)
}

export function assassinate(state: RoomState, actorId: string, targetId: string): RoomState {
  if (state.phase !== 'assassin') throw new Error('当前不是刺杀阶段')
  const assassin = state.players.find((p) => p.role === ASSASSIN)
  if (!assassin || actorId !== assassin.id) throw new Error('只有刺客可以刺杀')
  const target = state.players.find((p) => p.id === targetId)
  if (!target) throw new Error('无效目标')
  const hit = target.role === MERLIN
  return touch({
    ...state,
    assassinTarget: targetId,
    winner: hit ? 'evil' : 'good',
    winReason: hit ? '刺客成功刺杀梅林' : '正方完成三胜且梅林幸存',
    phase: 'ended',
  })
}

export function rematch(state: RoomState, actorId: string): RoomState {
  if (actorId !== state.hostId) throw new Error('仅房主可再来一局')
  return touch({
    ...state,
    phase: 'lobby',
    leaderId: null,
    questIndex: 0,
    questResults: [null, null, null, null, null],
    rejectCount: 0,
    proposedTeam: [],
    teamVotes: {},
    questCards: {},
    winner: null,
    winReason: null,
    assassinTarget: null,
    lastVoteTally: null,
    lastQuestFailCount: null,
    players: state.players.map((p) => ({ ...p, role: null, roleAcked: false })),
  })
}

export function visionFor(state: RoomState, viewerId: string) {
  const viewer = state.players.find((p) => p.id === viewerId)
  if (!viewer?.role || state.phase === 'lobby') return {}
  const evilVisibleToMerlin = state.players
    .filter((p) => p.role && EVIL_ROLES.has(p.role) && p.role !== MORDRED)
    .map((p) => ({ id: p.id, name: p.name }))
  const evilKnown = state.players
    .filter((p) => p.role && EVIL_ROLES.has(p.role) && p.role !== OBERON)
    .map((p) => ({ id: p.id, name: p.name }))
  if (viewer.role === MERLIN) return { sees_evil: evilVisibleToMerlin }
  if (viewer.role === 'percival') {
    const candidates = state.players
      .filter((p) => p.role === MERLIN || p.role === MORGANA)
      .map((p) => ({ id: p.id, name: p.name }))
    // stable-ish shuffle
    const seed = state.roomId + viewer.id
    candidates.sort((a, b) => ((a.id + seed).length % 3) - ((b.id + seed).length % 3))
    return { sees_merlin_candidates: candidates }
  }
  if (EVIL_ROLES.has(viewer.role) && viewer.role !== OBERON) {
    return { sees_evil_allies: evilKnown.filter((e) => e.id !== viewer.id) }
  }
  return {}
}

export function toPublicPrivate(state: RoomState, meId: string) {
  const me = state.players.find((p) => p.id === meId)
  const sizes = QUEST_TEAM_SIZES[state.targetPlayers]
  const publicView = {
    roomId: state.roomId,
    hostId: state.hostId,
    targetPlayers: state.targetPlayers,
    phase: state.phase,
    rolesPreset: roleList(state),
    usingCustomRoles: state.customRoles != null,
    players: ordered(state).map((p) => ({
      id: p.id,
      name: p.name,
      seat: p.seat,
      connected: p.connected,
      isHost: p.id === state.hostId,
      roleAcked: p.roleAcked,
      isAi: p.isAi,
      role: state.phase === 'ended' ? p.role : null,
    })),
    leaderId: state.leaderId,
    questIndex: state.questIndex,
    questTeamSize: state.questIndex < 5 ? sizes[state.questIndex] : null,
    questSizes: [...sizes],
    questResults: state.questResults,
    failsNeeded: failsNeeded(state.targetPlayers, state.questIndex),
    rejectCount: state.rejectCount,
    maxRejects: MAX_TEAM_REJECTIONS,
    proposedTeam: state.proposedTeam,
    votesSubmitted: Object.keys(state.teamVotes),
    questSubmitted: Object.keys(state.questCards),
    lastVoteTally: state.lastVoteTally,
    lastQuestFailCount: state.lastQuestFailCount,
    winner: state.winner,
    winReason: state.winReason,
    assassinTarget: state.assassinTarget,
    goodEvil: GOOD_EVIL_COUNT[state.targetPlayers],
    roleLabels: ROLE_LABELS_ZH,
  }
  const privateView = {
    playerId: meId,
    role: me?.role ?? null,
    roleLabel: ROLE_LABELS_ZH[me?.role || ''] || '',
    isGood: me?.role ? GOOD_ROLES.has(me.role) : null,
    vision: visionFor(state, meId),
    canAssassinate: state.phase === 'assassin' && me?.role === ASSASSIN,
  }
  return { public: publicView, private: privateView }
}
