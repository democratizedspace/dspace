# DSPACE Cloud Save: Vision & Roadmap (v3+)

**Status:** Draft roadmap / design vision (non-binding)  
**Audience:** DSPACE maintainers & contributors  
**Why this exists:** Capture a long-term “north star” for cloud saves so short-term MVP choices (like GitHub Gists) don’t accidentally become permanent architecture.

---

## Problem statement

DSPACE is offline-first and personal by default, which is great… right up until someone:
- switches devices,
- clears browser storage,
- loses a laptop,
- wants a “restore point” before trying a risky build path.

The v3 Cloud Sync MVP using GitHub Gists is a pragmatic wedge:
- no custom backend required,
- easy to debug,
- user-controlled storage.

But it has sharp edges:
- many users don’t have GitHub accounts,
- Personal Access Tokens (PATs) are intimidating,
- PATs are “copy once,” which makes “use the same token on every device” unrealistic,
- security pitfalls are easy (never upload tokens or secrets).

This doc lays out a path from **MVP backup transport** → **real cloud save** that is:
- user-friendly,
- secure and private by design,
- compatible with self-hosting (Sugarkube),
- modular (so storage providers are swappable).

---

## Design principles

### 1) Offline-first, cloud-second
DSPACE must remain fully usable without cloud sync. Cloud save should feel like *“nice backup power,”* not a requirement.

### 2) Portability over lock-in
Backups should remain portable:
- human exportable,
- importable without accounts,
- stable schema with clear versioning.

### 3) Least trust possible
Assume any server or storage provider is curious, compromised, or both. Design for:
- end-to-end encryption (E2EE) where feasible,
- minimal metadata leakage,
- zero secrets in backups.

### 4) Provider abstraction
The app should talk to a “backup provider” interface, not to GitHub (or any backend) directly. GitHub Gist is just one provider.

### 5) Fail loudly, recover gracefully
Sync flows should be visibly stateful:
- clear success/failure messages,
- no silent token failures,
- recoverable error modes (especially during restore).

---

## Current state (v3 MVP, today)

Cloud Sync page supports a GitHub Gist flow:
- user creates a PAT with `gist` read/write
- app stores token in browser storage
- Upload: posts save blob to a private gist
- Restore: pulls gist content and imports

**Immediate hard requirements for MVP safety:**
- backups must never include tokens or secrets (sanitization now strips tokens, passwords, API
  keys, authorization headers, and similar credential fields before upload)
- token save must validate and provide visible feedback
- “Upload” creates new backups (not overwrite) or makes overwrite explicit
- multi-device should allow one PAT per device while discovering backups by listing gists

This doc assumes those MVP fixes are addressed as baseline.

---

## North star: “Real Cloud Save”

### What “real” means here
A normal person can:
- click “Back up” and see backup history,
- restore from a list,
- switch devices without reading GitHub documentation,
- trust that the server cannot read their save data (E2EE),
- optionally self-host.

### What it is not
- a social platform,
- a marketplace,
- a data-mining pipeline,
- a required account gate for the core game.

---

## Roadmap overview

### Phase 0 — Backup UX foundations (v3.x)
Goal: Make backups reliable even without any cloud account.

- Default UX emphasizes:
  - “Download backup file”
  - “Restore from file”
- Cloud sync becomes an “advanced” option initially.
- Save blob schema is versioned and sanitized.

Deliverables:
- Stable backup envelope (metadata + payload)
- Import/export flows
- Validation & migration pipeline for older backups

### Phase 1 — Harden GitHub Gist provider (v3.x)
Goal: Make the advanced option robust and multi-device realistic.

- One PAT per device (recommended)
- Backup discovery via listing gists (no manual gist IDs needed)
- Create new gist per backup; show history list
- Make restore selectable from history list
- Aggressive sanitization and tests ensuring secrets never upload

Deliverables:
- Provider interface + GitHub provider implementation
- E2E tests mocking GitHub APIs
- UI state machine (loading/success/failure)

### Phase 2 — First-party DSPACE Cloud provider with E2EE (v4 or later)
Goal: Remove GitHub barrier while improving privacy.

- DSPACE Cloud service stores encrypted blobs only
- Client encrypts/decrypts; server cannot read saves
- Authentication:
  - start simple (email magic link or passkeys),
  - evolve over time (device linking, sessions)

Deliverables:
- Minimal backup API
- Auth
- Storage (Postgres and/or S3-compatible)
- Deployment story (Sugarkube-friendly)

### Phase 3 — Pluggable providers (later)
Goal: Add choices without rewriting the app.

Potential providers:
- WebDAV
- S3-compatible endpoints (MinIO, R2, etc.)
- Google Drive / Dropbox (optional, often high UX payoff)
- “Local folder sync” via File System Access API (where available)

Deliverables:
- Provider registry UI
- Shared backup browser UI
- Provider-specific auth UX

---

## Architecture

### Backup envelope format

The internal game save format evolves. The backup envelope adds consistent metadata:

```json
{
  "schemaVersion": 1,
  "createdAt": "2025-12-23T01:23:45.678Z",
  "appVersion": "3.2.0",
  "deviceLabel": "daniel-laptop-chrome",
  "providerHint": "github-gist",
  "payload": {
    "...": "game state only (no tokens, no secrets)"
  }
}
```

Status: The shipped game save export/import flow now emits and accepts this envelope, so backups
carry timestamps and provider hints alongside a sanitized payload.

Notes:
- `payload` must be sanitized game state only.
- `deviceLabel` is optional but hugely helpful for humans.
- `providerHint` is informational (not used for trust decisions).

### Sanitization contract

Before any provider sees data, it must pass a sanitizer.

**Rule:** “No secrets may exit the browser as part of a backup, ever.”

Examples of fields to strip:
- auth tokens (GitHub PATs, session tokens)
- user identifiers that are unrelated to game state
- anything resembling credentials or keys

Implementation notes:
- sanitize as a pure function
- ensure deep cloning where appropriate to avoid mutation bugs
- unit tests must fail if a known secret path is present

```ts
export type SaveBlob = Record<string, unknown>;

export function sanitizeSaveForBackup(save: SaveBlob): SaveBlob {
  const copy = structuredClone(save);

  // Example: remove cloud provider secrets
  // (paths depend on actual save structure)
  if (copy.github && typeof copy.github === "object") {
    delete (copy.github as any).token;
  }

  return copy;
}
```

### Provider interface

The app uses a provider interface; providers implement these behaviors.

```ts
export type BackupMeta = {
  id: string;
  createdAt: string;        // ISO timestamp
  label?: string;           // optional human label
  sizeBytes?: number;
  permalink?: string;       // UI link if available
};

export interface CloudBackupProvider {
  readonly id: string;      // e.g. "github-gist", "dspace-cloud"
  readonly displayName: string;

  getStatus(): Promise<{
    authenticated: boolean;
    userHint?: string;
  }>;

  listBackups(opts?: { limit?: number }): Promise<BackupMeta[]>;

  createBackup(input: {
    envelope: unknown;      // already sanitized
  }): Promise<BackupMeta>;

  fetchBackup(input: { id: string }): Promise<unknown>;  // returns envelope

  deleteBackup?(input: { id: string }): Promise<void>;
}
```

The Cloud Sync UI should be largely provider-agnostic:
- sign-in / token entry
- “Back up now”
- history list
- restore from history
- status messages

---

## GitHub Gist provider guidance (advanced option)

### Multi-device reality
- Recommend one PAT per device.
- Backups are discovered by listing the user’s gists and filtering by:
  - filename prefix (e.g. `dspace-save-`)
  - description (e.g. `DSPACE Cloud Sync backup`)
- Manual “Gist ID” input becomes an escape hatch, not the primary UX.

### Filename conventions
Use a filesystem-safe UTC timestamp:
- `dspace-save-2025-12-23T01-23-45Z.json`

Avoid colons (`:`) for portability.

---

## DSPACE Cloud provider (first-party) with E2EE

### Why E2EE
If the server only ever sees ciphertext:
- self-hosting is safer (less liability),
- breaches leak far less,
- trust boundaries are clearer.

### Suggested crypto model (high-level)
- Derive an encryption key on the client.
- Encrypt backup envelopes locally.
- Upload encrypted blobs + minimal metadata.
- Download and decrypt on restore.

**Key management options (choose one path):**
1) Passphrase-based (human-memorable, easiest to reason about)
2) Recovery code (random key, user stores it)
3) Device-bound key + optional export (best UX, hardest recovery)

### Minimal API
This is intentionally tiny:

```http
POST /api/backups
GET  /api/backups
GET  /api/backups/{id}
DELETE /api/backups/{id}    (optional)
```

Suggested payloads:

```json
// POST /api/backups
{
  "createdAt": "2025-12-23T01:23:45.678Z",
  "label": "Before trying v3.3 beta",
  "ciphertext": "base64...",
  "nonce": "base64...",
  "kdf": { "name": "argon2id", "params": { "...": "..." } },
  "meta": {
    "appVersion": "3.2.0",
    "deviceLabel": "daniel-laptop-chrome"
  }
}
```

**Important:** Keep metadata minimal. Assume metadata is not secret.

### Storage
Two practical options:
- Postgres (blob + metadata)
- S3-compatible (blobs) + Postgres (metadata)

S3-compatible is a sweet spot for self-hosting via MinIO.

### Authentication
Incremental options:
- v0: single-user API key (self-host, personal use)
- v1: email login or passkeys
- v2: multi-device sessions, revoke, rate limiting

---

## Deployment & self-hosting (Sugarkube-friendly)

Target outcome:
- deploy the service as a simple stateless app
- use managed TLS via Ingress
- attach Postgres + optional MinIO

Configuration sketch:

```yaml
env:
  - name: DATABASE_URL
    valueFrom: ...
  - name: S3_ENDPOINT
    value: http://minio:9000
  - name: S3_BUCKET
    value: dspace-backups
  - name: AUTH_MODE
    value: "single_user_api_key"  # or "passkeys"
  - name: SINGLE_USER_API_KEY_HASH
    valueFrom: ...
```

Operational notes:
- Do not log ciphertext contents.
- Log request ids, status codes, and sizes only.
- Rate limit writes to avoid accidental spam backups.

---

## UX vision (what users should feel)

### Default, no-account path
- “Download backup file” (one click)
- “Restore from file” (one click)
- Clear warnings when restoring overwrites local state

### Cloud path
- “Sign in” (or “Connect provider”)
- “Back up now” + last backup time visible
- History list (date, device label, optional note)
- Restore from list with confirmation
- Optional retention controls (keep last N)

### Conflict handling
Don’t over-engineer. Start with:
- backups are append-only snapshots
- restoring is explicit
- no automatic “merge”

Later:
- optional “latest backup restore” shortcut
- optional “auto backup every X minutes” (power user)

---

## Security & privacy checklist

- Backups are sanitized (no secrets).
- Tokens/credentials are never included in backups.
- Tokens are stored only after validation and never logged.
- Backups are immutable snapshots (unless explicit overwrite is chosen).
- For first-party cloud: ciphertext only (E2EE), minimal metadata.

---

## Migration & compatibility

### From GitHub Gists → DSPACE Cloud
- Restore from gist into local
- Create fresh encrypted backup to DSPACE Cloud
- (Optional future tool) One-click “import all gist backups” with client-side re-encryption

### From file backups
- Always supported. This is the universal escape hatch.

---

## Open questions (parked for later)

- Key recovery UX (passphrase vs recovery codes vs passkeys)
- Retention defaults (keep last 10? last 30? by age?)
- Background sync cadence and battery/perf constraints
- Provider selection UI complexity vs simplicity
- Metadata minimization vs usability (device labels, notes)

---

## Summary

- GitHub Gists are a great advanced MVP transport, but not the destination.
- The durable investment is:
  - a stable backup envelope,
  - strict sanitization,
  - a provider interface,
  - a restore-first UX.
- “Real cloud save” is feasible with a tiny API and E2EE, and can be self-hosted cleanly via Sugarkube.

**Guiding mantra:** Make the backup blob boring, portable, and safe. Everything else is just a pipe.
