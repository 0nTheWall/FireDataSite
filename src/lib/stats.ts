// Derived statistics computed from stored assessment records.
// Everything here is computed, never invented. Unknown costs stay unknown.

import type { Assessment, AssessmentStatus, DamageLevel, SiteType } from '../types'

export interface Summary {
  total: number
  needsInspection: number
  needsReview: number
  reviewed: number
  draft: number
}

export function summarize(assessments: Assessment[]): Summary {
  const by = (s: AssessmentStatus) => assessments.filter((a) => a.status === s).length
  return {
    total: assessments.length,
    needsInspection: by('needs-inspection'),
    needsReview: by('needs-review'),
    reviewed: by('reviewed'),
    draft: by('draft'),
  }
}

// Items that need attention, ordered by urgency.
export function needsAttention(assessments: Assessment[]): Assessment[] {
  const priorityRank: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  }
  const statusRank: Record<AssessmentStatus, number> = {
    'needs-inspection': 0,
    'needs-review': 1,
    draft: 2,
    reviewed: 3,
  }
  return assessments
    .filter((a) => a.status !== 'reviewed')
    .sort((a, b) => {
      const p = priorityRank[a.priority] - priorityRank[b.priority]
      if (p !== 0) return p
      return statusRank[a.status] - statusRank[b.status]
    })
}

export interface TypeBreakdown {
  type: SiteType
  count: number
  byDamage: Record<DamageLevel, number>
  documentedEstimateTotal: number // sum of known amounts only
  estimatesWithAmount: number
  estimatesUnknown: number
}

export function breakdownByType(assessments: Assessment[]): TypeBreakdown[] {
  const types: SiteType[] = ['home', 'infrastructure', 'natural-resource']
  return types.map((type) => {
    const items = assessments.filter((a) => a.type === type)
    const byDamage: Record<DamageLevel, number> = {
      unknown: 0,
      'no-visible': 0,
      affected: 0,
      minor: 0,
      major: 0,
      destroyed: 0,
    }
    let documentedEstimateTotal = 0
    let estimatesWithAmount = 0
    let estimatesUnknown = 0
    items.forEach((a) => {
      byDamage[a.damage] += 1
      if (a.repairEstimate) {
        if (a.repairEstimate.amount != null) {
          documentedEstimateTotal += a.repairEstimate.amount
          estimatesWithAmount += 1
        } else {
          estimatesUnknown += 1
        }
      }
    })
    return {
      type,
      count: items.length,
      byDamage,
      documentedEstimateTotal,
      estimatesWithAmount,
      estimatesUnknown,
    }
  })
}

// Records with missing documentation (for the report's gaps section).
export function missingDocumentation(assessments: Assessment[]): {
  assessment: Assessment
  gaps: string[]
}[] {
  const out: { assessment: Assessment; gaps: string[] }[] = []
  assessments.forEach((a) => {
    const gaps: string[] = []
    if (!a.inspectionDate) gaps.push('inspection date')
    if (!a.assessorName) gaps.push('assessor name')
    if (!a.organization) gaps.push('organization')
    if (a.damage === 'unknown') gaps.push('damage observation')
    if (a.photos.length === 0) gaps.push('photos')
    if (gaps.length > 0) out.push({ assessment: a, gaps })
  })
  return out
}

export function reviewedCounts(assessments: Assessment[]): {
  reviewed: number
  unreviewed: number
} {
  const reviewed = assessments.filter((a) => a.status === 'reviewed').length
  return { reviewed, unreviewed: assessments.length - reviewed }
}
