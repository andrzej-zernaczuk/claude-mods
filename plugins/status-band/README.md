# status-band

A compact two-row status band above the Claude Code prompt: project, git branch, session duration, prompt count, API-equivalent cost, context usage, 5-hour and weekly limits, model and cache hit rate. At 50% context a Handoff [H] button appears and runs the handoff skill from mattpocock/skills (productivity/handoff); if the skill is not installed, pressing it asks Claude to install it.

## Install

```
/plugin install status-band --marketplace andrzej-zernaczuk/claude-status-bar
```
