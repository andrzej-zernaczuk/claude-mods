# claude-status-bar

A compact two-row status band above the Claude Code prompt.

**Row 1:** project, git branch, session duration, prompt count and API-equivalent cost on the left; model, thinking level and prompt-cache hit rate on the right.

**Row 2:** context usage, 5-hour limit and weekly limit, each with a progress bar, a percentage and a reset countdown. The context bar turns red with a warning at high usage.

At 50% context a **Handoff [H]** button appears. It runs the [handoff skill](https://github.com/mattpocock/skills/tree/main/skills/productivity/handoff) from [mattpocock](https://github.com/mattpocock). If the skill is not installed, pressing the button asks Claude to install it.

The band collapses its right-hand group on narrow terminals.

## Install

The repository is `claude-status-bar`; the plugin in it is named `status-bar`.

```
/plugin install status-bar --marketplace andrzej-zernaczuk/claude-status-bar
```

## Notes

- Cache hit rate is `cache_read / (input + cache_read + cache_creation)` over the main-thread turns since the mod loaded.
- Cost is the session ledger's API-equivalent figure, not what your subscription bills.
- Rate-limit bars appear only on a subscription.

MIT licensed.
