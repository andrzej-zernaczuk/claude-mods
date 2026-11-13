export type Band = {
  branch: string
  cacheRead: number
  cacheInput: number
  prompts: number
  model: string
  effort: string
  hasHandoff: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'status-band': { data: Band }
  }
}
