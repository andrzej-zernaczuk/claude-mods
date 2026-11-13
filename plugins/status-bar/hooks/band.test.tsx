import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'status-bar',
  component: 'AbovePrompt',
  surface: 'terminal',
  props: { hasSurvey: false, isCollapsed: false, isWorking: false, bodyColumns: 120, maxRows: 10, scroll: { offset: 0, bodyRows: 10 } },
} as const

test('the band draws context and the handoff button past 50%', async ($, on) => {
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { tokens: 600000, window: 1000000, percent: 60 },
      rateLimits: [{ kind: 'five_hour', percentUsed: 4 }],
      cost: { usd: 0.91 },
    },
  }))
  on('session.cwd', () => ({ value: '/tmp/proj' }))
  on('clock.now', () => ({ value: 120000 }))

  const ui = await $.ui.mount(BAND as any)
  expect(await ui.find({ type: 'Button', label: 'Handoff [H]' })).toBeTruthy()
  await ui.unmount()
})
