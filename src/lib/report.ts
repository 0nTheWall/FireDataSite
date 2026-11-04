// Deterministic report generation — NO AI, NO invented data.
// Produces a narrative summary string and a CSV export from stored records.

import type { Assessment, Incident } from '../types'
import {
  breakdownByType,
  missingDocumentation,
  reviewedCounts,
  summarize,
} from './stats'
import {
  damageLabel,
  formatCurrency,
  formatDate,
  siteTypeLabel,
  statusLabel,
} from './labels'

// ---- Deterministic narrative ----

export function buildNarrative(
  incident: Incident,
  assessments: Assessment[],
): string {
  const s = summarize(assessments)
  const { reviewed, unreviewed } = reviewedCounts(assessments)
  const breakdown = breakdownByType(assessments)
  const lines: string[] = []

  const acres =
    incident.acresBurned != null
      ? `${Math.round(incident.acresBurned).toLocaleString()} acres`
      : 'an unknown number of acres'

  lines.push(
    `This draft summary covers the ${incident.name} in ${incident.county} County, Washington, which was discovered on ${formatDate(
      incident.discoveredDate,
    )} and affected approximately ${acres}.`,
  )

  lines.push(
    `A total of ${s.total} assessment site${s.total === 1 ? '' : 's'} ${
      s.total === 1 ? 'has' : 'have'
    } been recorded for this incident. Of these, ${reviewed} ${
      reviewed === 1 ? 'has' : 'have'
    } been reviewed and ${unreviewed} remain${unreviewed === 1 ? 's' : ''} unreviewed. ${
      s.needsInspection
    } site${s.needsInspection === 1 ? '' : 's'} still require${
      s.needsInspection === 1 ? 's' : ''
    } inspection, and ${s.needsReview} ${
      s.needsReview === 1 ? 'is' : 'are'
    } awaiting reviewer approval.`,
  )

  breakdown.forEach((b) => {
    if (b.count === 0) return
    const parts: string[] = []
    ;(Object.keys(b.byDamage) as (keyof typeof b.byDamage)[]).forEach((k) => {
      if (b.byDamage[k] > 0) parts.push(`${b.byDamage[k]} ${damageLabel[k].toLowerCase()}`)
    })
    const estText =
      b.estimatesWithAmount > 0
        ? ` Documented repair estimates for this category total ${formatCurrency(
            b.documentedEstimateTotal,
          )} across ${b.estimatesWithAmount} record${
            b.estimatesWithAmount === 1 ? '' : 's'
          }${b.estimatesUnknown > 0 ? `, with ${b.estimatesUnknown} additional record(s) having an unknown amount` : ''}.`
        : b.estimatesUnknown > 0
          ? ` No dollar amounts are documented for this category yet (${b.estimatesUnknown} record(s) pending).`
          : ' No repair estimates are documented for this category.'
    lines.push(
      `${siteTypeLabel[b.type]} sites: ${b.count} recorded (preliminary assessor observations: ${parts.join(
        ', ',
      )}).${estText}`,
    )
  })

  const gaps = missingDocumentation(assessments)
  if (gaps.length > 0) {
    lines.push(
      `Documentation gaps were identified in ${gaps.length} record${
        gaps.length === 1 ? '' : 's'
      }; see the "Missing documentation" section for specifics. These gaps should be resolved before any official submission.`,
    )
  } else {
    lines.push('No documentation gaps were detected in the current records.')
  }

  lines.push(
    'All damage categories reflect preliminary assessor observations. Cost figures are documented estimates only; records with no documented amount are reported as Unknown, not zero.',
  )

  return lines.join('\n\n')
}

// ---- CSV export ----

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function buildCsv(incident: Incident, assessments: Assessment[]): string {
  const headers = [
    'Assessment ID',
    'Incident',
    'County',
    'Site name',
    'Address',
    'Latitude',
    'Longitude',
    'Type',
    'Status',
    'Damage (preliminary)',
    'Priority',
    'Report source',
    'Assessor',
    'Organization',
    'Inspection date',
    'Follow-up',
    'Notes',
    'Photos (count)',
    'Estimate amount',
    'Estimate source',
    'Estimate date',
    'Reviewed by',
    'Review comment',
    'Created',
    'Updated',
  ]
  const rows = assessments.map((a) => [
    a.id,
    incident.name,
    incident.county,
    a.siteName,
    a.address,
    a.lat,
    a.lon,
    siteTypeLabel[a.type],
    statusLabel[a.status],
    damageLabel[a.damage],
    a.priority,
    a.reportSource === 'resident' && a.status !== 'reviewed'
      ? 'Unverified resident report'
      : a.reportSource,
    a.assessorName,
    a.organization,
    a.inspectionDate ?? '',
    a.followUp,
    a.notes,
    a.photos.length,
    // Documented estimate: Unknown stays Unknown, never 0.
    a.repairEstimate
      ? a.repairEstimate.amount != null
        ? a.repairEstimate.amount
        : 'Unknown'
      : '',
    a.repairEstimate?.source ?? '',
    a.repairEstimate?.date ?? '',
    a.reviewedBy ?? '',
    a.reviewComment ?? '',
    a.createdAt,
    a.updatedAt,
  ])
  return [headers, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n')
}

export function downloadText(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
