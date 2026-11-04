// Accessible status / priority / type / source badges.
// Each badge pairs color with a text label and a shape/icon so meaning never
// depends on color alone.

import type {
  AssessmentStatus,
  DamageLevel,
  Priority,
  ReportSource,
  SiteType,
} from '../types'
import {
  damageLabel,
  priorityLabel,
  priorityTone,
  reportSourceLabel,
  siteTypeIcon,
  siteTypeLabel,
  statusLabel,
  statusTone,
} from '../lib/labels'

export function StatusBadge({ status }: { status: AssessmentStatus }) {
  const tone = statusTone[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${tone.bg} ${tone.text}`}
    >
      <span
        aria-hidden="true"
        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${tone.dot}`}
      >
        {tone.symbol}
      </span>
      {statusLabel[status]}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const tone = priorityTone[priority]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium ${tone.bg} ${tone.text}`}
    >
      {priority === 'urgent' && <span aria-hidden="true">▲</span>}
      {priorityLabel[priority]} priority
    </span>
  )
}

export function TypeBadge({ type }: { type: SiteType }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">
      <span aria-hidden="true">{siteTypeIcon[type]}</span>
      {siteTypeLabel[type]}
    </span>
  )
}

export function DamageBadge({ damage }: { damage: DamageLevel }) {
  const tone =
    damage === 'destroyed' || damage === 'major'
      ? 'bg-urgent-50 text-urgent-700'
      : damage === 'minor' || damage === 'affected'
        ? 'bg-warn-50 text-warn-700'
        : damage === 'no-visible'
          ? 'bg-forest-50 text-forest-800'
          : 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ${tone}`}>
      {damageLabel[damage]}
    </span>
  )
}

export function SourceBadge({
  source,
  reviewed,
}: {
  source: ReportSource
  reviewed: boolean
}) {
  if (source === 'resident' && !reviewed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warn-100 px-2.5 py-1 text-sm font-medium text-warn-700">
        <span aria-hidden="true">⚠</span>
        Unverified resident report
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">
      {reportSourceLabel[source]}
    </span>
  )
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-forest-600 bg-forest-50 px-2.5 py-1 text-sm font-semibold text-forest-800">
      <span aria-hidden="true">🧪</span>
      Demo data
    </span>
  )
}
