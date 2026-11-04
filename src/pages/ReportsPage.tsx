// Reports: incident details, coverage, outstanding inspections, damage by
// type (separate sections), reviewed vs unreviewed, documented estimates,
// missing documentation, photo references, follow-ups. CSV export, print
// (Save as PDF), and a deterministic AI-free narrative.

import { useMemo } from 'react'
import { useData } from '../store/DataContext'
import { Button } from '../components/ui'
import {
  DISCLAIMER,
  damageLabel,
  formatCurrency,
  formatDate,
  siteTypeLabel,
  statusLabel,
} from '../lib/labels'
import {
  breakdownByType,
  missingDocumentation,
  needsAttention,
  reviewedCounts,
  summarize,
} from '../lib/stats'
import { buildCsv, buildNarrative, downloadText } from '../lib/report'
import type { DamageLevel } from '../types'

export function ReportsPage() {
  const { selectedIncident, incidentAssessments, usingDemoData } = useData()

  const data = useMemo(() => {
    if (!selectedIncident) return null
    return {
      summary: summarize(incidentAssessments),
      reviewed: reviewedCounts(incidentAssessments),
      breakdown: breakdownByType(incidentAssessments),
      gaps: missingDocumentation(incidentAssessments),
      outstanding: incidentAssessments.filter((a) => a.status === 'needs-inspection'),
      followUps: incidentAssessments.filter((a) => a.followUp.trim() !== ''),
      withPhotos: incidentAssessments.filter((a) => a.photos.length > 0),
      withEstimates: incidentAssessments.filter((a) => a.repairEstimate),
      attention: needsAttention(incidentAssessments),
      narrative: buildNarrative(selectedIncident, incidentAssessments),
    }
  }, [selectedIncident, incidentAssessments])

  if (!selectedIncident || !data) {
    return <p className="text-slate-600">Select an incident to generate a report.</p>
  }

  const total = data.summary.total
  const coverage =
    total === 0
      ? 0
      : Math.round(((total - data.outstanding.length) / total) * 100)

  const exportCsv = () => {
    const csv = buildCsv(selectedIncident, incidentAssessments)
    const safeName = selectedIncident.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()
    downloadText(`afterfire_${safeName}.csv`, csv, 'text/csv')
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Action bar (hidden in print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Recovery report</h1>
        <div className="flex gap-2">
          <Button variant="secondary" icon="⬇️" onClick={exportCsv}>
            Export CSV
          </Button>
          <Button icon="🖨️" onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Printable page */}
      <div className="print-page flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <header className="border-b border-slate-200 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-forest-700">
                AfterFire — Draft recovery report
              </p>
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedIncident.name}
              </h2>
            </div>
            {usingDemoData && (
              <span className="rounded-full border border-forest-600 bg-forest-50 px-3 py-1 text-sm font-semibold text-forest-800">
                🧪 Demo data
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Generated {formatDate(new Date().toISOString())}
          </p>
          <div className="mt-3 rounded-xl bg-warn-50 p-3 text-sm font-medium text-warn-700">
            {DISCLAIMER}
          </div>
        </header>

        {/* Incident details */}
        <Section title="Incident details">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <KV k="County" v={selectedIncident.county} />
            <KV
              k="Acres burned"
              v={
                selectedIncident.acresBurned != null
                  ? Math.round(selectedIncident.acresBurned).toLocaleString()
                  : 'Unknown'
              }
            />
            <KV k="Source" v={selectedIncident.source} />
            <KV k="Discovered" v={formatDate(selectedIncident.discoveredDate)} />
            <KV k="Controlled" v={formatDate(selectedIncident.controlDate)} />
            <KV k="Fire out" v={formatDate(selectedIncident.fireOutDate)} />
          </dl>
        </Section>

        {/* Narrative */}
        <Section title="Summary (auto-generated, no AI)">
          <div className="flex flex-col gap-3 text-sm leading-relaxed text-slate-700">
            {data.narrative.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </Section>

        {/* Coverage + reviewed */}
        <Section title="Coverage & review status">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Total sites" value={total} />
            <Stat label="Inspection coverage" value={`${coverage}%`} />
            <Stat label="Reviewed" value={data.reviewed.reviewed} />
            <Stat label="Unreviewed" value={data.reviewed.unreviewed} />
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {data.outstanding.length} site(s) still need inspection;{' '}
            {data.summary.needsReview} awaiting review.
          </p>
        </Section>

        {/* Outstanding inspections */}
        <Section title="Outstanding inspections">
          {data.outstanding.length === 0 ? (
            <p className="text-sm text-slate-500">All sites have been inspected.</p>
          ) : (
            <ul className="list-inside list-disc text-sm text-slate-700">
              {data.outstanding.map((a) => (
                <li key={a.id}>
                  {a.siteName} — {a.address} ({a.id})
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Damage by type — separate sections */}
        <Section title="Damage by category (preliminary observations)">
          <div className="flex flex-col gap-4">
            {data.breakdown.map((b) => (
              <div key={b.type} className="print-break rounded-xl border border-slate-200 p-4">
                <h4 className="mb-2 font-bold text-slate-900">
                  {siteTypeLabel[b.type]} — {b.count} site(s)
                </h4>
                {b.count === 0 ? (
                  <p className="text-sm text-slate-500">No sites recorded.</p>
                ) : (
                  <>
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-xs uppercase text-slate-500">
                          <th className="py-1">Damage (preliminary)</th>
                          <th className="py-1">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Object.keys(b.byDamage) as DamageLevel[])
                          .filter((d) => b.byDamage[d] > 0)
                          .map((d) => (
                            <tr key={d} className="border-t border-slate-100">
                              <td className="py-1">{damageLabel[d]}</td>
                              <td className="py-1">{b.byDamage[d]}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    <p className="mt-2 text-sm text-slate-700">
                      Documented estimates:{' '}
                      <strong>{formatCurrency(b.documentedEstimateTotal || undefined)}</strong>{' '}
                      across {b.estimatesWithAmount} record(s).
                      {b.estimatesUnknown > 0 &&
                        ` ${b.estimatesUnknown} record(s) have an Unknown amount.`}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Categories: household (home), infrastructure, and environmental
            (natural resource). All figures are documented estimates — Unknown
            costs are shown as Unknown, never $0.
          </p>
        </Section>

        {/* Documented estimates */}
        <Section title="Documented estimates with sources">
          {data.withEstimates.length === 0 ? (
            <p className="text-sm text-slate-500">No estimates documented yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500">
                  <th className="py-1">Site</th>
                  <th className="py-1">Amount</th>
                  <th className="py-1">Source</th>
                  <th className="py-1">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.withEstimates.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="py-1">{a.siteName}</td>
                    <td className="py-1">{formatCurrency(a.repairEstimate!.amount)}</td>
                    <td className="py-1">{a.repairEstimate!.source}</td>
                    <td className="py-1">{formatDate(a.repairEstimate!.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Missing documentation */}
        <Section title="Missing documentation">
          {data.gaps.length === 0 ? (
            <p className="text-sm text-slate-500">No gaps detected.</p>
          ) : (
            <ul className="list-inside list-disc text-sm text-slate-700">
              {data.gaps.map(({ assessment, gaps }) => (
                <li key={assessment.id}>
                  {assessment.siteName} ({assessment.id}): missing {gaps.join(', ')}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Photo references */}
        <Section title="Photo references">
          {data.withPhotos.length === 0 ? (
            <p className="text-sm text-slate-500">No photos on record.</p>
          ) : (
            <ul className="list-inside list-disc text-sm text-slate-700">
              {data.withPhotos.map((a) => (
                <li key={a.id}>
                  {a.siteName} ({a.id}): {a.photos.length} photo(s) —{' '}
                  {a.photos.map((p) => p.caption || 'untitled').join('; ')}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Follow-ups */}
        <Section title="Follow-ups">
          {data.followUps.length === 0 ? (
            <p className="text-sm text-slate-500">No follow-ups recorded.</p>
          ) : (
            <ul className="list-inside list-disc text-sm text-slate-700">
              {data.followUps.map((a) => (
                <li key={a.id}>
                  <strong>{a.siteName}:</strong> {a.followUp}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500">
          <p>
            Record statuses: {statusLabel['needs-inspection']} → {statusLabel['draft']} →{' '}
            {statusLabel['needs-review']} → {statusLabel['reviewed']}. Form fields are
            structured to later map to FEMA IA/PA intake templates; this app does not
            claim FEMA compliance and does not determine eligibility.
          </p>
        </footer>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="print-break">
      <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
      {children}
    </section>
  )
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-semibold text-slate-900">{v}</dd>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-600">{label}</p>
    </div>
  )
}
