---
title: 'Frequently Asked Questions'
slug: 'faq'
---

## Is DSPACE v3 live?

Yes. v3.0.0 is live, including the custom content toolchain, expanded docs/search, and the new
navigation destinations listed in the latest release notes.

## Where should a new player begin?

Start with the [Welcome quest tree](/docs/welcome), then branch into a skill tree such as
[Energy Systems](/docs/energy-systems), [Hydroponics](/docs/hydroponics), or
[Rocketry](/docs/rockets).

## Do I need an account to play?

No account is required for local play. Your progress saves in-browser (IndexedDB primary, with
fallback behavior documented in [State migration](/docs/state-migration)).

## What does Cloud Sync require?

Cloud Sync uses a GitHub token with `gist` scope and a secret gist ID. Configure both in
[/settings](/settings), then sync via [/cloudsync](/cloudsync). See [Cloud Sync docs](/docs/cloud-sync).

## What can I do from the new v3 destination pages?

- [/stats](/stats): Progress counts and gameplay summary.
- [/titles](/titles): Unlockable rank roster and progress.
- [/leaderboard](/leaderboard): Donation board and supporter standings.
- [/toolbox](/toolbox): Utilities hub (save/content/diagnostic tooling).
- [/settings](/settings): Preferences, auth, and migration controls.

## Can I create my own quests/items/processes?

Yes. v3 supports in-game creation and contribution for:

- Quests: [/quests/create](/quests/create)
- Items: [/inventory/create](/inventory/create)
- Processes: [/processes/create](/processes/create)

Start with [Custom Quest System](/docs/custom-quest-system),
[Custom Content Bundles](/docs/custom-bundles), and [Quest Submission Guide](/docs/quest-submission).

## Which AI provider ships in v3 chat?

OpenAI is the production provider in v3. token.place is deferred to v3.1 until the API v1 launch.
See [v3 Release State](/docs/v3-release-state) and [token.place status](/docs/token-place).

## What are dUSD, dWatt, and dCarbon?

- **[dUSD](/docs/dusd)** is the in-game currency.
- **[dWatt](/docs/dwatt)** tracks generated energy.
- **[dCarbon](/docs/dcarbon)** tracks emissions pressure that affects economy/tax behavior.

## How do I report bugs or help improve docs/content?

- Join Discord: [discord.gg/A3UAfYvnxM](https://discord.gg/A3UAfYvnxM)
- Open an issue/PR: [github.com/democratizedspace/dspace](https://github.com/democratizedspace/dspace)
- Follow contribution docs: [Contribute](/docs/contribute), [PRs](/docs/prs)

## Are guilds fully playable in v3?

Not yet as a full multiplayer system. v3 includes guild-adjacent social surfaces and Metaguild
structure docs, but full ActivityPub guild mechanics remain roadmap work. See [Guilds](/docs/guilds)
and [Roadmap](/docs/roadmap).
