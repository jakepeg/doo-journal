# AI Assistant Instructions for Doo Journal

## Architecture Overview

This is a **React + Motoko** Internet Computer (ICP) DApp with three canisters:

- `journal_backend` (Motoko): Core business logic with role-based access control
- `journal_frontend` (Assets): Vite-built React SPA
- `internet_identity` (Optional): Local II for development

**Key architectural patterns:**

- Principal-based user identity (no traditional sessions)
- Transient state pattern in Motoko for non-persistent data (`registry`, `accessControlState`)
- Frontend uses React Query + TanStack Router for state/routing

## Critical Developer Workflows

### Deployment Commands

```bash
# Local dev (separate terminals)
dfx start --clean
dfx deploy
npm run dev --workspace journal_frontend

# Production-like local
npm run build && dfx deploy

# Mainnet
npm run build && dfx deploy --network ic
```

### Environment Configuration

- `scripts/update-env.js` auto-generates `.env.local` with canister IDs
- Uses `VITE_*` environment variables for frontend config
- Environment files: `.env.local` (dev), `.env.production` (mainnet)
- II URL switches between `id.ai` (mainnet) and local canister (dev)

### Code Generation

- `dfx generate journal_backend` creates TypeScript bindings in `src/declarations/`
- Must run before frontend builds to sync Motoko interface changes
- Configured via `prebuild` npm script

## Project-Specific Patterns

### Motoko Backend (`src/journal_backend/main.mo`)

- **Access Control**: Three roles (`#admin`, `#user`, `#guest`). First authenticated user becomes admin, enforced via `AccessControl.initialize(accessControlState, caller)`
- **Data Model**: `PrincipalMap<[JournalEntry]>` stores arrays of entries per user
- **File Handling**: Separate registry system tracks file paths/hashes via `Registry` module
- **Stable State**: Only `userProfiles` and `journalEntries` persist across upgrades
- **Module Structure**: `access-control.mo`, `registry.mo` handle specialized concerns

### React Frontend Authentication

- `useInternetIdentity` context manages II auth with 30-day delegation
- `useActor` hook auto-initializes access control on first backend call
- Actor creation pattern: `createActorWithConfig({ agentOptions: { identity } })`

### Frontend State Management

- React Query for backend data (see `src/hooks/useQueries.ts`)
- TanStack Router with file-based routing (`src/routes/`)
- Tailwind + shadcn/ui + Radix UI primitives component system

### Deployment Architecture

- Workspace structure: Root manages `src/journal_frontend` workspace
- Vite builds to `dist/` → deployed as assets canister
- `.ic-assets.json5` configures asset canister headers/rules

## Integration Points

### Internet Identity Flow

1. Frontend: `identity = await authClient.login()`
2. Backend: `AccessControl.initialize(accessControlState, caller)` on first call
3. Role assignment: Admin can promote users via `assignCallerUserRole`

### File Upload Pattern

1. Upload to assets canister via IC HTTP API
2. Register reference: `registerFileReference(path, hash)`
3. Link in journal entries via `imagePath` field

### Cross-Canister Communication

- Frontend queries multiple endpoints: `getOwnHomepage()`, `getUserHomepage(user)`
- File registry separate from journal data for modularity
- Public/private entry filtering happens at backend level

## Key Files for Context

- `src/journal_backend/main.mo` - Core Motoko business logic
- `src/journal_frontend/src/hooks/useInternetIdentity.ts` - Authentication context
- `src/journal_frontend/src/config.ts` - Actor configuration
- `dfx.json` - Canister definitions and dependencies
- `scripts/update-env.js` - Environment variable management
