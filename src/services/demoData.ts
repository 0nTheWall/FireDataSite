// Seed data for AfterFire.
// Contains ONE clearly fictional fire and ~12 sample assessment sites.
// Everything here carries isDemo: true and is kept separate from real DNR data.
// The fictional fire is obviously named so no one confuses it with a real event.

import type { Assessment, Incident, SiteType, DamageLevel } from '../types'

export const DEMO_INCIDENT_ID = 'demo-cedar-hollow'

export const demoIncident: Incident = {
  id: DEMO_INCIDENT_ID,
  name: 'SAMPLE: Cedar Hollow Fire (fictional)',
  county: 'Chelan',
  acresBurned: 8420,
  discoveredDate: '2025-07-18',
  controlDate: '2025-07-29',
  fireOutDate: '2025-08-05',
  // Near Leavenworth, WA — plausible but this is sample data, not a real fire.
  lat: 47.5962,
  lon: -120.6615,
  isDemo: true,
  source: 'Demo',
}

const now = '2025-08-10T12:00:00.000Z'

interface SeedSite {
  name: string
  address: string
  lat: number
  lon: number
  type: SiteType
  damage: DamageLevel
  status: Assessment['status']
  priority: Assessment['priority']
  reportSource: Assessment['reportSource']
  assessor: string
  org: string
  notes: string
  followUp: string
  inspectionDate?: string
  estimate?: Assessment['repairEstimate']
  withPhoto?: boolean
}

const seeds: SeedSite[] = [
  {
    name: 'Riverbend residence',
    address: '142 Cedar Hollow Rd, Leavenworth, WA',
    lat: 47.6031,
    lon: -120.6702,
    type: 'home',
    damage: 'destroyed',
    status: 'reviewed',
    priority: 'urgent',
    reportSource: 'official',
    assessor: 'M. Alvarez',
    org: 'Chelan County Emergency Management',
    notes: 'Structure fully lost. Foundation intact. Resident safely evacuated.',
    followUp: 'Coordinate debris removal referral.',
    inspectionDate: '2025-08-02',
    estimate: {
      amount: 310000,
      source: 'County assessor rebuild estimate',
      date: '2025-08-06',
      notes: 'Based on prior tax-assessed structure value.',
    },
    withPhoto: true,
  },
  {
    name: 'Hilltop cabin',
    address: '88 Ponderosa Ln, Leavenworth, WA',
    lat: 47.589,
    lon: -120.651,
    type: 'home',
    damage: 'major',
    status: 'needs-review',
    priority: 'high',
    reportSource: 'official',
    assessor: 'J. Chen',
    org: 'Chelan County Emergency Management',
    notes: 'Roof and east wall severely damaged. Likely not habitable.',
    followUp: 'Structural engineer sign-off needed.',
    inspectionDate: '2025-08-03',
  },
  {
    name: 'Orchard Way home',
    address: '5 Orchard Way, Peshastin, WA',
    lat: 47.5771,
    lon: -120.6189,
    type: 'home',
    damage: 'minor',
    status: 'draft',
    priority: 'medium',
    reportSource: 'official',
    assessor: 'M. Alvarez',
    org: 'Chelan County Emergency Management',
    notes: 'Smoke damage, scorched deck. Interior appears intact.',
    followUp: 'Confirm HVAC/air quality.',
    inspectionDate: '2025-08-04',
  },
  {
    name: 'Meadowview residence',
    address: '220 Meadowview Dr, Leavenworth, WA',
    lat: 47.611,
    lon: -120.645,
    type: 'home',
    damage: 'affected',
    status: 'draft',
    priority: 'low',
    reportSource: 'resident',
    assessor: '',
    org: '',
    notes: 'Resident reports fence loss and yard damage; home untouched.',
    followUp: 'Needs official inspection to verify.',
  },
  {
    name: 'Pine Street duplex',
    address: '17 Pine St, Leavenworth, WA',
    lat: 47.5955,
    lon: -120.6598,
    type: 'home',
    damage: 'unknown',
    status: 'needs-inspection',
    priority: 'high',
    reportSource: 'official',
    assessor: '',
    org: 'Chelan County Emergency Management',
    notes: 'Flagged in evacuation zone. Not yet reached by field team.',
    followUp: 'Schedule inspection.',
  },
  {
    name: 'Cedar Hollow Rd bridge',
    address: 'Cedar Hollow Rd mile 3.2, Chelan County, WA',
    lat: 47.6085,
    lon: -120.681,
    type: 'infrastructure',
    damage: 'major',
    status: 'needs-review',
    priority: 'urgent',
    reportSource: 'official',
    assessor: 'R. Patel',
    org: 'Chelan County Public Works',
    notes: 'Timber bridge deck burned; load-bearing status unknown.',
    followUp: 'Close to traffic pending inspection.',
    inspectionDate: '2025-08-03',
    estimate: {
      amount: 145000,
      source: 'Public Works preliminary estimate',
      date: '2025-08-05',
    },
    withPhoto: true,
  },
  {
    name: 'Valley Rd culvert',
    address: 'Valley Rd mile 1.1, Chelan County, WA',
    lat: 47.5702,
    lon: -120.6312,
    type: 'infrastructure',
    damage: 'minor',
    status: 'reviewed',
    priority: 'low',
    reportSource: 'official',
    assessor: 'R. Patel',
    org: 'Chelan County Public Works',
    notes: 'Debris blockage; culvert intact.',
    followUp: 'Clear debris before next rain.',
    inspectionDate: '2025-08-04',
  },
  {
    name: 'Ridgeline power pole run',
    address: 'Ridgeline access road, Chelan County, WA',
    lat: 47.6201,
    lon: -120.6701,
    type: 'infrastructure',
    damage: 'affected',
    status: 'draft',
    priority: 'medium',
    reportSource: 'official',
    assessor: 'T. Nguyen',
    org: 'Local utility district',
    notes: 'Several poles scorched; lines appear intact.',
    followUp: 'Utility crew to inspect hardware.',
    inspectionDate: '2025-08-05',
  },
  {
    name: 'Cedar Hollow Creek riparian zone',
    address: 'Cedar Hollow Creek, Chelan County, WA',
    lat: 47.6042,
    lon: -120.6555,
    type: 'natural-resource',
    damage: 'major',
    status: 'needs-review',
    priority: 'medium',
    reportSource: 'official',
    assessor: 'S. Brooks',
    org: 'WA Dept. of Natural Resources (field)',
    notes: 'Heavy burn along creek banks; erosion/sedimentation risk.',
    followUp: 'Assess post-fire flood/debris-flow risk.',
    inspectionDate: '2025-08-06',
  },
  {
    name: 'Hollow Ridge forest stand',
    address: 'Hollow Ridge, Chelan County, WA',
    lat: 47.6155,
    lon: -120.639,
    type: 'natural-resource',
    damage: 'destroyed',
    status: 'draft',
    priority: 'low',
    reportSource: 'official',
    assessor: 'S. Brooks',
    org: 'WA Dept. of Natural Resources (field)',
    notes: 'Mixed-conifer stand, high-severity burn.',
    followUp: 'Reforestation planning candidate.',
    inspectionDate: '2025-08-06',
  },
  {
    name: 'Trailhead parking & restroom',
    address: 'Cedar Hollow Trailhead, Chelan County, WA',
    lat: 47.5888,
    lon: -120.672,
    type: 'infrastructure',
    damage: 'no-visible',
    status: 'reviewed',
    priority: 'low',
    reportSource: 'official',
    assessor: 'J. Chen',
    org: 'Chelan County Emergency Management',
    notes: 'No visible damage to structures or lot.',
    followUp: 'None.',
    inspectionDate: '2025-08-02',
  },
  {
    name: 'Spring Gulch homestead',
    address: '401 Spring Gulch Rd, Peshastin, WA',
    lat: 47.5724,
    lon: -120.6025,
    type: 'home',
    damage: 'unknown',
    status: 'needs-inspection',
    priority: 'medium',
    reportSource: 'resident',
    assessor: '',
    org: '',
    notes: 'Resident reports possible outbuilding loss; details unconfirmed.',
    followUp: 'Dispatch assessor.',
  },
]

// A tiny 1x1 transparent-ish PNG used as a stand-in demo photo so the
// gallery renders without bundling binary assets. Caption explains it.
const DEMO_PHOTO_DATAURL =
  'data:image/svg+xml;base64,' +
  btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200">
      <rect width="320" height="200" fill="#dce3dc"/>
      <rect x="0" y="130" width="320" height="70" fill="#b9a68a"/>
      <polygon points="40,130 120,70 200,130" fill="#6b4f3a"/>
      <rect x="150" y="110" width="40" height="20" fill="#3a3a3a"/>
      <text x="160" y="185" font-family="sans-serif" font-size="13"
        text-anchor="middle" fill="#4a4a4a">Sample site photo</text>
    </svg>`,
  )

function makeId(prefix: string, i: number): string {
  return `${prefix}-${String(i + 1).padStart(3, '0')}`
}

export function buildDemoAssessments(): Assessment[] {
  return seeds.map((s, i) => {
    const id = makeId('AF-DEMO', i)
    const history: Assessment['statusHistory'] = [
      { status: 'needs-inspection', at: now, by: 'Seed' },
    ]
    if (s.status !== 'needs-inspection') {
      history.push({ status: 'draft', at: now, by: s.assessor || 'Field team' })
    }
    if (s.status === 'needs-review' || s.status === 'reviewed') {
      history.push({ status: 'needs-review', at: now, by: s.assessor || 'Field team' })
    }
    if (s.status === 'reviewed') {
      history.push({
        status: 'reviewed',
        at: now,
        by: 'A. Reviewer',
        comment: 'Approved — consistent with field photos.',
      })
    }

    return {
      id,
      incidentId: DEMO_INCIDENT_ID,
      siteName: s.name,
      address: s.address,
      lat: s.lat,
      lon: s.lon,
      type: s.type,
      assessorName: s.assessor,
      organization: s.org,
      inspectionDate: s.inspectionDate,
      status: s.status,
      damage: s.damage,
      notes: s.notes,
      followUp: s.followUp,
      priority: s.priority,
      reportSource: s.reportSource,
      photos: s.withPhoto
        ? [
            {
              id: `${id}-p1`,
              dataUrl: DEMO_PHOTO_DATAURL,
              caption: 'Sample site photo (demo placeholder)',
              takenDate: s.inspectionDate ?? '2025-08-03',
              lat: s.lat,
              lon: s.lon,
              gpsSource: 'device',
            },
          ]
        : [],
      repairEstimate: s.estimate,
      reviewedBy: s.status === 'reviewed' ? 'A. Reviewer' : undefined,
      reviewComment:
        s.status === 'reviewed'
          ? 'Approved — consistent with field photos.'
          : undefined,
      statusHistory: history,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    }
  })
}
