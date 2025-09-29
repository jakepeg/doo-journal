# Doo Journal

Doo Journal is a journaling DApp built on the Internet Computer (ICP). It combines a **React/Tailwind frontend** with a **Motoko backend** to let authenticated users create, manage, and share journal entries.

---

## 🔧 Architecture

### Frontend

- **Framework**: React 18 + Vite
- **Styling/UI**: Tailwind CSS, shadcn/ui components, Radix UI primitives
- **State & Data**:
  - React Query for async data fetching
  - TanStack Router for routing
- **Authentication**:
  - Internet Identity (II), configurable for local (`dfx`-deployed II) or mainnet (`id.ai`)
- **Build & Deploy**:
  - `vite build` → assets deployed as frontend canister
  - Configurable via `.env.local` and `.env.production`

### Backend

- **Language**: Motoko
- **Canisters**:
  - `journal_backend`: core business logic
  - `journal_frontend`: static asset canister
  - `internet_identity`: optional local II canister for dev
- **Modules**:
  - `access-control.mo`: manages user roles (admin, user, guest)
  - `registry.mo` / `lib.mo`: file registry (track file paths + hashes)
  - `main.mo`: orchestrates profiles, journal entries, and access control

---

## 🗂️ Backend Features

### Access Control

- Roles: `#admin`, `#user`, `#guest`
- First authenticated user becomes admin
- Admins can assign roles
- Permission checks on sensitive actions

### Profiles

- Users can create & update a profile: `name`, `bio`, `profilePicture`, `coverImage`
- Publicly queryable by principal

### Journal Entries

- CRUD operations:
  - `createJournalEntry`
  - `updateJournalEntry`
  - `deleteJournalEntry`
- Each entry has: `id`, `title`, `content`, `isPublic`, `timestamp`, `date`, `imagePath`
- Queries:
  - `getAllJournalEntries` (for caller)
  - `getPublicJournalEntries` (for a given user)
  - `getJournalEntryById`
  - Aggregates: `getOwnHomepage`, `getUserHomepage`, `getPublicJournalEntryWithProfile`

### File Registry

- Register uploaded file references by path + hash
- Query or list all references
- Drop references when unused

---

## 🔐 Authentication & Identity

- **Mainnet**: Uses `id.ai` as identity provider
- **Local Dev**: Runs local Internet Identity canister (`dfx deploy internet_identity`)
- **Frontend**:
  - `useInternetIdentity` React context
  - `useActor` hook wraps actor creation & initializes access control on first use

---

## 🚀 Deployment Workflow

### Local Development

````bash
dfx start --clean
dfx deploy
npm run dev --workspace journal_frontend

### Mainnet Development
```bash
npm run build --workspace journal_frontend
dfx deploy --network ic
````
