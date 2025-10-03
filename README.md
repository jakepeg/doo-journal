# 📓 Doo Journal

Doo Journal is a fun and safe kids journaling app, built on the Internet Computer (ICP).  
This repo contains both the Motoko backend canister and the React + Vite frontend.

---

## 📦 Prerequisites

- Node.js ≥ 16
- npm ≥ 7
- dfx ≥ 0.29.1
- Internet Identity URL: `https://id.ai/#authorize`

## 🚀 Quick Start

### Local Development

```bash
# Start dfx and deploy all canisters
dfx start --clean
npm run deploy
npm run dev
```

### Mainnet Deployment

```bash
# Automated production deployment
npm run deploy:ic
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run deploy` - Deploy to local network (auto-configures vetKD keys)
- `npm run deploy:ic` - Deploy to mainnet (auto-configures production environment)
- `npm run update-env` - Regenerate .env.local with current canister IDs
- `npm run build` - Build all workspaces

## 🔐 Encryption System

This app uses Internet Computer's vetKD (Verifiable Encryption with Threshold Key Derivation) for secure, deterministic encryption of journal entries. The system automatically:

- Uses `dfx_test_key` for local development
- Switches to `key_1` for mainnet deployment
- Provides deterministic encryption based on user Principal IDs
- No localStorage dependencies for cross-device consistency

## 📁 Project Structure
