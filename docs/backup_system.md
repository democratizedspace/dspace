# Backup System

DSPACE nodes perform nightly backups to preserve player progress and custom content.
A host cron job creates timestamped `tar.gz` archives of the `backend` and `frontend`
workspaces. The archives are stored in the `backups/` directory and can be copied
off‑device for redundancy.

## Usage

Run the backup script manually as needed:

```bash
node scripts/backup.mjs
```

To back up specific paths, pass them as arguments:

```bash
node scripts/backup.mjs package.json docs
```

To change the output directory, use the `--out` option:

```bash
node scripts/backup.mjs --out my-backups package.json docs
```

## Restore

Extract the desired archive and replace the existing directories:

```bash
tar -xzf backups/backup-<timestamp>.tar.gz
```

Verify the application starts normally after restoration.

See also:
- [Cloudflare Load Balancing](./cloudflare_load_balancing.md)
- [Failover Procedures](./failover_procedures.md)
- [Monitoring Setup](./monitoring_setup.md)
