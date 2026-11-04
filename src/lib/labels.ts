// Human-readable labels and status metadata.
// Status/priority/damage never rely on color alone — each has a text label
// and, where used as a badge, an icon or shape in addition to color.

import type {
  AssessmentStatus,
  DamageLevel,
  Priority,
  SiteType,
  ReportSource,
} from '../types'

export const STATUS_ORDER: AssessmentStatus[] = [
  'needs-inspection',
  'draft',
  'needs-review',
  'reviewed',
]

export const statusLabel: Record<AssessmentStatus, string> = {
  'needs-inspection': 'Needs inspection',
  draft: 'Draft',
  'needs-review': 'Needs review',
  reviewed: 'Reviewed',
}

// Badge styling. "tone" drives accessible color + a text label is always shown.
export const statusTone: Record<
  AssessmentStatus,
  { bg: string; text: string; dot: string; symbol: string }
> = {
  'needs-inspection': {
    bg: 'bg-urgent-50',
    text: 'text-urgent-700',
    dot: 'bg-urgent-600',
    symbol: '!',
  },
  draft: {
    bg: 'bg-warn-50',
    text: 'text-warn-700',
    dot: 'bg-warn-600',
    symbol: '…',
  },
  'needs-review': {
    bg: 'bg-warn-50',
    text: 'text-warn-700',
    dot: 'bg-warn-600',
    symbol: '?',
  },
  reviewed: {
    bg: 'bg-forest-50',
    text: 'text-forest-800',
    dot: 'bg-forest-600',
    symbol: '✓',
  },
}

export const damageLabel: Record<DamageLevel, string> = {
  unknown: 'Unknown',
  'no-visible': 'No visible damage',
  affected: 'Affected',
  minor: 'Minor',
  major: 'Major',
  destroyed: 'Destroyed',
}

export const DAMAGE_ORDER: DamageLevel[] = [
  'unknown',
  'no-visible',
  'affected',
  'minor',
  'major',
  'destroyed',
]

export const priorityLabel: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const priorityTone: Record<Priority, { bg: string; text: string }> = {
  low: { bg: 'bg-slate-100', text: 'text-slate-700' },
  medium: { bg: 'bg-forest-50', text: 'text-forest-800' },
  high: { bg: 'bg-warn-100', text: 'text-warn-700' },
  urgent: { bg: 'bg-urgent-100', text: 'text-urgent-700' },
}

export const siteTypeLabel: Record<SiteType, string> = {
  home: 'Home / household',
  infrastructure: 'Infrastructure',
  'natural-resource': 'Natural resource',
}

// Simple emoji icons paired with text everywhere (icon is never the sole cue).
export const siteTypeIcon: Record<SiteType, string> = {
  home: '🏠',
  infrastructure: '🛠️',
  'natural-resource': '🌲',
}

export const reportSourceLabel: Record<ReportSource, string> = {
  official: 'Official assessment',
  resident: 'Resident report',
}

export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Documented currency. Unknown stays "Unknown" — never $0.
export function formatCurrency(amount?: number): string {
  if (amount == null) return 'Unknown'
  return amount.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

export const DISCLAIMER =
  'Draft assessment summary for official review. This app does not determine FEMA eligibility or guarantee assistance.'
