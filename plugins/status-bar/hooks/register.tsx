import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Band } from '../types'

const initial: Band = {
  branch: '',
  cacheRead: 0,
  cacheInput: 0,
  prompts: 0,
  model: '',
  effort: '',
  lastCacheAt: 0,
  tick: 0,
  hasHandoff: false,
}
const data = atom({ plugin: 'status-bar', key: 'data' } as const, initial)

const bar = (pct: number, width: number) => {
  const raw = Math.round((pct / 100) * width)
  const n = Math.max(pct > 0 ? 1 : 0, Math.min(width, raw))
  return { on: '█'.repeat(n), off: '─'.repeat(width - n) }
}

// Prompt-cache lifetime after its last use. The API does not report it; 1h is the
// extended window, set to 5 * 60_000 if your sessions use the 5-minute cache.
const CACHE_TTL_MS = 60 * 60_000

const tone = (p: number) => (p >= 80 ? 'red' : p >= 60 ? 'yellow' : 'green')

const dur = (ms: number) => {
  const m = Math.max(0, Math.floor(ms / 60000))
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m}m`
}

const k = (n: number) =>
  n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : `${n}`

const shortModel = (m: string) =>
  m.replace(/^claude-/, '').replace(/\[.*\]$/, '').replace(/-\d{8}$/, '')

async function refresh($: any) {
  const cwd = await $.session.cwd()
  const git = await $.process.run(['git', 'branch', '--show-current'], { cwd })
  const home = (await $.env.get('HOME')) ?? ''
  const has =
    (await $.fs.exists(`${home}/.claude/skills/handoff/SKILL.md`)) ||
    (await $.fs.exists(`${cwd}/.claude/skills/handoff/SKILL.md`))
  const model = await $.session.model()
  const prompts = await $.session.turns()
  await update($, data, (d: Band) => ({
    ...d,
    branch: git.exitCode === 0 ? git.stdout.trim() : '',
    hasHandoff: has,
    model,
    prompts,
  }))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await refresh($)
    $.clock.every(60_000, () => {
      void update($, data, (d: Band) => ({ ...d, tick: d.tick + 1 }))
    })
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    if (!e.command) await update($, data, (d: Band) => ({ ...d, prompts: d.prompts + 1 }))
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    if (!e.agentId && typeof e.effort === 'string') {
      const effort = e.effort
      await update($, data, (d: Band) => (d.effort === effort ? d : { ...d, effort }))
    }
    return yield* next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (!e.agentId) {
      await refresh($)
      const u = e.usage
      if (u) {
        const now = await $.clock.now()
        await update($, data, (d: Band) => ({
          ...d,
          lastCacheAt:
            u.cache_read_input_tokens + u.cache_creation_input_tokens > 0 ? now : d.lastCacheAt,
          cacheRead: d.cacheRead + u.cache_read_input_tokens,
          cacheInput:
            d.cacheInput +
            u.input_tokens +
            u.cache_read_input_tokens +
            u.cache_creation_input_tokens,
        }))
      }
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const d = await read($, data)
    const u = await $.session.usage()
    const now = await $.clock.now()
    const cwd = await $.session.cwd()
    const { Box, Text, Button } = $.ui.resolve(e)
    const narrow = e.props.bodyColumns < 80

    const project = cwd ? cwd.split('/').filter(Boolean).pop() ?? '' : ''
    const cost = u.cost ? `$${u.cost.usd.toFixed(2)}` : ''
    const pct = u.context.percent ?? 0
    const ctxHigh = pct >= 80
    const cacheLeft = d.lastCacheAt === 0 ? 0 : CACHE_TTL_MS - (now - d.lastCacheAt)
    const lim = (kind: string) => u.rateLimits.find(r => r.kind === kind)
    const hit = d.cacheInput > 0 ? Math.round((d.cacheRead / d.cacheInput) * 100) : null

    const cols = e.props.bodyColumns
    const width = cols >= 110 ? 10 : cols >= 80 ? 6 : cols >= 50 ? 4 : 0

    const meter = (label: string, p: number, color: string, tail: string) => {
      const b = bar(p, width)
      return (
        <Text>
          <Text dimColor>{label}  </Text>
          {width > 0 ? <Text color={color}>{b.on}</Text> : null}
          {width > 0 ? <Text dimColor>{b.off}</Text> : null}
          <Text bold color={color === 'red' ? 'red' : undefined}> {Math.round(p)}%</Text>
          {tail ? <Text dimColor>  {tail}</Text> : null}
        </Text>
      )
    }

    const five = lim('five_hour')
    const week = lim('seven_day')
    const reset = (r?: { resetsAt?: string }) =>
      r?.resetsAt ? `↻${dur(Date.parse(r.resetsAt) - now)}` : ''

    return (
      <Box flexDirection="column" gap={e.props.maxRows >= 8 ? 1 : 0}>
        <Box flexDirection="row" justifyContent="space-between">
          <Box flexDirection="row" flexWrap="wrap" gap={1}>
            {project ? <Text bold>{project}</Text> : null}
            {d.branch ? <Text color="green">⎇ {d.branch}</Text> : null}
            <Text dimColor>
              · {dur(now - u.startedAt)} · {d.prompts} prompts{cost ? ` · ${cost}` : ''}
            </Text>
          </Box>
          {pct >= 50 ? (
            <Button
              key="handoff"
              hotkey="h"
              label="Handoff [H]"
              onPress={async () => {
                const cur = await read($, data)
                if (cur.hasHandoff) {
                  await $.prompt.submit({ text: '/handoff' })
                } else {
                  $.ui.toast('handoff skill missing: asking Claude to install it')
                  await $.prompt.submit({
                    text: 'Install the "handoff" skill from https://github.com/mattpocock/skills/tree/main/skills/productivity/handoff into ~/.claude/skills/handoff, then run /handoff.',
                  })
                }
              }}
            />
          ) : null}
          {narrow ? null : (
            <Box flexDirection="row" gap={1} flexShrink={0}>
              <Text dimColor>
                {shortModel(d.model)}
                {d.effort ? ` · ${d.effort}` : ''}
                {hit !== null ? ` · hit ${hit}%` : ' · level & hit: after 1st prompt'}
              </Text>
              {d.lastCacheAt === 0 ? null : cacheLeft > 0 ? (
                <Text color={cacheLeft < 5 * 60_000 ? 'yellow' : undefined} dimColor={cacheLeft >= 5 * 60_000}>
                  ⏱ {cacheLeft < 60_000 ? '<1m' : dur(cacheLeft)}
                </Text>
              ) : (
                <Text color="yellow">⏱ cold</Text>
              )}
              {hit === null ? null : (
                <Text color={hit >= 50 ? 'green' : 'yellow'}>
                  {'▰'.repeat(Math.max(1, Math.round(hit / 25)))}
                </Text>
              )}
            </Box>
          )}
        </Box>
        <Box flexDirection={narrow ? 'column' : 'row'}>
          <Box width={narrow ? '100%' : '34%'} justifyContent="flex-start">
            {meter('ctx', pct, tone(pct), `${k(u.context.tokens ?? 0)}/${k(u.context.window)}${ctxHigh ? ' ⚠' : ''}`)}
          </Box>
          <Box width={narrow ? '100%' : '33%'} justifyContent={narrow ? 'flex-start' : 'center'}>
            {five ? meter('5h', five.percentUsed, tone(five.percentUsed), reset(five)) : null}
          </Box>
          <Box width={narrow ? '100%' : '33%'} justifyContent={narrow ? 'flex-start' : 'flex-end'}>
            {week ? meter('week', week.percentUsed, tone(week.percentUsed), reset(week)) : null}
          </Box>
        </Box>
      </Box>
    )
  })
}
