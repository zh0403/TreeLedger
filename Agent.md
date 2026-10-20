# Agent Context & Engineering Directive: TreeLedger OS

## 1. Project Overview & Operational Context
TreeLedger OS is an urban forestry management, civic stewardship, and digital Measurement, Reporting & Verification (dMRV) platform designed for large-scale master-planned developments (e.g., Sime Darby Property's City of Elmina). The platform bridges two critical operational lifecycle phases: (1) **Pre-Handover / Defect Liability Period (DLP) Audits**, allowing incoming homeowners to verify promised tree quotas and baseline decarbonization telemetry before handover; and (2) **Active Township Stewardship**, providing public hazard reporting, automated contractor SLA tracking, and mandatory photographic proof-of-work.

The product consists of three distinct, role-based interfaces communicating with a shared backend:
1. **Resident Mobile PWA (`/app`)**: 3-tab layout (`/explore`, `/hazards`, `/maintenance`) featuring QR tree scans, public hazard timelines with before/after photos, and pre-handover green due diligence.
2. **Contractor Portal (`/contractor`)**: Task queue requiring geofenced photographic proof-of-work before work orders can be closed.
3. **Township Operations Command Center (`/admin`)**: Geospatial GIS map (Mapbox), real-time contractor SLA tracking, and audit-grade ESG/carbon reporting exports.

---

## 2. Technical Stack & Infrastructure
* **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide React, Mapbox GL JS / `react-map-gl`, `html5-qrcode` / native mobile camera inputs.
* **Backend:** Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy / SQLModel.
* **Database & Storage:** Supabase (PostgreSQL with PostGIS extension for spatial queries; Supabase Storage buckets for photographic evidence).
* **AI & Computer Vision:** Google AI Studio via `gemini-3.8-flash`. Multimodal vision pipeline running inside FastAPI, consuming image bytes and returning deterministic structured JSON (strictly bound to Pydantic schemas for canopy health grading, fault categorization, and contractor proof-of-work verification).
* **Blockchain Layer:** Arbitrum (Nitro testnet / Arbitrum Sepolia). Minimal Solidity contract emitting audit logs and storing cryptographic hashes (`keccak256(treeId, actionType, photoProofHash, timestamp)`) for tamper-evident contractor SLA and dMRV verification.

---

## 3. Core Database Schema (Supabase / PostgreSQL)

```sql
-- Enable PostGIS if geo-queries are needed
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Master Tree Registry
CREATE TABLE trees (
    id VARCHAR(50) PRIMARY KEY,              -- e.g., 'ELM-042'
    precinct VARCHAR(100) NOT NULL,          -- e.g., 'Sector 4A - Ilham Residence'
    species VARCHAR(100) NOT NULL,
    common_name VARCHAR(100),
    handover_status VARCHAR(50) NOT NULL,    -- 'PRE_HANDOVER_PLANTED', 'DLP_ACTIVE', 'COMMISSIONED'
    planted_at TIMESTAMPTZ NOT NULL,
    co2_kg_per_year NUMERIC(6, 2) NOT NULL,  -- Annual carbon absorption baseline
    health_score INT DEFAULT 100,            -- 0 to 100
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    qr_code_hash VARCHAR(64) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Resident & Civic Hazard Reports
CREATE TABLE hazard_reports (
    id SERIAL PRIMARY KEY,
    tree_id VARCHAR(50) REFERENCES trees(id) ON DELETE CASCADE,
    reporter_id VARCHAR(100) NOT NULL,       -- Anonymized resident identifier
    hazard_type VARCHAR(50) NOT NULL,        -- 'STORM_DAMAGE', 'ROOT_HEAVE', 'DRY_FOLIAGE', 'PEST'
    description TEXT,
    evidence_photo_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'REPORTED',   -- 'REPORTED', 'TRIAGED', 'DISPATCHED', 'RESOLVED'
    ai_severity_grade VARCHAR(20),          -- 'LOW', 'MEDIUM', 'CRITICAL_24H'
    ai_confidence NUMERIC(4, 3),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Contractor Maintenance & Proof-of-Work Logs
CREATE TABLE maintenance_records (
    id SERIAL PRIMARY KEY,
    hazard_id INT REFERENCES hazard_reports(id) ON DELETE SET NULL,
    tree_id VARCHAR(50) REFERENCES trees(id) ON DELETE CASCADE,
    contractor_id VARCHAR(50) NOT NULL,
    action_type VARCHAR(100) NOT NULL,       -- 'CANOPY_PRUNING', 'DEEP_ROOT_WATERING', 'REPLACED_SAPLING'
    before_photo_url TEXT NOT NULL,
    after_photo_url TEXT NOT NULL,           -- Mandatory completion evidence
    notes TEXT,
    ai_verification_passed BOOLEAN DEFAULT TRUE,
    arbitrum_tx_hash VARCHAR(66),            -- 0x... EVM transaction hash
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

```

---

## 4. Work Distribution & Agent Responsibilities

### Frontend Track (2 Engineers)

**Dev 1 — Resident & Contractor Mobile PWA (`src/app/(resident)` & `src/app/(contractor)`):**
* `/app/explore`: Precinct switcher (Pre-Handover vs Living), Tree Asset Card, Decarbonization Ticker.
* `/app/hazards`: Real-time public incident feed with progress stepper (`Reported` $\to$ `Triaged` $\to$ `Dispatched` $\to$ `Resolved`) and before-photo modal.
* `/app/maintenance`: Public before/after visual proof-of-work feed with Arbitrum transaction receipt links.
* `/contractor/tasks`: Task queue, image capture input for `after_photo_url`, and task resolution submission.


**Dev 2 — Township Operations Command Console (`src/app/(ops)/admin`):**
* Mapbox GL integration rendering tree layers categorized by health (`Green`, `Amber`, `Red`) and handover phases (`Pre-Handover` vs `Post-Handover`).
* Contractor SLA compliance table (turnaround time, unresolved tasks, automated deduction penalties).
* Executive ESG Export modal aggregating total precinct biomass and sequestered $\text{CO}_2e$.


### Backend Track (2 Engineers)

**Dev 3 — Core API, Schemas & Supabase Integration (`backend/app/api`):**
* FastAPI route setup: `/api/trees`, `/api/hazards`, `/api/maintenance`, `/api/precincts/stats`.
* Supabase client integration: database queries and image uploads to public storage buckets.
* Server-Sent Events (SSE) or WebSocket broadcaster pushing status updates to the Ops dashboard in real time.


* **Dev 4 — AI Vision Pipeline & Arbitrum Smart Contract (`backend/app/services`):**
  * `/api/triage`: Endpoint processing image payloads using `gemini-3.8-flash`. 
    - Uses `google.genai` Client with `response_mime_type="application/json"`.
    - Returns structured schema:
      ```json
      {
        "health_score": 85,
        "hazard_type": "DRY_FOLIAGE",
        "severity_grade": "CRITICAL_24H",
        "detected_issues": ["desiccation", "leaf scorch"],
        "recommended_sla_action": "Emergency deep-root irrigation within 24h",
        "confidence": 0.94
      }
      ```
  * `/api/verify-maintenance`: Vision verification comparing `before_photo_url` and `after_photo_url` to confirm contractor task resolution before triggering the on-chain write.
  * Arbitrum integration: Web3.py script interacting with `TreeLedgerAudit.sol` on Arbitrum Sepolia. Writes audit hashes (`keccak256`) and returns transaction receipts.

---

## 5. Coding Standards & Ground Rules for AI Assistance

1. **Zero Fluff Code:** Generate complete, syntactically clean files without missing imports or placeholder comments (`// TODO: implement later`).
2. **Schema Uniformity:** All API endpoints must strictly validate payloads against Pydantic models matching the Supabase table definitions.
3. **Component Independence:** Keep UI components modular within `src/components/` to allow Frontend Dev 1 and Dev 2 to build independently without layout regressions.
4. **Resilience:** Fall back gracefully to mock transactions or cached data if external network RPCs (Arbitrum testnet or Vision APIs) encounter rate limits during live demos.

---

## 6. UI/UX Design & Frontend Collaborator Directive

### 6.1 Purpose for Design Collaborators
For collaborators focusing on UI/UX redesigns, visual polish, and layout enhancements:
- Work strictly inside `apps/web/`.
- The frontend includes built-in mock telemetry in `apps/web/src/lib/api.ts`—you **do not** need to run Python or Supabase locally to view and style all 5 interfaces.
- Launch preview via `npm run dev` at `http://localhost:3000`.

### 6.2 File & Component Directory Map
```text
apps/web/src/
├── app/
│   ├── page.tsx                           # Central Portal Hub (links to all 5 views)
│   ├── (resident)/app/
│   │   ├── explore/page.tsx               # Pre-handover tree quotas & Carbon Ticker
│   │   ├── hazards/page.tsx               # Hazard Timeline, 4-stage stepper, camera drawer
│   │   └── maintenance/page.tsx           # Before/After photo comparison & Arbitrum badge
│   ├── (contractor)/contractor/tasks/     # Contractor Work Orders & Proof-of-Work upload
│   └── (ops)/admin/page.tsx               # Command Center: Mapbox GIS, SLA penalty matrix, ESG export
├── components/
│   ├── mobile/MobileShell.tsx             # Responsive mobile shell container (max-w-md)
│   └── map/TownshipMap.tsx                # Mapbox GL map component with color-coded markers
└── lib/
    ├── api.ts                             # API client with fallback data
    └── types.ts                           # STRICT: Do not change property names
```

### 6.3 Boundaries & Guardrails for AI Assistance
1. **Safe Scope:** Modify HTML, Tailwind classes, motion/animations, icons, and layout in `src/app/` and `src/components/`.
2. **Untouchable Core:** Do **NOT** rename, delete, or alter the schema types in `apps/web/src/lib/types.ts` as they mirror backend Pydantic and database schemas.
3. **Verification Command:** Always run `npm test` inside `apps/web` after modifying code to verify that the TypeScript compiler passes with 0 errors.