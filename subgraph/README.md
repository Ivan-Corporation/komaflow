# HBTC Subgraph

This repository contains the subgraph for indexing on-chain data for the Hilbert BTC (hBTC) protocol.



This data powers analytics, dashboards, and off‑chain automation.

---

## 📁 Project Structure

```
.
|-- abis/
|-- src/
|-- schema.graphql
|-- subgraph.yaml
|-- package.json
```

---

## 🚀 Prerequisites

Install Graph CLI:

```bash
npm install -g @graphprotocol/graph-cli
```

Install dependencies:

```bash
yarn install
```

---

## 🧱 Build the Subgraph

Generate types:

```bash
yarn codegen
```

Build:

```bash
yarn build
```

---

## 📡 Deploy to Subgraph Studio

Authenticate once:

```bash
graph auth <YOUR_DEPLOY_KEY>
```

Deploy:

```bash
yarn deploy
```

---

## 🔁 Updating the Subgraph Version

Each time you update:

```bash
yarn codegen
yarn build
yarn deploy
```

Studio will create a new version automatically.

---

## 🔍 Querying the Subgraph

Find your query URL in Subgraph Studio:

```
https://api.studio.thegraph.com/query/<USER_ID>
```

Example query:

```graphql
{
  mints(first: 5) {
    id
    recipient
    amount
    timestamp
  }
}
```

---



## 📜 Scripts (package.json)

```
yarn codegen
yarn build
yarn deploy
```

---