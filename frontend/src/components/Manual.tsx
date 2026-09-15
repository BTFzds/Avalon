import { motion, AnimatePresence } from 'framer-motion'
import { RoleAvatar } from './RoleAvatar'
import { ROLE_META } from '../lib/roles'

const QUEST_TABLE: { n: number; goodEvil: string; sizes: string; note?: string }[] = [
  { n: 5, goodEvil: '3 / 2', sizes: '2 · 3 · 2 · 3 · 3' },
  { n: 6, goodEvil: '4 / 2', sizes: '2 · 3 · 4 · 3 · 4' },
  { n: 7, goodEvil: '4 / 3', sizes: '2 · 3 · 3 · 4 · 4', note: '第4轮需2张失败' },
  { n: 8, goodEvil: '5 / 3', sizes: '3 · 4 · 4 · 5 · 5', note: '第4轮需2张失败' },
  { n: 9, goodEvil: '6 / 3', sizes: '3 · 4 · 4 · 5 · 5', note: '第4轮需2张失败' },
  { n: 10, goodEvil: '6 / 4', sizes: '3 · 4 · 4 · 5 · 5', note: '第4轮需2张失败' },
]

const ROLE_RULES: { id: string; rules: string[] }[] = [
  {
    id: 'merlin',
    rules: [
      '开局得知大部分邪恶玩家（看不到莫德雷德）。',
      '正方三胜后若被刺客指认，则邪恶反败为胜。',
      '需用投票与发言间接引导队友，避免暴露自己。',
    ],
  },
  {
    id: 'percival',
    rules: [
      '开局看到梅林与莫甘娜，但两者外观相同，需自行分辨。',
      '帮助保护真正的梅林，同时防备假梅林搅局。',
    ],
  },
  {
    id: 'servant',
    rules: [
      '无额外夜间信息，依靠公开信息与推理。',
      '任务中必须出「成功」牌。',
    ],
  },
  {
    id: 'assassin',
    rules: [
      '知晓其他邪恶队友（奥伯伦除外）。',
      '正方先拿下三次任务成功后，由刺客指认梅林；猜中则邪恶胜。',
    ],
  },
  {
    id: 'morgana',
    rules: [
      '在派西维尔眼中伪装成梅林。',
      '与其他邪恶互通身份（奥伯伦除外），可出失败破坏任务。',
    ],
  },
  {
    id: 'mordred',
    rules: [
      '梅林无法看见你，是正方最大的信息盲区。',
      '与其他邪恶互通（奥伯伦除外）。',
    ],
  },
  {
    id: 'oberon',
    rules: [
      '邪恶孤狼：看不到队友，队友也看不到你。',
      '仍可为邪恶出失败牌；梅林能看见你。',
    ],
  },
  {
    id: 'minion',
    rules: [
      '基础邪恶爪牙，与队友互认（有奥伯伦时除外规则仍适用）。',
      '可选择出成功或失败。',
    ],
  },
]

export function Manual({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-night-950/80 p-3 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gold-400/30 bg-night-900 p-5 shadow-glow sm:p-7"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.35em] text-gold-300/70">CODEX</p>
                <h2 className="font-display text-2xl text-gold-300">阿瓦隆说明书</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 px-3 py-1 text-sm text-parchment/70 hover:border-gold-400/40"
              >
                关闭
              </button>
            </div>

            <section className="mb-6 space-y-2 text-sm leading-relaxed text-parchment/85">
              <h3 className="font-display text-lg text-gold-300">胜负目标</h3>
              <p>
                <span className="text-moss-400">正义</span>
                ：完成 <strong>3</strong> 次任务成功，且在最终刺杀中保住梅林。
              </p>
              <p>
                <span className="text-blood-400">邪恶</span>
                ：令任务失败累计 <strong>3</strong> 次；或同一轮组队连续被否决{' '}
                <strong>5</strong> 次；或正方三胜后刺客成功指认梅林。
              </p>
            </section>

            <section className="mb-6 space-y-2 text-sm leading-relaxed text-parchment/85">
              <h3 className="font-display text-lg text-gold-300">回合流程</h3>
              <ol className="list-decimal space-y-1 pl-5">
                <li>开局静默下发身份与夜间信息，确认后进入白天。</li>
                <li>领袖提议本轮出任务队伍，全员同时投票（过半赞成通过）。</li>
                <li>否决则领袖轮转；连续 5 次否决邪恶直接获胜。</li>
                <li>通过后队员秘密出牌：好人必须成功，坏人可选成功/失败；牌打乱后只公布失败张数。</li>
                <li>7 人及以上第 4 轮需至少 2 张失败才算任务失败。</li>
              </ol>
            </section>

            <section className="mb-6">
              <h3 className="mb-2 font-display text-lg text-gold-300">人数与任务</h3>
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[420px] text-left text-xs sm:text-sm">
                  <thead className="bg-night-950/80 text-gold-300/80">
                    <tr>
                      <th className="px-3 py-2">人数</th>
                      <th className="px-3 py-2">好 / 坏</th>
                      <th className="px-3 py-2">五轮出任务人数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {QUEST_TABLE.map((row) => (
                      <tr key={row.n} className="border-t border-white/5 text-parchment/80">
                        <td className="px-3 py-2">{row.n}</td>
                        <td className="px-3 py-2">{row.goodEvil}</td>
                        <td className="px-3 py-2">
                          {row.sizes}
                          {row.note ? (
                            <span className="mt-0.5 block text-[11px] text-gold-400/70">{row.note}</span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-display text-lg text-gold-300">角色详解</h3>
              {ROLE_RULES.map((entry) => {
                const meta = ROLE_META[entry.id]
                return (
                  <div
                    key={entry.id}
                    className="flex gap-3 rounded-2xl border border-white/10 bg-night-950/40 p-3"
                  >
                    <RoleAvatar role={entry.id} size={64} glow={false} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <p className="font-display text-gold-300">{meta.label}</p>
                        <span
                          className={`text-[11px] ${
                            meta.alignment === 'good' ? 'text-moss-400' : 'text-blood-400'
                          }`}
                        >
                          {meta.alignment === 'good' ? '正义' : '邪恶'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-parchment/55">{meta.blurb}</p>
                      <ul className="mt-2 space-y-1 text-xs text-parchment/80 sm:text-sm">
                        {entry.rules.map((r) => (
                          <li key={r}>· {r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </section>

            <p className="mt-6 text-center text-[11px] text-parchment/40">
              局内可用表情示意；主要讨论请线下进行。可用 AI 填满空位进行单人测试。
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
