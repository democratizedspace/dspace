# Migration from Netlify

DSPACE originally deployed its public site to Netlify. As the project grew and gained
server-side features, the static hosting model no longer fit our needs. Starting with v3,
production runs on self-hosted infrastructure.

## Why migrate?

- Full control over the build and runtime environments
- Ability to run background jobs and schedule backups
- Easier integration with monitoring and custom hardware

## Current setup

The main instance at democratized.space is served from on-premises hardware. Canonical images
are published by [ci-image.yml](../../.github/workflows/ci-image.yml), the Helm chart is
published by [ci-helm.yml](../../.github/workflows/ci-helm.yml), and Sugarkube deploys DSPACE
via Helm using its [DSPACE app runbook](https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md).

For deployment details, see:

- [Docker Deployment](deploy/docker.md)
- [DSPACE Sugarkube release runbook](sugarkube-release.md)

## Contributing

If you run your own instance, share your experience or improvements by opening an issue or
pull request.
