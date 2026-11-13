# claude-mods

A personal collection of [Claude Code](https://claude.com/claude-code) plugins and mods, published as one plugin marketplace. Each plugin lives in its own folder under `plugins/` with its own README, license and version, so you can install just the ones you want.

## Add the marketplace

```bash
claude plugin marketplace add andrzej-zernaczuk/claude-mods
```

Then install any plugin from the list below:

```bash
claude plugin install <plugin>@claude-mods --scope user
```

Or in one line from inside Claude Code: `/plugin install <plugin> --marketplace andrzej-zernaczuk/claude-mods`.

## Plugins

| Plugin | What it does |
| --- | --- |
| [status-bar](plugins/status-bar) | A two-row status band above the prompt: project, branch, cost, context, 5h and weekly limits, model, cache hit rate and a handoff button. |

Each plugin carries its own license; see its folder.
