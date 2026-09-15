import {
  get,
  onChildAdded,
  onValue,
  push,
  ref,
  remove,
  set,
} from '@firebase/database'
import type { RoomState } from '../game/engine'
import { getDb } from '../lib/firebase'

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export type AvalonAction =
  | { type: 'ack_role' }
  | { type: 'propose_team'; team: string[] }
  | { type: 'team_vote'; approve: boolean }
  | { type: 'quest_card'; success: boolean }
  | { type: 'assassinate'; targetId: string }
  | { type: 'emoji'; emoji: string }
  | { type: 'configure'; targetPlayers?: number; customRoles?: string[] | null; clearCustom?: boolean }
  | { type: 'fill_bots' }
  | { type: 'clear_bots' }
  | { type: 'start' }
  | { type: 'rematch' }

export async function createRemoteRoom(state: RoomState): Promise<void> {
  await set(ref(getDb(), `rooms/${state.roomId}`), clean({ state, createdAt: Date.now() }))
}

export async function fetchRemoteState(roomId: string): Promise<RoomState | null> {
  const snap = await get(ref(getDb(), `rooms/${roomId.toUpperCase()}/state`))
  return snap.exists() ? (snap.val() as RoomState) : null
}

export function subscribeState(roomId: string, cb: (state: RoomState) => void): () => void {
  const r = ref(getDb(), `rooms/${roomId.toUpperCase()}/state`)
  return onValue(r, (snap) => {
    if (snap.exists()) cb(snap.val() as RoomState)
  })
}

export async function publishState(roomId: string, state: RoomState): Promise<void> {
  await set(ref(getDb(), `rooms/${roomId.toUpperCase()}/state`), clean(state))
}

export async function requestJoin(roomId: string, playerId: string, name: string): Promise<void> {
  await set(ref(getDb(), `rooms/${roomId.toUpperCase()}/joins/${playerId}`), {
    playerId,
    name,
    ts: Date.now(),
  })
}

export function subscribeJoins(
  roomId: string,
  cb: (join: { playerId: string; name: string }) => void,
): () => void {
  const r = ref(getDb(), `rooms/${roomId.toUpperCase()}/joins`)
  return onChildAdded(r, (snap) => {
    const val = snap.val() as { playerId: string; name: string }
    cb(val)
    void remove(snap.ref)
  })
}

export async function pushAction(
  roomId: string,
  playerId: string,
  action: AvalonAction,
): Promise<void> {
  await push(ref(getDb(), `rooms/${roomId.toUpperCase()}/actions`), {
    playerId,
    action,
    ts: Date.now(),
  })
}

export function subscribeActions(
  roomId: string,
  cb: (item: { id: string; playerId: string; action: AvalonAction }) => void,
): () => void {
  const r = ref(getDb(), `rooms/${roomId.toUpperCase()}/actions`)
  return onChildAdded(r, (snap) => {
    const val = snap.val() as { playerId: string; action: AvalonAction }
    cb({ id: snap.key!, ...val })
    void remove(snap.ref)
  })
}

export async function pushEmoji(
  roomId: string,
  payload: { playerId: string; name: string; emoji: string },
): Promise<void> {
  await push(ref(getDb(), `rooms/${roomId.toUpperCase()}/emojis`), {
    ...payload,
    ts: Date.now(),
  })
}

export function subscribeEmojis(
  roomId: string,
  cb: (item: { playerId: string; name: string; emoji: string }) => void,
): () => void {
  const r = ref(getDb(), `rooms/${roomId.toUpperCase()}/emojis`)
  return onChildAdded(r, (snap) => {
    const val = snap.val() as { playerId: string; name: string; emoji: string }
    cb(val)
    // Keep feed short — guests and host all see bursts; prune after brief delay
    window.setTimeout(() => {
      void remove(snap.ref)
    }, 3000)
  })
}

export async function destroyRemoteRoom(roomId: string): Promise<void> {
  await remove(ref(getDb(), `rooms/${roomId.toUpperCase()}`))
}

export function inviteUrl(roomId: string): string {
  return `${window.location.origin}${window.location.pathname}#/r/${roomId.toUpperCase()}`
}

export function parseInviteHash(): string | null {
  const m = window.location.hash.match(/^#\/r\/([A-Za-z0-9]{4,8})/i)
  return m ? m[1].toUpperCase() : null
}
