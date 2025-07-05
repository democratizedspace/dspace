# Raspberry Pi Deployment Guide

This guide explains how to run DSPACE on a three-node Raspberry Pi 5 cluster. It builds upon our existing Docker setup so you can deploy the web server on your own hardware.

## Bill of Materials

- **Raspberry Pi 5** boards (4GB or 8GB RAM)
- **PoE+ HAT with M.2 slot** (2230/2242) for each Pi
- **256GB M.2 SATA or NVMe SSD** per Pi
- **64GB microSD card** (reusable across nodes)
- **PoE+ network switch** and **Ethernet cables**
- **Cooling solution** (fan case or heatsink)
- **Cloudflare account** with a registered domain

## Preparing the Hardware

1. Flash Raspberry Pi OS 64‑bit to the microSD card using Raspberry Pi Imager.
2. Boot the first Pi and update firmware:
   ```bash
   sudo apt update && sudo apt full-upgrade
   sudo rpi-eeprom-update -a
   ```
3. Clone this repository and install Docker:
   ```bash
   git clone https://github.com/democratizedspace/dspace.git
   cd dspace
   sudo apt install -y docker.io docker-compose
   sudo usermod -aG docker $USER
   newgrp docker
   ```
4. Copy the OS to the SSD and enable USB/M.2 boot:
   ```bash
   lsblk                      # identify your SSD (e.g. /dev/sda)
   cd .. && git clone https://github.com/billw2/rpi-clone.git
   sudo cp rpi-clone/rpi-clone /usr/local/sbin/
   sudo rpi-clone /dev/sda
   sudo raspi-config  # Advanced Options -> Boot Order -> USB Boot
   sudo poweroff
   ```
   Answer `yes` to the clone prompts. Repeat for the remaining nodes using the same SD card.
5. Remove the SD card and boot from the SSD. On first boot you may see `Trying partition` messages for a few minutes while the filesystem grows.

### Moving the SSD to the M.2 slot

1. Boot from the SSD over USB.
2. Edit `/boot/config.txt` and enable NVMe support:
   ```ini
   dtparam=nvme
   dtparam=pciex1_gen=3  # optional, forces PCIe Gen3
   ```
3. Power down, insert the drive into the PoE HAT’s M.2 slot and boot again.

## Running DSPACE with Docker Compose

From any node you can start the container:

```bash
docker compose up --build -d
```

The `app` service exposes DSPACE on port **3002**. Create a Cloudflare Tunnel pointing at `http://localhost:3002` to serve the game publicly.

## Deploying on a k3s Cluster

Pick one Pi as the control plane and install k3s:

```bash
curl -sfL https://get.k3s.io | sh -
```

Grab the join token and add the other nodes:

```bash
sudo cat /var/lib/rancher/k3s/server/node-token
curl -sfL https://get.k3s.io | K3S_URL=https://<CONTROL_PLANE_IP>:6443 K3S_TOKEN=<NODE_TOKEN> sh -
```

Build the container images and load them into k3s:

```bash
# DSPACE
docker build -t dspace-app:latest -f frontend/Dockerfile ./frontend
k3s ctr images import dspace-app:latest

The Dockerfile sets `HUSKY=0` during `npm install` so build steps succeed even
without dev dependencies.

```

Apply the manifests:

```bash
kubectl apply -f k8s/
```

`k8s/dspace-deployment.yaml` and `k8s/dspace-service.yaml` describe the DSPACE Deployment and Service.

## Troubleshooting

- **SSD not detected**: reseat cables, check `lsblk`, run `sudo fsck -fy /dev/sda2`.
- **Booting issues**: ensure USB/M.2 boot is enabled and firmware is up to date.
- **Insufficient power**: verify PoE+ is delivering enough current or use USB‑C power.

With these steps your Pi cluster should run DSPACE reliably. Contributions describing other hardware or improvements are welcome!
