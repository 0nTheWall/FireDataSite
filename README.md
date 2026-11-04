# AfterFire

A hackathon web app that helps Washington wildfire recovery officials
(county/tribal emergency managers, field assessors, recovery coordinators)
organize post-fire damage assessments and prepare **draft** recovery reports.

> **Draft assessment summary for official review. This app does not determine
> FEMA eligibility or guarantee assistance.**

## What it does

- **Overview** — summary cards (sites, needs inspection, needs review, reviewed)
  computed from stored records, a "what needs attention" list, a mini map,
  recent activity, and incident info.
- **Map** — incident points and assessment sites with separate toggles, distinct
  icons per site type (home / infrastructure / natural resource), search,
  filters, a legend, a click-to-open detail panel, and "Add assessment here" on
  map click. **No fire perimeter or burn radius is drawn** and no location is
  implied to be safe.
- **Assessments** — searchable table (desktop) / cards (mobile). A 3-step add
  form (Location → Observations & evidence → Review & save) with drafts, missing
  info highlighting, photos (preview, caption, date, optional GPS with manual
  fallback), optional repair estimate with source/date, and a reviewer workflow
  (approve / return with comment). Status ladder:
  Needs inspection → Draft → Needs review → Reviewed. Resident reports are
  labeled "Unverified resident report" until reviewed. Status + timestamp
  history is kept per record.
- **Reports** — incident details, coverage, outstanding inspections, damage by
  category (household / infrastructure / environmental, in separate sections),
  reviewed vs unreviewed, documented estimates with sources, missing
  documentation, photo references, and follow-ups. Includes **CSV export**, a
  **print-friendly page** (Save as PDF), and a **deterministic narrative
  generated without AI**. Unknown costs show as "Unknown", never $0; totals are
  called "documented estimates."

## Data

- **Real incidents** come from the WA DNR Fire Statistics layer via the ArcGIS
  REST `/query` endpoint:
  `https://gis.dnr.wa.gov/site3/rest/services/Public_Wildfire/WADNR_PUBLIC_WD_WildFire_Data/MapServer/2`
  Fields used: `INCIDENT_NM, COUNTY_LABEL_NM, ACRES_BURNED, DSCVR_DT, CONTROL_DT,
  FIRE_OUT_DT, LAT_COORD, LON_COORD`. The layer has **points only** — no
  perimeters and no damage data — so none are inferred.
- **Demo data** — one clearly fictional fire ("SAMPLE: Cedar Hollow Fire") with
  ~12 sample sites, kept separate from real data. A "Demo data" badge appears
  whenever sample data is in use.
- The app works offline: if DNR is unreachable, demo and locally saved records
  still load. All records and photos are stored in **IndexedDB** and survive a
  refresh.

External data access is isolated in `src/services/` (`dnr.ts`, `db.ts`,
`demoData.ts`). No paid APIs or API keys are required.

FEMA note: forms are structured so they can later map to FEMA IA/PA intake
templates, but the app makes **no compliance claim** and does not determine
eligibility.

## Stack

React + TypeScript + Vite + Tailwind CSS + Leaflet (OpenStreetMap tiles).

## Run locally

```bash
npm install
npm run dev      # start dev server
npm run build    # typecheck + production build
npm run preview  # preview the production build
```

## Demo flow

Select fire → open a site → add evidence → review → export report.
