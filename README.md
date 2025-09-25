# 📓 Doo Journal

Doo Journal is a fun and safe kids journaling app, built on the Internet Computer (ICP).  
This repo contains both the Motoko backend canister and the React + Vite frontend.

---

## 📦 Prerequisites

- Node.js ≥ 16
- npm ≥ 7
- dfx ≥ 0.29.1
- Internet Identity URL: `https://id.ai/#authorize`

## Local (dev server)

dfx start --background --clean
dfx deploy
cd src/journal_frontend
npm run start

## Local (prod-like)

dfx start --background --clean
cd src/journal_frontend && npm run build && cd ../..
dfx deploy

## Mainnet

cd src/journal_frontend && npm run build && cd ../..
dfx deploy --network ic
