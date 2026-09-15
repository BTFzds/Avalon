import { useCallback, useEffect, useRef, useState } from 'react'
import { stepBots } from '../game/ai'
import {
  ackRole,
  addBots,
  addPlayer,
  assassinate,
  castTeamVote,
  clearBots,
  createLobby,
  playQuestCard,
  proposeTeam,
  rematch,
  setCustomRoles,
  setTargetPlayers,
  startGame,
  toPublicPrivate,
  type RoomState,
} from '../game/engine'
import { isFirebaseConfigured } from '../lib/firebase'
import type { EmojiEvent, GameState } from '../types'
import {
  createRemoteRoom,
  destroyRemoteRoom,
  fetchRemoteState,
  inviteUrl,
  parseInviteHash,
  publishState,
  pushAction,
  pushEmoji,
  requestJoin,
  subscribeActions,
  subscribeEmojis,
  subscribeJoins,
  subscribeState,
  type AvalonAction,
} from '../sync/roomSync'

const PLAYER_KEY = 'avalon-player-id'
const NAME_KEY = 'avalon-name'

function getOrCreatePlayerId(): string {
  let id = localStorage.getItem(PLAYER_KEY)
  if (!id) {
    id = Math.random().toString(16).slice(2) + Date.now().toString(16)
    localStorage.setItem(PLAYER_KEY, id)
  }
  return id
}

function applyAction(state: RoomState, playerId: string, action: AvalonAction): RoomState {
  switch (action.type) {
    case 'ack_role':
      return ackRole(state, playerId)
    case 'propose_team':
      return proposeTeam(state, playerId, action.team)
    case 'team_vote':
      return castTeamVote(state, playerId, action.approve)
    case 'quest_card':
      return playQuestCard(state, playerId, action.success)
    case 'assassinate':
      return assassinate(state, playerId, action.targetId)
    case 'configure':
      if (action.clearCustom) return setCustomRoles(state, null, playerId)
      if (action.customRoles) return setCustomRoles(state, action.customRoles, playerId)
      if (action.targetPlayers != null) return setTargetPlayers(state, action.targetPlayers, playerId)
      return state
    case 'fill_bots':
      return addBots(state, playerId)
    case 'clear_bots':
      return clearBots(state, playerId)
    case 'start':
      return startGame(state, playerId)
    case 'rematch':
      return rematch(state, playerId)
    default:
      return state
  }
}

export function useAvalonOnline() {
  const playerId = useRef(getOrCreatePlayerId()).current
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '')
  const [roomIdInput, setRoomIdInput] = useState('')
  const [targetPlayers, setTargetPlayersUi] = useState(7)
  const [room, setRoom] = useState<RoomState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [emojis, setEmojis] = useState<EmojiEvent[]>([])
  const [draftTeam, setDraftTeam] = useState<string[]>([])
  const [connected, setConnected] = useState(false)
  const roomRef = useRef<RoomState | null>(null)
  const isHostRef = useRef(false)

  useEffect(() => {
    localStorage.setItem(NAME_KEY, name)
  }, [name])

  useEffect(() => {
    roomRef.current = room
    isHostRef.current = !!room && room.hostId === playerId
  }, [room, playerId])

  useEffect(() => {
    setConnected(isFirebaseConfigured())
    if (!isFirebaseConfigured()) {
      setError('请先配置 Firebase（见 docs/FIREBASE_SETUP.md）')
    }
  }, [])

  const publish = useCallback(async (next: RoomState) => {
    roomRef.current = next
    setRoom(next)
    if (next.hostId === playerId) {
      await publishState(next.roomId, next)
    }
  }, [playerId])

  // Host: drain bots
  useEffect(() => {
    if (!room || room.hostId !== playerId) return
    if (room.phase === 'lobby' || room.phase === 'ended') return
    let cancelled = false
    const tick = async () => {
      let cur = roomRef.current
      if (!cur || cur.hostId !== playerId || cancelled) return
      const next = stepBots(cur)
      if (next && !cancelled) {
        await publish(next)
        window.setTimeout(() => {
          void tick()
        }, 450)
      }
    }
    const t = window.setTimeout(() => {
      void tick()
    }, 400)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [room, playerId, publish])

  // Subscribe when in room
  useEffect(() => {
    if (!room) return
    const unsubState = subscribeState(room.roomId, (remote) => {
      roomRef.current = remote
      setRoom(remote)
      if (remote.phase === 'team_propose') setDraftTeam([])
    })

    let unsubJoins: (() => void) | undefined
    let unsubActions: (() => void) | undefined

    const unsubEmojis = subscribeEmojis(room.roomId, (item) => {
      setEmojis((prev) => [...prev.slice(-4), item])
      window.setTimeout(() => setEmojis((prev) => prev.slice(1)), 2200)
    })

    if (room.hostId === playerId) {
      unsubJoins = subscribeJoins(room.roomId, (join) => {
        try {
          const cur = roomRef.current
          if (!cur) return
          if (cur.players.some((p) => p.id === join.playerId)) return
          const next = addPlayer(cur, join.name, join.playerId)
          void publish(next)
        } catch (e) {
          setError(e instanceof Error ? e.message : '加入失败')
        }
      })
      unsubActions = subscribeActions(room.roomId, ({ playerId: pid, action }) => {
        try {
          const cur = roomRef.current
          if (!cur) return
          const next = applyAction(cur, pid, action)
          void publish(next)
        } catch (e) {
          setError(e instanceof Error ? e.message : '操作失败')
        }
      })
    }

    return () => {
      unsubState()
      unsubEmojis()
      unsubJoins?.()
      unsubActions?.()
    }
  }, [room?.roomId, room?.hostId, playerId, publish])

  const send = useCallback(
    async (action: AvalonAction) => {
      const cur = roomRef.current
      if (!cur) return
      try {
        setError(null)
        if (action.type === 'emoji') {
          await pushEmoji(cur.roomId, {
            playerId,
            name: cur.players.find((p) => p.id === playerId)?.name || name,
            emoji: action.emoji,
          })
          return
        }
        if (cur.hostId === playerId) {
          const next = applyAction(cur, playerId, action)
          await publish(next)
        } else {
          await pushAction(cur.roomId, playerId, action)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '操作失败')
      }
    },
    [playerId, name, publish],
  )

  const createRoom = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      setError('Firebase 未配置')
      return
    }
    try {
      const lobby = createLobby(name || '房主', targetPlayers, playerId)
      await createRemoteRoom(lobby)
      await publishState(lobby.roomId, lobby)
      setRoom(lobby)
      roomRef.current = lobby
      window.location.hash = `#/r/${lobby.roomId}`
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
    }
  }, [name, targetPlayers, playerId])

  const joinRoom = useCallback(
    async (code?: string) => {
      if (!isFirebaseConfigured()) {
        setError('Firebase 未配置')
        return
      }
      const roomId = (code || roomIdInput).trim().toUpperCase()
      if (!roomId) return
      try {
        const existing = await fetchRemoteState(roomId)
        if (!existing) {
          setError('房间不存在或已失效')
          return
        }
        if (existing.players.some((p) => p.id === playerId)) {
          setRoom(existing)
          roomRef.current = existing
          window.location.hash = `#/r/${roomId}`
          setError(null)
          return
        }
        await requestJoin(roomId, playerId, name.trim() || '玩家')
        setRoom(existing)
        roomRef.current = existing
        window.location.hash = `#/r/${roomId}`
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : '加入失败')
      }
    },
    [roomIdInput, playerId, name],
  )

  // Auto-join from invite hash
  useEffect(() => {
    const invite = parseInviteHash()
    if (invite && !room && isFirebaseConfigured()) {
      setRoomIdInput(invite)
      void joinRoom(invite)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const copyInvite = useCallback(async () => {
    if (!room) return
    const url = inviteUrl(room.roomId)
    await navigator.clipboard.writeText(url)
  }, [room])

  const leaveRoom = useCallback(async () => {
    const cur = roomRef.current
    if (cur && cur.hostId === playerId && cur.phase === 'lobby') {
      await destroyRemoteRoom(cur.roomId)
    }
    setRoom(null)
    roomRef.current = null
    window.location.hash = ''
  }, [playerId])

  const game: GameState | null = room ? toPublicPrivate(room, playerId) : null

  return {
    connected,
    error,
    name,
    setName,
    roomIdInput,
    setRoomIdInput,
    targetPlayers,
    setTargetPlayers: setTargetPlayersUi,
    game,
    emojis,
    draftTeam,
    setDraftTeam,
    createRoom,
    joinRoom,
    send,
    copyInvite,
    leaveRoom,
    inviteLink: room ? inviteUrl(room.roomId) : null,
    firebaseReady: isFirebaseConfigured(),
  }
}
