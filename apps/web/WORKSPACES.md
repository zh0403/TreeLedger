# TreeLedger workspace UI

## Preview

From `apps/web`, run `npm install` if needed, then `npm run dev`.
Open `http://localhost:3000`.

| Experience | Routes |
| --- | --- |
| Landing | `/` |
| Resident | `/app`, `/app/map`, `/app/profile`, `/app/reports` |
| Contractor | `/contractor`, `/contractor/map`, `/contractor/history` |
| Admin | `/admin`, `/admin/map`, `/admin/trees`, `/admin/maintenance`, `/admin/hazards`, `/admin/sla`, `/admin/insights` |

These are frontend workspace previews, not authenticated role sessions. The role selector changes the preview; it does not grant permissions or sign anyone in. Existing authentication and backend code have not been changed.

## Connected and unavailable behavior

The backend in this checkout implements only `GET /health`. It has no tree registry, work-order, report, upload, SLA, or analytics endpoints. The workspace UI therefore shows unavailable values, explicit empty states, and no fabricated operational records. It does not call guessed endpoints, invent AI classifications, or generate verification hashes.

The map uses the existing `NEXT_PUBLIC_MAPBOX_TOKEN` environment variable. With a valid public token it displays a Malaysia basemap; no tree markers are created without real tree locations. Without a token, or if the map service fails, the UI displays setup/error guidance. Map errors can be retried. Restart the dev server after changing public environment configuration.

## Admin GIS command center

Admin routes use an isolated, full-viewport GIS interface with a compact tool rail. Registry, maintenance, hazard, SLA, and insight routes open focused map overlays. The right intelligence panel can be collapsed; on small screens panels become scrollable sheets above the tool rail.

The default is the real Mapbox dark geographic basemap. Satellite + labels is selectable under Map layers and uses Mapbox satellite tiles with provider attribution. Satellite access and limits depend on the configured Mapbox account; a failed satellite request falls back to the geographic style with an explicit label. Neither mode is a live environmental feed.

`components/admin/gis-data.ts` defines the presentation shape and currently supplies `null` for disconnected records, not an empty connected registry. No markers, boundaries, maintenance zones, hazards, analytical layers, charts, or compliance percentages are invented. Disconnected layer toggles are disabled. The map supports geolocated-record clustering, health styling, critical-condition exclamation markers, selection focus, and a passport when real records are supplied through the component's `trees` prop. These interactions are not live until a documented registry is integrated. HTTPS evidence links and an explicit verified source status are both required before displaying a supplied verified status; the frontend does not independently verify blockchain transactions.

Still required: documented and authorized operational APIs; real tree coordinates and assessments; township boundary geometry; work orders and hazard locations; environmental measurements; and attributable audit evidence. No guessed API URLs are called. Mapbox provider credentials/permissions and network access remain necessary for basemaps.

## Resident Nature Explorer — Phases 1 and 2

`/app` now uses the mobile-first Nature Explorer home: a friendly welcome, existing general forest imagery, prominent tree search, the existing real Mapbox light-map preview, a report shortcut, and discovery cards when real records are supplied. The forest image is general presentation imagery, never a photo for a fabricated tree identity. No sample tree cards or health claims are added while records are unavailable.

`components/resident/resident-data.ts` currently supplies `null` for the disconnected registry. It defines presentation fields and local filtering for records supplied through `ResidentHome`'s `trees` prop. Search matches supplied names, species, IDs, and locations; condition filters use supplied assessments. An unavailable registry remains distinct from a connected registry containing zero records. No undocumented endpoints are requested.

The `/app` layout adds compact desktop navigation and a four-action mobile bar: Home, Explore, Write a report, and My reports. The existing Tree Passport route is accessible from the header. Report shortcuts reuse the unchanged local-draft editor and storage key; they do not upload evidence or submit a report. On the reports page the shortcut opens its existing editor rather than creating a second one.

Only navigation chrome is adapted around the existing secondary Resident pages. The full passport redesign, selected-tree map experience, guided reporting redesign, and My Reports redesign are Phases 3–5 and await approval. Admin, Contractor, and the cinematic landing page are unchanged by this Resident pass.

## Local report and evidence drafts

The Resident report editor and Contractor evidence editor save **text only** to browser local storage. Drafts survive reloads on that browser and origin, and are labelled as not submitted. They are not shared between roles, sent to the API, AI-triaged, or verified on-chain.

Photo selection creates a temporary browser preview. Photos are never uploaded or persisted with a draft. Reattach a photo later when a real submission service is integrated. Avoid personal or sensitive information in local drafts. Storage failures are shown without claiming success or deleting older drafts.

## Integration still required

The backend team must implement and document the real operational endpoints and authorization contracts before tree selection, maintenance completion, report tracking, uploads, AI triage, SLA calculations, or verification results can become live. Bind the views to those documented contracts rather than substituting mock data. The current styles and empty states deliberately preserve this distinction.

## Validation

Run `npm run lint` and `npm run build`.
