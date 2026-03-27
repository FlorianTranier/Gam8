# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gam8 is a Discord bot (TypeScript, discord.js v14) that helps multi-gaming communities find gaming partners. It uses Slash Commands and Discord's Components V2.

## Commands

```bash
npm run build          # Compile TypeScript to build/
npm start              # Build and run
npm run start:dev      # Hot-reload dev mode (nodemon + ts-node + pino-pretty)
npm run lint           # ESLint
npm run lint-and-fix   # ESLint with auto-fix
```

No tests are implemented yet.

## Architecture

**Entry point:** `src/index.ts` — initializes i18n, MongoDB, Discord client, providers, routers, listeners, and cron jobs.

**Layer structure:**
- `src/domain/` — business logic
  - `models/` — data models for channels, games, and search messages
  - `services/commands/` — 6 slash command implementations (search, event, cancel, tag, clear, help)
  - `services/jobs/` — background jobs (message expiration)
  - `services/listeners/` — Discord event listeners (voice state changes for auto-notifications)
  - `services/selectReactions/` — Select menu interaction handlers
  - `utils/` — shared utilities
- `src/providers/` — external service integrations (MongoDB, RAWG.io game API, AWS S3)
- `src/routers/` — `CommandRouter.ts` and `ReactionRouter.ts` dispatch Discord interactions to handlers
- `src/i18n/` — internationalization resources
- `src/patchnotes/` — per-version patch note data

**Key patterns:**
- All slash commands implement `CommandInterface`
- `CommandRouter` → command services; `ReactionRouter` → select reaction handlers
- Providers are instantiated in `index.ts` and injected into routers/services
- Images are composed with `sharp`/`join-images`, then stored on S3 and served via S3 URL

## Environment Variables

Required in `.env`:
```
BOT_TOKEN, BOT_CHANNEL, BOT_CLIENT_ID
DB_CONN_STRING
S3_ACCESS_KEY, S3_SECRET_KEY, S3_ENDPOINT, S3_BUCKET_NAME
RAWG_API_KEY
VERSION
```

## Code Style

Prettier config: no semicolons, 120 char line width, single quotes, trailing commas (ES5), tabs for indentation.
