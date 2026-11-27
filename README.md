# CareOps

[![CI/CD](https://github.com/ParnianTj/CareOps-Equipment-Management-System/actions/workflows/ci-cd.yml/badge.svg?branch=main)](https://github.com/ParnianTj/CareOps-Equipment-Management-System/actions/workflows/ci-cd.yml)

A dashboard for managing medical equipment deployments across care providers: who has which devices, where they are deployed, what usage has been recorded and which reports are due.

**Live demo:** https://careops-equipment-management-system.onrender.com

> The demo runs on Render's free tier. The first request after a period of inactivity can take up to a minute while the instance wakes up.

## Features

- **Dashboard**: key figures, recent deployments, latest reports, care provider activity and a map of deployment locations.
- **Deployments**: create, edit and track deployments through their lifecycle (created → usage records → report → completed), with a details page per deployment.
- **Usage records**: recorded device usage and measurements per deployment.
- **Medical device management**: medical devices and monitoring devices, grouped by device series.
- **Care provider management**: a hierarchy of care providers and their users.
- **German and English** UI, switchable at runtime (German is the default).
- **Light and dark theme**.

All data is sample data held in memory (see [`lib/dashboard-data.ts`](lib/dashboard-data.ts) and [`lib/usage-record-data.ts`](lib/usage-record-data.ts)). There is no backend or database yet, so changes reset on reload.

## Tech stack

| Area | Tools |
|---|---|
| Framework | [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com) on Base UI, lucide icons |
| Maps | Leaflet |
| Testing and linting | Vitest, ESLint, `tsc` |
| Package manager | pnpm |
| Delivery | Docker, GitHub Actions, GitHub Container Registry, Render |

## Getting started

Requirements: **Node.js 26** (see [`.nvmrc`](.nvmrc)) and **pnpm 12** (pinned in `package.json`).

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

### Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build (standalone output) |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Type-check with `tsc --noEmit` |
| `pnpm test` | Run the unit tests with Vitest |

## Running with Docker

```bash
docker compose up --build -d
```

The app is then available at http://localhost:3000. The image is a multi-stage build that ships only the Next.js standalone server, runs as a non-root user and includes a healthcheck. If a `.env` file exists next to `docker-compose.yml`, it is loaded at runtime; it is optional.

Or run the prebuilt image from GitHub Container Registry:

```bash
docker run -d -p 3000:3000 ghcr.io/parniantj/careops-equipment-management-system:latest
```

Every image is also tagged with its commit (`sha-<short sha>`), so you can run an exact version.

## CI/CD

The pipeline in [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) runs on every push and pull request to `main`:

1. **Lint, Typecheck, Test, Build**: runs on every push and pull request.
2. **Build & Publish Container Image**: on pushes to `main` only, builds the Docker image and pushes it to GHCR as `latest` and `sha-<short sha>`.
3. **Deploy to Render**: deploys that exact `sha-` image (never `latest`) through a Render deploy hook, then runs a smoke test. The test waits until `/api/version` reports the commit that was just tested, and checks that the site returns HTTP 200 and contains "CareOps".
4. **Report pipeline result**: posts a commit status naming the stage that failed, or confirming the deploy.

To check which commit is live:

```bash
curl https://careops-equipment-management-system.onrender.com/api/version
# {"sha":"<commit sha>"}
```

Dependabot opens weekly update PRs for npm packages and GitHub Actions.

## Project structure

```
app/                       Routes (App Router)
  api/version/             Reports the deployed commit SHA
  deployments/             Deployments, usage records, care provider management
  medical-device-management/
  profile/
components/                Feature components, app shell, sidebar, shadcn/ui primitives
lib/                       Types, sample data and helpers
public/                    Logo and icons
Dockerfile, docker-compose.yml
.github/                   CI/CD workflow and Dependabot config
```
