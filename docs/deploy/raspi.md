# Raspberry Pi k3s Deployment

This guide explains how to prepare Raspberry Pi nodes and deploy DSPACE using k3s. It references [k3s-ansible](https://github.com/k3s-io/k3s-ansible) for a more automated setup.

## Hardware & OS Prep

1. Flash Raspberry Pi OS 64‑bit to a microSD card and boot each Pi.
2. Update the system and firmware:
   ```bash
   sudo apt update && sudo apt full-upgrade -y
   sudo rpi-eeprom-update -a
   ```
3. Install Docker and Git, then clone this repository:
   ```bash
   sudo apt install -y docker.io git
   git clone https://github.com/democratizedspace/dspace.git
   ```
4. (Optional) Use the [k3s-ansible](https://github.com/k3s-io/k3s-ansible) playbooks to install k3s across the cluster.

## SSH Key Setup

Generate an ED25519 key on your workstation and add the public key to `/home/$USER/.ssh/authorized_keys` on **every** node:

```bash
ssh-keygen -t ed25519 -C "dspace" -f ~/.ssh/id_ed25519
ssh-copy-id -i ~/.ssh/id_ed25519.pub $USER@<node>
```

The private key will later be stored as `RPI_SSH_KEY` in GitHub secrets.

## Building a Multi-arch Image

Use `docker buildx` to build and push a multi-architecture image to GHCR:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/<owner>/dspace:latest \
  --push frontend
```

## GitHub Secrets

Add the following secrets under **Settings → Secrets and variables → Actions**. Leave them blank until your cluster is reachable; the deploy job will skip automatically.

| Secret | When needed | Example (safe) value |
|--------|-------------|-----------------------|
| `GHCR_TOKEN` | Always | `ghp_xxxxx` |
| `RPI_HOST` | LAN only | `rpi-controlplane0.local` |
| `RPI_USER` | LAN only | `ubuntu` |
| `RPI_SSH_KEY` | LAN only | *private-key-block* |
| `CLOUDFLARE_API_TOKEN` | When tunnels enabled | `cf_...` |

## Cloudflare Tunnel

Once k3s is running you can expose services with Cloudflare:

```bash
cloudflared tunnel create dspace-prod
cloudflared tunnel route dns dspace-prod dspace.example.com
```

External traffic arrives on port **443** and can map to any service/port inside the cluster.

