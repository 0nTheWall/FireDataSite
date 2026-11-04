// WA DNR Fire Statistics access layer.
// Pulls incident points from the ArcGIS REST /query endpoint.
// IMPORTANT: this layer has POINTS ONLY — no perimeters and no damage data.
// We never infer perimeters, burn radius, or damage from it.
//
// Layer:
// https://gis.dnr.wa.gov/site3/rest/services/Public_Wildfire/WADNR_PUBLIC_WD_WildFire_Data/MapServer/2

import type { Incident } from '../types'

const LAYER_URL =
  'https://gis.dnr.wa.gov/site3/rest/services/Public_Wildfire/WADNR_PUBLIC_WD_WildFire_Data/MapServer/2'

// Fields confirmed against the live layer schema.
const OUT_FIELDS = [
  'OBJECTID',
  'INCIDENT_NM',
  'COUNTY_LABEL_NM',
  'ACRES_BURNED',
  'DSCVR_DT',
  'CONTROL_DT',
  'FIRE_OUT_DT',
  'LAT_COORD',
  'LON_COORD',
].join(',')

interface DnrAttributes {
  OBJECTID: number
  INCIDENT_NM: string | null
  COUNTY_LABEL_NM: string | null
  ACRES_BURNED: number | null
  DSCVR_DT: number | null
  CONTROL_DT: number | null
  FIRE_OUT_DT: number | null
  LAT_COORD: number | null
  LON_COORD: number | null
}

interface DnrQueryResponse {
  features?: { attributes: DnrAttributes }[]
  error?: { message: string }
}

// ArcGIS dates come back as epoch milliseconds (or null).
function epochToIso(ms: number | null): string | undefined {
  if (ms == null) return undefined
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString().slice(0, 10)
}

function mapFeature(attr: DnrAttributes): Incident | null {
  // Require usable coordinates and a name to be useful on the map/list.
  if (attr.LAT_COORD == null || attr.LON_COORD == null) return null
  const name = (attr.INCIDENT_NM || '').trim() || `Fire #${attr.OBJECTID}`
  return {
    id: `dnr-${attr.OBJECTID}`,
    name,
    county: (attr.COUNTY_LABEL_NM || 'Unknown').trim(),
    acresBurned: attr.ACRES_BURNED ?? undefined,
    discoveredDate: epochToIso(attr.DSCVR_DT),
    controlDate: epochToIso(attr.CONTROL_DT),
    fireOutDate: epochToIso(attr.FIRE_OUT_DT),
    lat: attr.LAT_COORD,
    lon: attr.LON_COORD,
    isDemo: false,
    source: 'WA DNR',
  }
}

export interface FetchIncidentsResult {
  incidents: Incident[]
  ok: boolean
  error?: string
}

/**
 * Fetch recent, sizeable WA wildfire incidents from DNR.
 * The app must keep working if this is unreachable, so callers should
 * handle `ok: false` gracefully (we fall back to demo-only data).
 */
export async function fetchDnrIncidents(
  options: { minAcres?: number; limit?: number; signal?: AbortSignal } = {},
): Promise<FetchIncidentsResult> {
  const { minAcres = 500, limit = 150, signal } = options
  const params = new URLSearchParams({
    where: `ACRES_BURNED > ${minAcres} AND LAT_COORD IS NOT NULL`,
    outFields: OUT_FIELDS,
    orderByFields: 'DSCVR_DT DESC',
    resultRecordCount: String(limit),
    returnGeometry: 'false',
    f: 'json',
  })
  const url = `${LAYER_URL}/query?${params.toString()}`

  try {
    const res = await fetch(url, { signal })
    if (!res.ok) {
      return { incidents: [], ok: false, error: `HTTP ${res.status}` }
    }
    const data = (await res.json()) as DnrQueryResponse
    if (data.error) {
      return { incidents: [], ok: false, error: data.error.message }
    }
    const incidents = (data.features ?? [])
      .map((f) => mapFeature(f.attributes))
      .filter((i): i is Incident => i !== null)
    return { incidents, ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    return { incidents: [], ok: false, error: message }
  }
}
