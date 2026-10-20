# TreeLedger 🌳
> **Urban Forestry dMRV & Municipal Contractor SLA Verification Platform**  
> *Built for Sime Darby Property (City of Elmina) • SDP University Hackathon 2026*

---

## 📌 Project Overview & Aim

In master-planned townships like the **City of Elmina**, thousands of native trees (*Hopea odorata*, *Tembusu*, *Yellow Flame*) are planted to meet ambitious ESG decarbonization quotas and Defect Liability Period (DLP) commitments. However, township operators face two critical operational breakdowns:

1. **Pre-Handover Blindspots (Homeowner Due Diligence):** When new homebuyers take vacant possession, they lack an audit trail to verify if their precinct's promised living canopy quotas and carbon baseline absorption metrics were actually planted and verified.
2. **Contractor SLA & Maintenance Fraud:** Municipal tree maintenance contracts (pruning, irrigation, pest control) suffer from unverified billing, slow hazard response times, and absence of verifiable proof-of-work.

### The TreeLedger Solution
TreeLedger connects residents, contractors, and township operators through an interconnected digital Measurement, Reporting & Verification (**dMRV**) operating system:
* **Citizen Triage:** Residents capture photos of hazardous or distressed trees; Google AI Studio (`gemini-3.8-flash`) performs immediate arborist triage to grade severity and recommend SLA turnaround windows.
* **Cryptographic Proof-of-Work:** Field contractors must submit before-and-after photographic evidence, which is verified by AI and sealed with immutable audit logs on **Arbitrum Sepolia**.
* **Township Command Center:** Real-time Mapbox GIS operations console tracking living canopy survival, automated contractor financial penalties for missed SLAs, and one-click ESG audit exports.

---

## 🏛️ System Architecture & Tech Stack

```text
TreeLedger Monorepo
├── apps/web (Next.js 14+ App Router, Tailwind CSS v4, Lucide Icons, Mapbox GL)
│   ├── (resident)/app/       -> Mobile PWA for Residents (Pre-handover due diligence, Hazard reporting)
│   ├── (contractor)/         -> Mobile PWA for Contractors (Work orders, Proof-of-work uploads)
│   └── (ops)/admin/          -> Widescreen Desktop Command Center (GIS, SLA Penalties, ESG exports)
├── apps/api (FastAPI, Python 3.11+)
│   ├── app/api/              -> REST endpoints (/api/trees, /api/hazards, /api/triage, etc.)
│   ├── app/services/         -> Gemini 3.8 Flash Multimodal AI & Arbitrum Web3 service
│   └── app/core/             -> Supabase PostGIS Client & Environment Settings
├── contracts/
│   └── TreeLedgerAudit.sol   -> Arbitrum Solidity audit contract (keccak256 proof hashes)
└── scripts/
    └── verify_system.py      -> Automated full-stack verification runner
```

* **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Lucide React, Mapbox GL JS.
* **Backend:** FastAPI, Pydantic v2, Supabase (PostgreSQL with PostGIS), Uvicorn.
* **AI Computer Vision:** Google AI Studio (`gemini-3.8-flash`) via `google-genai` with deterministic Pydantic schema validation.
* **Blockchain Layer:** Arbitrum Sepolia (`contracts/TreeLedgerAudit.sol`) with Web3.py and local cryptographic fallback (`keccak256`).

---

## 🚀 How to Run the Project

### Option A: Fast Start for UI Designers & Frontend Developers
If you are designing or styling the UI, **you do not need to install Python or set up Supabase**. The frontend includes built-in mock telemetry and resilient fallback data:

```bash
# 1. Navigate to the web workspace
cd apps/web

# 2. Setup your local environment file
cp .env.example .env.local

# 3. Install dependencies & run development server
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser. You can navigate between all 5 interfaces immediately.

---

### Option B: Full-Stack Developer Setup (Frontend + Backend)

#### 1. Backend (`apps/api`)
```bash
# 1. Navigate to the API workspace
cd apps/api

# 2. Setup Python virtual environment
python -m venv .venv

# On Windows PowerShell:
.\.venv\Scripts\activate
# On macOS / Linux:
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY if testing live APIs

# 5. Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
* **API Endpoints:** `http://localhost:8000`
* **Interactive Swagger Documentation:** `http://localhost:8000/docs`

#### 2. Seed Sample Telemetry (Optional)
To populate 40 realistic Malaysian urban trees into Supabase around Elmina Central Park:
```bash
cd apps/api
python seed_data.py
```

#### 3. Frontend (`apps/web`)
In a separate terminal:
```bash
cd apps/web
npm install
npm run dev
```

---

## 🧪 Automated Testing & Verification

TreeLedger includes automated headless test scripts to verify the entire system with zero manual effort:

| Command | Workspace | What it verifies |
| :--- | :--- | :--- |
| `npm test` | `apps/web` | Full TypeScript compiler validation across all components and pages (`tsc --noEmit`). |
| `.\.venv\Scripts\pytest tests -v` | `apps/api` | Pytest suite testing health endpoints, OpenAPI routes, AI vision fallback, and Web3 audit hashing. |
| `python scripts/verify_system.py` | Project Root | **One-command master check:** runs both frontend TypeScript and backend Pytest suites in sequence. |

---

## 🧭 Directory Map & Component Structure

```text
apps/web/src/
├── app/
│   ├── page.tsx                           # Central Portal Hub (links to all 5 role views)
│   ├── layout.tsx                         # Global metadata and root font configuration
│   ├── (resident)/                        # Mobile-first Resident PWA
│   │   └── app/
│   │       ├── explore/page.tsx           # Pre-Handover Quota Audit & Living Carbon Ticker
│   │       ├── hazards/page.tsx           # Public Civic Hazard Timeline & AI Camera Drawer
│   │       └── maintenance/page.tsx       # Before/After Proof Stream with Arbitrum badges
│   ├── (contractor)/                      # Field Contractor Task Portal
│   │   └── contractor/tasks/page.tsx      # Task Execution Queue with Photo Proof Resolution
│   └── (ops)/                             # Master Developer Operations Command Center
│       └── admin/page.tsx                 # Widescreen GIS Dashboard, SLA Deduction Matrix, ESG Modal
├── components/
│   ├── mobile/
│   │   └── MobileShell.tsx                # Mobile viewport frame (max-w-md) with bottom navigation
│   └── map/
│       └── TownshipMap.tsx                # Interactive Mapbox GIS map with health-coded markers & slide-over drawer
└── lib/
    ├── api.ts                             # Resilient API client with automatic offline mock fallbacks
    └── types.ts                           # Pydantic-mirrored TypeScript interfaces (Tree, Hazard, Maintenance)
```

---

## 📖 User Manual: Exploring the Interfaces

### 1. Central Portal Hub (`/`)
* Entry point displaying quick navigation cards to all role-based applications.
* Features clean responsive links to Resident, Hazard, Maintenance, Contractor, and Admin interfaces.

### 2. Resident Explore & dMRV (`/app/explore`)
* **Precinct Switcher:** Toggle between **[Pre-Handover Audit]** (for new owners checking promised developer quotas) and **[Living Stewardship]** (active canopy health).
* **Decarbonization Ticker:** Displays verified cumulative $\text{CO}_2$ sequestered in kilograms per year.
* **Tree Asset Profile Card:** Shows species (*Merawan Siput Jantan*, *Tembusu*, *Yellow Flame*), handover status, GPS coordinates, and health score.

### 3. Public Civic Hazard Feed & AI Triage (`/app/hazards`)
* **Incident Timeline:** Community feed of reported tree hazards.
* **4-Stage Stepper:** Tracks progress from `Reported` $\to$ `AI Triaged` $\to$ `Dispatched` $\to$ `Resolved`.
* **Report Drawer:** Tap *"Report Hazard"* to submit field notes and capture/upload an evidence photo. The AI automatically grades severity (`LOW`, `MEDIUM`, `CRITICAL_24H`) and computes recommended contractor turnaround times.

### 4. Audited Maintenance Stream (`/app/maintenance`)
* **Visual Proof-of-Work:** Shows verified before-and-after photo comparisons of contractor work (e.g., pruning, deep root watering).
* **Arbitrum Verification Badge:** Displays cryptographic `keccak256` transaction receipts (`0x...`) linking to Arbitrum Sepolia for tamper-evident validation.

### 5. Contractor Task Execution Queue (`/contractor/tasks`)
* **Assigned Work Orders:** Mobile queue for municipal arborists and landscaping teams.
* **Proof-of-Work Submission:** Contractors review the hazard issue, perform field work, and upload a mandatory *"After Photo"* before the system allows closing the ticket.

### 6. Township Operations Command Center (`/admin`)
* **Real-time KPI Ribbon:** Aggregates Total Assets, Canopy Survival Index (%), SLA Compliance (%), and Total Annual $\text{CO}_2$ sequestered.
* **GIS Mapbox Map:** Interactive satellite/streets GIS centered on Elmina Central Park (`[3.195, 101.515]`). Markers are color-coded:
  * 🟢 **Green (>= 80%):** Healthy canopy.
  * 🟡 **Amber (50% - 79%):** Requires inspection or scheduled watering.
  * 🔴 **Red (< 50%):** Critical hazard or dead sapling requiring replacement.
* **Asset Quick-Inspect Drawer:** Click any tree on the map to open a slide-over panel showing its full metadata, defect history, and carbon baseline.
* **Contractor SLA Compliance Table:** Tracks contractor turnaround times, overdue tasks, and calculates automated financial deduction penalties against contractor invoices.
* **ESG Report Export Modal:** Aggregates total precinct biomass and sequestered carbon dioxide equivalent ($\text{CO}_2e$) with instant CSV/JSON report downloads for municipal auditors.

---

## 🎨 Guide for UI Collaborators & AI Agents

If you are joining the team to polish or redesign UI components:

### Boundaries & Rules
1. 🟢 **Safe to modify:** Anything inside `apps/web/src/app/` and `apps/web/src/components/` (styling, spacing, animations, colors, modals, layouts).
2. 🔴 **Do not modify:** Field names or types inside [`apps/web/src/lib/types.ts`](file:///c:/Users/zonghao04/github/TreeLedger/apps/web/src/lib/types.ts). These mirror the backend PostgreSQL schemas.
3. 🟡 **Design System:** We use **Tailwind CSS v4** with a modern dark theme (`slate-950` background, `emerald-500` accents for healthy ecology, `amber-500` for warnings, `rose-500` for critical hazards). Icons are from **Lucide React**.

### Starter Prompt for Your AI Agent
Copy and paste this prompt when launching your coding assistant (e.g. Antigravity IDE / CLI):

```text
I am redesigning UI components for TreeLedger in `apps/web`.
Please inspect `apps/web/src/app/` and `apps/web/src/components/`.

Ground Rules:
1. Tech Stack: Next.js 14+ (App Router), Tailwind CSS v4, Lucide React icons, dark slate-950 theme.
2. Only modify UI components and styles inside `apps/web/src/app/` and `apps/web/src/components/`.
3. Do NOT edit field names in `apps/web/src/lib/types.ts` (these match the backend database).
4. Do NOT use placeholder code or incomplete imports.
5. After edits, run `npm test` inside `apps/web` to confirm zero TypeScript errors.
```