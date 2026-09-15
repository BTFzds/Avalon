export const GOOD_EVIL_COUNT: Record<number, [number, number]> = {
  5: [3, 2],
  6: [4, 2],
  7: [4, 3],
  8: [5, 3],
  9: [6, 3],
  10: [6, 4],
}

export const QUEST_TEAM_SIZES: Record<number, [number, number, number, number, number]> = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
}

export const MAX_TEAM_REJECTIONS = 5
export const QUESTS_TO_WIN = 3

export const MERLIN = 'merlin'
export const PERCIVAL = 'percival'
export const SERVANT = 'servant'
export const ASSASSIN = 'assassin'
export const MORGANA = 'morgana'
export const MORDRED = 'mordred'
export const OBERON = 'oberon'
export const MINION = 'minion'

export const GOOD_ROLES = new Set([MERLIN, PERCIVAL, SERVANT])
export const EVIL_ROLES = new Set([ASSASSIN, MORGANA, MORDRED, OBERON, MINION])

export const ROLE_LABELS_ZH: Record<string, string> = {
  merlin: '梅林',
  percival: '派西维尔',
  servant: '忠臣',
  assassin: '刺客',
  morgana: '莫甘娜',
  mordred: '莫德雷德',
  oberon: '奥伯伦',
  minion: '爪牙',
}

export const DEFAULT_ROLES: Record<number, string[]> = {
  5: [MERLIN, PERCIVAL, SERVANT, MORGANA, ASSASSIN],
  6: [MERLIN, PERCIVAL, SERVANT, SERVANT, MORGANA, ASSASSIN],
  7: [MERLIN, PERCIVAL, SERVANT, SERVANT, MORGANA, ASSASSIN, OBERON],
  8: [MERLIN, PERCIVAL, SERVANT, SERVANT, SERVANT, MORGANA, ASSASSIN, MORDRED],
  9: [MERLIN, PERCIVAL, SERVANT, SERVANT, SERVANT, SERVANT, MORGANA, ASSASSIN, MORDRED],
  10: [MERLIN, PERCIVAL, SERVANT, SERVANT, SERVANT, SERVANT, MORGANA, ASSASSIN, MORDRED, OBERON],
}

export function failsNeeded(playerCount: number, questIndex: number): number {
  return playerCount >= 7 && questIndex === 3 ? 2 : 1
}

export function validateRoleList(roles: string[], playerCount: number): string | null {
  const [good, evil] = GOOD_EVIL_COUNT[playerCount] ?? [0, 0]
  if (roles.length !== playerCount) return `需要恰好 ${playerCount} 个角色`
  const goodN = roles.filter((r) => GOOD_ROLES.has(r)).length
  const evilN = roles.filter((r) => EVIL_ROLES.has(r)).length
  if (goodN !== good || evilN !== evil) return `好/坏人数应为 ${good}/${evil}`
  if (!roles.includes(MERLIN)) return '必须包含梅林'
  if (!roles.includes(ASSASSIN)) return '必须包含刺客'
  return null
}

export const BOT_NAMES = [
  '亚瑟机甲',
  '圆桌芯核',
  '暗影算法',
  '湖中字节',
  '圣杯脚本',
  '骑士进程',
  '莫德雷德β',
  '梅林镜像',
  '派西探针',
  '刺客线程',
]
