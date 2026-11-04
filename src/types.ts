// Core domain types for AfterFire.
// These types are structured so their fields can later map to FEMA
// IA (Individual Assistance) / PA (Public Assistance) intake templates.
// This app does NOT claim FEMA compliance.

export type SiteType = 'home' | 'infrastructure' | 'natural-resource'

export type AssessmentStatus =
  | 'needs-inspection'
  | 'draft'
  | 'needs-review'
  | 'reviewed'

// Preliminary assessor damage observation categories.
// For homes this follows a FEMA-style ladder; always labeled "preliminary".
export type DamageLevel =
  | 'unknown'
  | 'no-visible'
  | 'affected'
  | 'minor'
  | 'major'
  | 'destroyed'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export type ReportSource = 'official' | 'resident'

export interface Photo {
  id: string
  // Stored as a data URL (base64) so it persists in IndexedDB.
  dataUrl: string
  caption: string
  takenDate: string // ISO date
  // Optional GPS; may be captured via device or entered manually.
  lat?: number
  lon?: number
  gpsSource?: 'device' | 'manual'
}

export interface RepairEstimate {
  // Documented estimate only. Unknown costs stay unknown (never $0).
  amount?: number
  source: string // e.g. "Contractor bid", "County assessor"
  date: string // ISO date
  notes?: string
}

export interface StatusHistoryEntry {
  status: AssessmentStatus
  at: string // ISO timestamp
  by?: string
  comment?: string
}

export interface Assessment {
  id: string
  incidentId: string // links to Incident.id
  siteName: string
  address: string
  lat: number
  lon: number
  type: SiteType

  assessorName: string
  organization: string
  inspectionDate?: string // ISO date

  status: AssessmentStatus
  damage: DamageLevel
  notes: string
  followUp: string
  priority: Priority

  // Resident-submitted reports are "Unverified resident report" until reviewed.
  reportSource: ReportSource

  photos: Photo[]
  repairEstimate?: RepairEstimate

  // Reviewer workflow.
  reviewComment?: string
  reviewedBy?: string

  statusHistory: StatusHistoryEntry[]

  // Flags whether this record belongs to sample/demo data.
  isDemo: boolean

  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}

export interface Incident {
  id: string
  name: string
  county: string
  acresBurned?: number
  discoveredDate?: string // ISO date
  controlDate?: string // ISO date
  fireOutDate?: string // ISO date
  lat?: number
  lon?: number
  // Real DNR record vs. the seeded fictional demo fire.
  isDemo: boolean
  // Source attribution.
  source: 'WA DNR' | 'Demo'
}
