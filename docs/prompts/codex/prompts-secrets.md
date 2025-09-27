# Secret scanning prompts for the _dspace_ repo

Use this template to prevent leaking credentials or other sensitive data. Combine it with
other prompt guides to keep the repository secure.

The default scanner command is `git diff --cached | ./scripts/scan-secrets.py`. If the
repo adopts tools such as `ripsecrets`, `detect-secrets`, or `git-secrets`, update the
example accordingly so contributors run the current scanner.

> **TL;DR**
>
> 1. Run `git diff --cached | ./scripts/scan-secrets.py` before every commit.
> 2. Investigate any findings. Remove secrets and rotate credentials if exposed, or
>    document false positives.
> 3. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 4. Commit with an emoji prefix.

### Handling findings

- False positives: add an allowlist entry or document the reasoning in the commit message.
- Real secrets: remove them from history and rotate the credential immediately.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`.
2. Investigate any findings and remove credentials.
3. Run the checks above.
4. Use an emoji-prefixed commit message.

OUTPUT:
A pull request with no exposed secrets and all checks passing.
```

## Upgrader Prompt

Type: evergreen

Use this prompt to keep secret-scanning guidance current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Keep scanner command examples current and mention alternative tools if adopted.
2. Clarify handling of false positives or credential rotation.
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the secret scanning prompt doc with passing checks.
```
