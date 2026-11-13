# status-bar

A compact two-row status band above the Claude Code prompt.

**Row 1:** project, git branch, session duration, prompt count and API-equivalent cost on the left; model, thinking level and prompt-cache hit rate on the right.

**Row 2:** context usage, 5-hour limit and weekly limit, each with a progress bar, a percentage and a reset countdown. The context bar turns red with a warning at high usage.

At 50% context a **Handoff [H]** button appears. It runs the [handoff skill](https://github.com/mattpocock/skills/tree/main/skills/productivity/handoff) from [mattpocock](https://github.com/mattpocock). If the skill is not installed, pressing the button asks Claude to install it.

The band collapses its right-hand group on narrow terminals.

## Requirements

- A Claude Code version that supports mods (plugins with a `hooks` module). Check with `claude --version` and update if the install below reports an unknown hook or module.
- `git` on your PATH. Claude Code uses it to fetch the marketplace, and the band uses it to show your branch.
- The rate-limit bars appear only on a Claude subscription.

## Install

This plugin lives in the `claude-mods` marketplace.

### Option 1: one line inside Claude Code

```
/plugin install status-bar --marketplace andrzej-zernaczuk/claude-mods
```

### Option 2: from the terminal

Add the marketplace once, then install the plugin for your user, so it loads in every project:

```bash
claude plugin marketplace add andrzej-zernaczuk/claude-mods
```
```bash
claude plugin install status-bar@claude-mods --scope user
```

Use `--scope project` instead to install it for the current project only.

### Try it without installing

Clone the repository and point Claude Code at the plugin folder:

```bash
git clone https://github.com/andrzej-zernaczuk/claude-mods.git
```
```bash
claude --plugin-dir ./claude-mods/plugins/status-bar
```

After installing, start a new Claude Code session. The band appears above the prompt.

## Update and remove

```bash
claude plugin marketplace update claude-mods
```
```bash
claude plugin uninstall status-bar@claude-mods
```

## Handoff button

The button appears once context usage reaches 50%. To have the skill ready beforehand, install it from [mattpocock/skills](https://github.com/mattpocock/skills/tree/main/skills/productivity/handoff) into `~/.claude/skills/handoff`. Otherwise press the button and approve the install when Claude asks.

## Notes

- Cache hit rate is `cache_read / (input + cache_read + cache_creation)` over the main-thread turns since the mod loaded.
- Cost is the session ledger's API-equivalent figure, not what your subscription bills.
- The thinking level shows once the first request of a session has gone out, and only for models that take an effort setting.

MIT licensed.
