# Forest Intelligence unification

Scope: Phase 1 only. Work on lowercase `wx`, as confirmed by the project owner. Do not commit, push, deploy, or proceed to Phase 2 without approval. The existing local deletion of `apps/api/.env.example` is unrelated and must remain untouched.

## Pre-change capability inventory

| Routes | Existing pages, controls, and workflows to retain |
| --- | --- |
| `/` | Cinematic WebGL particle tree, pointer interaction, Demo identity/passport, pause/resume, scroll storytelling, reduced-motion fallback, section anchors, three workspace links. |
| `/admin`, `/admin/map` | Map-first GIS console, rail, workspace selector, map layers, geographic/satellite choice, opacity, tree/health toggles, connection details, collapsible intelligence, zoom/pan, selection/clusters when supplied records exist. |
| `/admin/trees`, `/admin/maintenance`, `/admin/hazards`, `/admin/sla`, `/admin/insights` | Registry search/condition filter; operational overlays; unavailable-data states; supporting evidence links only for supplied records. |
| `/admin/operations` | Imported operations prototype: sync trees, health/handover filters, tree selection and drawer, map/recenter/zoom, local SLA dispatch, contractor search/status filters, ESG format selection/export/download and close actions. |
| `/app`, `/app/trees` | Nature Explorer home/alias, tree search/reset, supplied-record condition filters, map preview, role navigation, local report shortcut, integrated service links. |
| `/app/map`, `/app/profile`, `/app/reports` | Map/retry, disconnected passport, local report list/search/priority/reset, draft editor, connection details. |
| `/app/explore` | API-backed or fallback registry, stewardship mode, precinct and text filters, refresh, QR demonstration picker, reset, report links, carbon/condition presentation. |
| `/app/hazards` | Status filters, refresh, photo/timeline previews, report drawer, tree selection, hazard-type selection, image capture/preview/replace, AI preview, description, submit/cancel. |
| `/app/maintenance` | Search/reset, action filters, refresh, photo comparisons, expand/collapse, copy transaction reference, explorer links. |
| `/contractor`, `/contractor/map`, `/contractor/history` | Existing task preview, basemap/retry, local evidence editor, local draft search/filter/reset, integrated service links. |
| `/contractor/tasks` | Active/resolved filters, refresh, dispatch/start, completion modal, action selection, image capture/replace, notes, completion submit/cancel, receipt dismissal/explorer link. |

### Forms and validation

- Local report/evidence drafts: optional reference/location, required trimmed description (3,000 characters maximum), report urgency, JPEG/PNG/WebP preview under 10 MB, explicit storage errors. Text persists locally; photographs do not. Native dialog close/Escape and successful-save feedback remain.
- Imported hazard and contractor forms: retain their existing tree/action/type controls, image/file handling, required photo checks, description/notes and original handlers. Styling does not add validation promises that the original code does not enforce.
- Search/filter controls remain controlled inputs, with their current reset behavior. No submission is triggered during UI regression checks.

### APIs and data models

`src/lib/api.ts` supplies `fetchTrees`, `fetchHazards`, `fetchMaintenanceRecords`, `runAiTriage`, `submitHazardReport`, `updateHazardStatus`, and `resolveContractorTask`. Existing calls include GET `/api/trees`, `/api/hazards`, `/api/maintenance`; POST `/api/triage`, `/api/hazards`, `/api/maintenance`; PATCH `/api/hazards/{id}`. Payloads, API base configuration, local cache keys, and fallback behavior are frozen for Phase 1.

`src/lib/types.ts` defines Tree, HazardReport, MaintenanceRecord, TriageResponse, CreateHazardPayload, ResolveTaskPayload, and their status unions. Newer GIS and Resident views have separate presentation contracts whose data currently equals `null` (disconnected). These models are not renamed or replaced.

### Maps, authentication, and verification

- Three map renderers currently coexist: `admin/gis-map.tsx` (clusters, selectable records, health styles and satellite fallback), `workspaces/township-map.tsx` (basemap-only previews), and `map/TownshipMap.tsx` (imported selectable trees/vector fallback/SLA dispatch). Preserve all three in Phase 1. A shared renderer belongs to Phase 2.
- No authenticated role/session guard was found in the present route/API implementation. Role selectors and cross-role links are previews, not authorization. Do not create new management capabilities or claim permission enforcement.
- Imported maintenance views link to Arbitrum Sepolia and copy hashes. Existing client code can generate illustrative transaction hashes; AI and submission functions can fall back to simulations/local storage. The prototype disclosure must remain visible. Styles and badges do not verify evidence. Blockchain/backend code stays unchanged.
- Existing loading routes, error boundaries/retry, map setup/provider errors, unavailable registry states, zero-results views, local-storage failure messages, and form feedback remain present.

## Existing issues, not fixed by a visual foundation

1. `/admin/operations` embeds a different sample tree set (12) from the shared API fallback (7), plus independent contractor/SLA telemetry. The new GIS and Resident views are disconnected. Counts cannot be reconciled by styling or replacing them with constants.
2. A successful API response containing an empty array can fall through to cached/demo data. Source provenance is not returned by the client. API errors are often swallowed by fallback behavior.
3. The client requests PATCH hazard status and POST maintenance routes that are not implemented by the imported core router. There is a separate verify-maintenance service; this mismatch needs integration work, not a renamed button.
4. Simulated AI, local-only dispatch/completion, illustrative transaction/export hashes and sample photos are not audit evidence. The QR picker is a demonstration, not a tested camera QR scanner. Geofencing is not enforced by the present completion handler.
5. Imported Admin TreeAsset includes additional nested fields not guaranteed by the core Tree schema. Avoid claiming end-to-end compatibility until adapters are tested.
6. Health bands, maintenance state, verification and SLA compliance are separate concepts. Phase 1 unifies presentation tones only; shared definitions and source-aware records need approval in later phases.

## Implementation plan

1. **Foundation (this change):** update existing semantic tokens; retain Geist/Geist Mono; consolidate navigation/link, brand and button primitives; use them in existing public, GIS, Resident, Contractor and imported mobile shells; map legacy utility colors into the same palette. Retain all route destinations and action handlers.
2. **Await approval:** shared Tree Passport and map interaction patterns with source-aware adapters.
3. **Then:** map-first Admin refinement, without losing Operations workflows.
4. **Then:** Resident discovery and reporting refinement.
5. **Then:** Contractor/evidence/maintenance workflow refinement.
6. **Then:** landing consistency and final polish, keeping the existing 3D scene.
7. **Then:** full responsive, accessibility and functional regression testing.

### Phase 1 design decisions

Use the supplied palette: dark background `#0B1D18`, surface `#15352B`, elevated `#1D4033`, mint `#52D9A5`, ivory `#F5F7F2`, secondary `#9CB9AB`; light ivory/white/ink `#16392B` and forest `#21654B`. Keep the supplied light secondary `#5F7769` as a palette value, with a darker semantic text variant for small text on ivory. Verification cyan, warning amber and critical red are shared semantic roles, not page palettes.

The supplied critical marker red has only 4.17:1 contrast on the dark surface, so small critical labels use `--status-critical-text` (`#F08B87` on dark surfaces) while markers retain `#E36B67`. Light-theme labels retain the stronger existing red. This is an accessibility shade of the same semantic role, not another page palette.

Retain the tree as the landing's distinctive element. Keep product navigation quiet: one leaf wordmark, 44-pixel minimum targets, shared active/focus treatment, consistent icon strokes and safe-area insets. Do not force GIS rails, public section links and field-worker bottom tabs into the same physical layout; they share primitives and tokens, not workflows.

```text
Public:       brand | section navigation | platform access
Workspaces:   brand | role context        | existing destinations
Mobile:       content with reserved inset / existing bottom actions
```

Geist remains the interface family; mono is reserved for identifiers/numeric data. Use a 12/14/16/18/24/32 scale and 4/8/12/16/24/32 spacing. Controls, panels and dialogs have distinct shared radii. No new font downloads, decorative metrics, animation library or dependency is needed.

The skill search's first AI-chat palette was rejected as unrelated. The narrower GIS result supported restrained chrome and honest source labels; the user's forest palette and existing composition take precedence over suggested slate/glass styling. The live reference could not be loaded by the web tool; local source and rendered pages are the implementation baseline.

## Verification boundary

Run lint, TypeScript, build, source-level handler/validation and protected-file comparisons, route checks, navigation/draft/modal checks, and browser screenshots at desktop/mobile widths. Test mutations only with intercepted/local responses or the existing local-only draft editor; do not write to a real backend, execute a contract, or silently seed data. External provider/API availability must be reported separately from frontend success.

## Phase 1 delivery

### Files changed

- Foundation: `src/app/design-tokens.css`, `src/app/globals.css`, new `src/app/interface.css`.
- Shared UI: new `src/components/ui/brand.tsx`, `navigation.tsx`, `button.tsx`; existing `ui/button-link.tsx` now shares button classes/types.
- Public navigation: `src/components/site-header.tsx`.
- GIS/Operations chrome: `src/components/admin/admin-command-center.tsx`, `admin-gis.css`, `src/app/admin/operations/page.tsx`.
- Resident chrome: `src/components/resident/resident-shell.tsx`, `resident.css`.
- Imported services: `src/components/mobile/MobileShell.tsx`, `src/components/main-services.tsx`.
- Existing workspace foundation: `src/components/workspaces/workspace.tsx`, `workspace.css`, `draft-dialog.tsx`, `workspace-error.tsx`.
- Audit/plan/results: this document.

`Brand`, `Navigation`, `NavigationLink`, and `Button`/`ButtonLink` replace repeated branding/link/button markup while preserving each shell's layout. Existing status-badge and surface styles consume the updated semantic tokens. No unused parallel Card, MapViewer, or Passport framework was introduced; those need the later workflow-specific audits already listed above.

### Verification performed

- `npm run lint`: 0 errors; 10 existing warnings (image optimization and the imported map cleanup ref).
- `npm test` (TypeScript) and `npm run build`: passed.
- `git diff --check`: passed, apart from informational Windows line-ending conversion notices.
- Source regression against the pre-change merge commit: 24 protected backend/model/map/tree/storage files unchanged; all 268 event-handler and form-validation attributes unchanged; all 20 existing nested route files retained.
- All 21 existing route URLs returned HTTP 200 from the production build.
- Browser rendering: 10 representative routes each at 375, 768, and 1440 pixels; no horizontal overflow, no duplicate fixed navigation, no undersized shared navigation targets or application exceptions observed. Additional 1024-pixel tablet and 844×390 landscape checks passed on four representative shells. Reduced-motion was enabled.
- Browser interaction in production and development: local report required validation, local-only save/persistence, reports shortcut with one editor, close action; cross-shell client navigation; hazard drawer/photo input/cancel; GIS layers open/Escape/focus return; Operations export dialog opens. No export, AI triage, hazard submission, task dispatch/completion, or contract execution was triggered. The temporary browser draft storage was restored.
- Native Mapbox geographic basemap actually loaded; settled desktop screenshots were inspected. Basemap availability is not evidence of connected operational layers.
- Contrast samples: dark secondary on surface 6.31:1; light secondary on ivory 4.64:1; dark critical label on surface 5.55:1. This is targeted checking, not a claim of a complete WCAG audit of all legacy content.

The browser exercised GET tree/hazard paths through the existing client. No backend server was started, so live Supabase, uploads, AI, authorization, and blockchain outcomes are **not** verified. Existing legacy simulation/provenance issues remain documented above. Follow-up at the owner's request: the static SVG fallback now emits fixed-precision coordinates, all three dynamic section pages put the URL-param read behind a local Suspense boundary, and the root layout declares data-scroll-behavior. A fresh development browser run confirmed identical attributes for all 500 fallback particles, successful direct/client section navigation, reduced-motion fallback, and zero recurrence of the three targeted warnings. Build and TypeScript passed; lint retained the same 10 existing warnings. This follow-up does not change the 3D renderer or business handlers. Use `http://localhost:3000`, not a different origin: Next's development-origin restrictions blocked HMR during the first 127.0.0.1 automation run; localhost interaction checks passed after the preview restart. No development-origin security configuration was loosened.

### Handoff

The dev preview is running at `http://localhost:3000`. To restart manually, run `npm run dev` from `apps/web`. No dependency, API, model, backend, authentication, or blockchain code was changed. No commit, push, or deployment was performed. The unrelated pre-existing API environment-example deletion remains local.

**Stop after Phase 1.** Await approval before Phase 2 (shared Tree Passport and map interaction patterns). Phases 3–7 remain pending.
