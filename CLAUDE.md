# Claude repository instructions

Read [AGENTS.md](AGENTS.md) for repository guidance and follow the canonical
[agent commit identity contract](CONTRIBUTING.md#agent-commit-identity-contract)
before creating any commit. Use the verified identity only for authorized new
commits on Daniel's behalf, verify both author and committer, and stop on an
unexpected identity. Never invent an email, change global Git configuration, or
relabel third-party authors or coauthors. Authentication is separate from commit
metadata.

When running under a restricted workflow or signing service, preserve its tool
restrictions. If its commit mechanism cannot meet the identity contract, report
the limitation and stop before creating a commit.
