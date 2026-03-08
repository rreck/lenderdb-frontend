# LenderDB Frontend

Equipment finance lender intelligence platform. React + TypeScript + Vite + Tailwind.

Production: https://finance.rrecktek.com

## Quick Start

```bash
npm install
npm run dev        # local dev (mock data)
npm run build      # production build → dist/
```

Deploy:
```bash
rsync -av --delete dist/ rreck@192.168.206.8:/home/rreck/www-finance-rrecktek-com/ -e "ssh -i /mnt/nvme/dev/rocky_rsa"
```

## Directory Structure

```
src/
├── api/
│   ├── client.ts        # apiService — all API calls
│   ├── config.ts        # base URL, endpoints
│   ├── types.ts         # TypeScript types
│   ├── localStorage.ts  # local mode mock service
│   └── matcher.ts       # client-side deal matching
├── components/
│   ├── lenders/
│   │   └── LenderCard.tsx   # lender tile with logo, signals, crawl button
│   ├── layout/
│   │   ├── Header.tsx       # top nav with chat panel
│   │   └── MainLayout.tsx
│   └── ui/              # shadcn/ui primitives
└── pages/
    ├── LendersPage.tsx        # main lender grid with filters, sort, enrichment
    ├── LenderDetailsPage.tsx  # single lender detail view
    ├── DealMatcherPage.tsx    # deal matching form + results
    ├── MarketIntelligencePage.tsx
    └── WatchlistPage.tsx
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api` | Backend API base URL |

## Configuration

- **Local mode**: set `VITE_API_BASE_URL` to empty or omit — uses mock data via localStorage
- **API mode**: set `VITE_API_BASE_URL` to backend URL

## Features

### Lender Grid
- Paginated: loads 100 at a time, "Load more" button
- 30s poll: merges newly enriched lenders automatically without full reload
- Sort bar: Name, Appetite, Confidence, Min Deal, Max Deal, Updated, Tier
- Filter panel: Deal Size, Risk Tolerance, Min Confidence, Approval Speed, Country
- Search by name
- Broker Friendly quick toggle
- Clearbit logo → Google favicon fallback per lender

### Per-Lender Enrichment
- Hover any lender card → click the refresh icon to queue a crawl job
- Spinner while queued, result appears within 30s via background poll

### Bulk Enrichment
- "Enrich Records" button in page header
- Shows live progress bar: X / 8,687 enriched with error count
- Polls crawler status every 5s

### Deal Matcher
- Score lenders against a deal profile (size, industry, geography, credit, speed)
- Returns ranked matches with reasons and warnings

## API Endpoints (Backend)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/lenders | Paginated lender list (`limit`, `offset`, `updatedAfter`) |
| GET | /api/lenders/:id | Single lender |
| POST | /api/lenders/:id/crawl | Queue lender for crawler enrichment |
| GET | /api/crawler/status | Live crawler progress |
| POST | /api/match | Score lenders against a deal profile |
| GET | /api/market/summary | Market heat map and signals |
| POST | /batch | Trigger full enrichment batch |
