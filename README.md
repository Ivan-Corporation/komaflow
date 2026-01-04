# Koma Token -- Full-Stack Web3 Architecture

A complete **production-grade Web3 system** built around the **Koma
(KOMA) ERC-20 token**, covering the full pipeline from smart contracts
to user-facing dashboards.

**Flow:**\
**Solidity Contracts → Subgraph → Backend Indexer & API → Frontend
Dashboard**

------------------------------------------------------------------------

## 🏗️ High-Level Architecture

    Solidity Contracts (Arbitrum)
            ↓ Events
    The Graph Subgraph
            ↓ GraphQL
    Backend Indexer & REST API
            ↓ HTTP / JSON
    React Frontend Dashboard

------------------------------------------------------------------------

## 📦 Repository Structure

    .
    ├── contracts/          # Solidity smart contracts (Foundry)
    ├── subgraph/           # The Graph subgraph
    ├── backend/            # Indexer + REST API
    ├── frontend/           # React dashboard (Vite + Tailwind)
    └── README.md

------------------------------------------------------------------------

## 1️⃣ Solidity Smart Contracts -- Koma (KOMA)

Upgradeable ERC-20 token deployed on **Arbitrum** with compliance
features.

### Features

-   Upgradeable ERC-20 (UUPS)
-   Role-based minting
-   Blacklisting / compliance controls
-   Subgraph & backend ready

### Build & Test

``` bash
forge build
forge test
```

### Deployment (Arbitrum Sepolia)

``` bash
forge script script/Deploy.s.sol \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --broadcast \
  --verify \
  --private-key $PRIVATE_KEY
```

------------------------------------------------------------------------

## 2️⃣ Subgraph -- The Graph

Indexes on-chain Koma token events and exposes them via GraphQL.

### Build & Deploy

``` bash
yarn codegen
yarn build
yarn deploy
```

------------------------------------------------------------------------

## 3️⃣ Backend Indexer & REST API

Node.js backend that polls the subgraph, stores data in PostgreSQL, and
exposes REST APIs.

### Run

``` bash
npm install
npm run dev
```

Server runs on **http://localhost:4000**

------------------------------------------------------------------------

## 4️⃣ Frontend Dashboard

React-based admin, minter, and analytics dashboard.

### Run

``` bash
npm install
npm run dev
```

------------------------------------------------------------------------

## 🔄 End-to-End Flow

1.  Smart contracts emit events
2.  Subgraph indexes blockchain data
3.  Backend stores & serves analytics
4.  Frontend visualizes data and sends transactions

------------------------------------------------------------------------

## 📄 License

MIT License
