export type Band = {
  branch: string
  cacheRead: number
  cacheInput: number
  prompts: number
  model: string
  effort: string
  lastCacheAt: number
  tick: number
  hasHandoff: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'status-bar': { data: Band }
  }
}
