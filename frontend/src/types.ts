export type Phase =
  | 'lobby'
  | 'role_reveal'
  | 'team_propose'
  | 'team_vote'
  | 'quest'
  | 'assassin'
  | 'ended'

export interface PublicPlayer {
  id: string
  name: string
  seat: number
  connected: boolean
  isHost: boolean
  roleAcked: boolean
  isAi?: boolean
  role: string | null
}

export interface PublicState {
  roomId: string
  hostId: string
  targetPlayers: number
  phase: Phase
  rolesPreset: string[]
  usingCustomRoles: boolean
  players: PublicPlayer[]
  leaderId: string | null
  questIndex: number
  questTeamSize: number | null
  questSizes: number[]
  questResults: (boolean | null)[]
  failsNeeded: number
  rejectCount: number
  maxRejects: number
  proposedTeam: string[]
  votesSubmitted: string[]
  questSubmitted: string[]
  lastVoteTally: {
    approvals: number
    rejects: number
    votes: Record<string, boolean>
    approved: boolean
  } | null
  lastQuestFailCount: number | null
  winner: 'good' | 'evil' | null
  winReason: string | null
  assassinTarget: string | null
  goodEvil: [number, number]
  roleLabels: Record<string, string>
}

export interface PrivateState {
  playerId: string
  role: string | null
  roleLabel: string
  isGood: boolean | null
  vision: {
    sees_evil?: { id: string; name: string }[]
    sees_merlin_candidates?: { id: string; name: string }[]
    sees_evil_allies?: { id: string; name: string }[]
  }
  canAssassinate: boolean
}

export interface GameState {
  public: PublicState
  private: PrivateState
}

export interface EmojiEvent {
  playerId: string
  name: string
  emoji: string
}
