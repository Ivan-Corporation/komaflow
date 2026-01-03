# Koma Token Dashboard

A comprehensive backend API and indexer for tracking the **Koma Token** (ERC‑20 with blacklist functionality) on the **Arbitrum** network. The system indexes blockchain data from **The Graph** subgraph, stores it in **PostgreSQL**, and exposes clean **REST APIs** for analytics and monitoring.

---

## 🚀 Features

* **Real-time Indexing** – Automatically indexes Koma token events from a The Graph subgraph
* **Complete Analytics** – Track mints, burns, transfers, and blacklist activity
* **Historical Data** – Store and query historical token events
* **System Monitoring** – Health checks, metrics, and alerts
* **REST API** – Well-structured endpoints for frontend dashboards

---

## 📋 Prerequisites

* Node.js **18+**
* PostgreSQL **15+**
* npm or yarn
* A deployed **Koma Token subgraph** (or a compatible template)

---

## 🛠️ Installation

### 1. Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd koma-token-dashboard

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your configuration.

---

### 3. Database Setup

```bash
# Enter PostgreSQL shell
psql postgres

# Create database and user
CREATE DATABASE koma_db;
CREATE USER koma_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE koma_db TO koma_user;
\q
```

Update `.env`:

```env
DATABASE_URL="postgresql://koma_user:your_password@localhost:5432/koma_db"
```

Run Prisma migrations and seed data:

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

---

### 4. Configure Subgraph

Set your deployed subgraph URL:

```env
SUBGRAPH_URL="https://api.thegraph.com/subgraphs/name/your-username/koma-subgraph"
```

---

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Server runs on **[http://localhost:4000](http://localhost:4000)**

---

## 📊 API Endpoints

### Token Analytics

* `GET /api/token/overview` – Token supply and activity overview
* `GET /api/token/mints` – Mint history (paginated)
* `GET /api/token/burns` – Burn history (paginated)
* `GET /api/token/transfers` – Transfer history
* `GET /api/token/blacklist` – Blacklist & unblacklist events

### System

* `GET /health` – Basic health check
* `GET /api/system/health` – Detailed system metrics

---

### Query Parameters

Most endpoints support:

* `timeframe`: `1h`, `24h`, `7d`, `30d`, `90d` (default: `24h`)
* `limit`: number of records (default: `50`)
* `offset`: pagination offset (default: `0`)

Example:

```http
GET /api/token/mints?timeframe=7d&limit=100&offset=0
```

---

## 🗃️ Database Schema

### Event Tables

* `MintEvent`
* `BurnEvent`
* `TransferEvent`
* `BlacklistedEvent`
* `UnBlacklistedEvent`

### Analytics Tables

* `TokenSnapshot` – Periodic token metrics
* `SystemAlert` – System alerts and errors

---

## 🔄 Indexer Service

The indexer automatically:

* Polls the subgraph every **30 seconds**
* Stores new events in PostgreSQL
* Creates periodic token snapshots
* Generates alerts on failures

### Indexer Status

```bash
curl http://localhost:4000/health
```

---

## 🧪 Testing

### Manual API Tests

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/token/overview
curl http://localhost:4000/api/system/health
curl "http://localhost:4000/api/token/overview?timeframe=7d"
```

### Database Inspection

```bash
# Prisma Studio
npx prisma studio

# Direct DB access
psql -U koma_user -d koma_db -h localhost
```

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL
brew services list            # macOS
sudo systemctl status postgresql  # Linux

# Test connection
psql -U koma_user -d koma_db -h localhost
```

### Subgraph Issues

* Verify `SUBGRAPH_URL`
* Ensure subgraph is deployed and synced

```bash
curl -X POST $SUBGRAPH_URL \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}'
```

### Port Already in Use

```bash
lsof -i :4000
kill -9 <PID>
```

---

## 📈 Deployment

### Production Recommendations

* **Database**: AWS RDS, Supabase, DigitalOcean
* **Server**: Render, Railway, VPS, Heroku
* **Secrets**: Secure environment variable storage
* **Monitoring**: Sentry, Datadog

### Production Environment Variables

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:5432/dbname"
SUBGRAPH_URL="https://api.thegraph.com/subgraphs/id/your-subgraph-id"
PORT=4000
INDEXER_POLL_INTERVAL_MS=30000
SNAPSHOT_INTERVAL_MS=300000
```

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Arbitrum      │    │   The Graph     │    │   PostgreSQL    │
│   Blockchain    │───▶│   Subgraph      │───▶│   Database      │
└─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                       │
┌─────────────────┐    ┌─────────────────┐            │
│   Frontend      │───▶│   Express API   │◀───────────┘
│   Application   │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Indexer       │
                    │   Service       │
                    └─────────────────┘
```

---

## 📝 API Response Examples

### Token Overview

```json
{
  "overview": {
    "total_supply": "1000000.00000000",
    "total_minted": "1200000.00000000",
    "total_burned": "200000.00000000",
    "net_issuance": "1000000.00000000"
  },
  "timeframe_activity": {
    "timeframe": "24h",
    "mints": {
      "count": 15,
      "amount": "5000.00000000",
      "change_pct": "25.50"
    }
  }
}
```

### Mint History

```json
{
  "mints": [
    {
      "transaction": "0xabc...",
      "block": 12345678,
      "timestamp": "2024-01-01T12:00:00.000Z",
      "to": "0xuser...",
      "amount": "1000.00000000",
      "minter": "0xminter..."
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

---

## 🔧 Development

### Project Structure

```
src/
├── index.ts
├── lib/
│   └── prisma.ts
├── controllers/
├── routes/
├── services/
└── utils/
```

### Adding Features

**New API Endpoint**

* Add route in `src/routes/`
* Add controller in `src/controllers/`
* Update Prisma schema if needed

**New Event Type**

* Update subgraph schema
* Extend `indexerService.ts`
* Add DB model and API endpoint

---

## 📚 Resources

* Koma Token Contract
* The Graph Documentation
* Prisma Documentation
* Express.js Documentation

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to your fork
5. Open a Pull Request

---

## 📄 License

MIT License – see `LICENSE` for details.

---

## 📞 Support

* Review the troubleshooting section
* Open a GitHub issue
* Contact the maintainers

---

## ⚡ Quick Start (One‑Liner)

```bash
git clone <repo> && cd koma-token-dashboard && npm install && \
psql postgres -c "CREATE DATABASE koma_db; CREATE USER koma_user WITH ENCRYPTED PASSWORD 'password'; GRANT ALL PRIVILEGES ON DATABASE koma_db TO koma_user;" && \
echo "DATABASE_URL=\"postgresql://koma_user:password@localhost:5432/koma_db\"" > .env && \
npx prisma generate && npx prisma migrate dev --name init && npm run db:seed && npm run dev
```
