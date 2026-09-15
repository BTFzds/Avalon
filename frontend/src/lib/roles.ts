export interface RoleMeta {
  id: string
  label: string
  alignment: 'good' | 'evil'
  blurb: string
  accent: string
}

export const ROLE_META: Record<string, RoleMeta> = {
  merlin: {
    id: 'merlin',
    label: '梅林',
    alignment: 'good',
    blurb: '洞悉大部分邪恶势力，却必须以身涉险。',
    accent: '#6fbf8a',
  },
  percival: {
    id: 'percival',
    label: '派西维尔',
    alignment: 'good',
    blurb: '看见两位「疑似梅林」——真假难辨。',
    accent: '#7ec8e3',
  },
  servant: {
    id: 'servant',
    label: '忠臣',
    alignment: 'good',
    blurb: '忠诚的圆桌骑士，以投票与信任守护王国。',
    accent: '#c9b27c',
  },
  assassin: {
    id: 'assassin',
    label: '刺客',
    alignment: 'evil',
    blurb: '正方三胜后，仍可一击锁定梅林。',
    accent: '#e07070',
  },
  morgana: {
    id: 'morgana',
    label: '莫甘娜',
    alignment: 'evil',
    blurb: '在派西维尔眼中伪装成梅林。',
    accent: '#c77dff',
  },
  mordred: {
    id: 'mordred',
    label: '莫德雷德',
    alignment: 'evil',
    blurb: '隐于阴影，连梅林也无法看穿。',
    accent: '#8b6b4a',
  },
  oberon: {
    id: 'oberon',
    label: '奥伯伦',
    alignment: 'evil',
    blurb: '独行的邪恶——互不相认的孤狼。',
    accent: '#5b7cfa',
  },
  minion: {
    id: 'minion',
    label: '爪牙',
    alignment: 'evil',
    blurb: '莫德雷德的爪牙，暗中破坏任务。',
    accent: '#a85858',
  },
}

export const EMOJIS = ['👍', '🤔', '😅', '🔥', '👀', '🛡️', '🗡️', '✨']
