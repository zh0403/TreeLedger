# TreeLedger 🌳

> Urban Forestry dMRV & Municipal SLA Verification Platform for SDP University Hackathon 2026.

## Architecture

- **`apps/web`**: Next.js 14+ (App Router), Tailwind CSS, Lucide Icons, Mapbox GL.
  - `/app`: Resident mobile PWA (QR Explorer, Hazard Reporting, Maintenance Proofs).
  - `/contractor`: Field worker work-order execution portal.
  - `/admin`: Master developer township operations console.
- **`apps/api`**: FastAPI (Python 3.11+), Supabase (PostgreSQL), Gemini 3.8 Flash Vision API, Web3.py.
- **`contracts/`**: Solidity contracts for Arbitrum Sepolia audit logging.

## Quickstart

### 1. Backend (`apps/api`)
```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000

```

API runs on `http://localhost:8000` (Docs: `http://localhost:8000/docs`).

### 2. Frontend (`apps/web`)

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev

```

Web app runs on `http://localhost:3000`.

## Team Responsibilities

* **Frontend Dev 1**: Resident PWA (`/app`) & Contractor Portal (`/contractor`).
* **Frontend Dev 2**: Desktop Township Ops Console (`/admin`) & Mapbox GIS layers.
* **Backend Dev 1**: FastAPI architecture, Supabase schema & endpoints.
* **Backend Dev 2**: Gemini Vision Triage & Arbitrum Web3 service.

---