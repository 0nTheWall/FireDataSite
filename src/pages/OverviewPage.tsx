// Overview: summary cards, add-assessment button, "what needs attention",
// a mini map, recent activity, and incident info.

import { useNavigate } from 'react-router-dom'
import { useData } from '../store/DataContext'
import { Card, Button } from '../components/ui'
import { IncidentMap } from '../components/IncidentMap'
import { PriorityBadge, StatusBadge, DemoBadge } from '../components/Badges'
import { needsAttention, summarize } from '../lib/stats'
import { formatDate, formatDateTime } from '../lib/labels'

function SummaryCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: number
  tone: 'neutral' | 'warn' | 'urgent' | 'ok'
  icon: string
}) {
  const toneClass = {
    neutral: 'text-slate-900',
    warn: 'text-warn-700',
    urgent: 'text-urgent-700',
    ok: 'text-forest-800',
  }[tone]
  return (
    <Card className="flex items-center gap-4">
      <span aria-hidden="true" className="text-3xl">
        {icon}
      </span>
      <div>
        <p className={`text-3xl font-bold ${toneClass}`}>{value}</p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
    </Card>
  )
}

export function OverviewPage() {
  const navigate = useNavigate()
  const { selectedIncident, incidentAssessments, usingDemoData } = useData()

  if (!selectedIncident) {
    return <p className="text-slate-600">Select an incident to begin.</p>
  }

  const stats = summarize(incidentAssessments)
  const attention = needsAttention(incidentAssessments).slice(0, 6)
  const recent = [...incidentAssessments]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
          <p className="mt-1 flex items-center gap-2 text-slate-600">
            {selectedIncident.name}
            {usingDemoData && <DemoBadge />}
          </p>
        </div>
        <Button
          icon="＋"
          onClick={() => navigate('/assessments/new')}
          aria-label="Add assessment"
        >
          Add assessment
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Total sites" value={stats.total} tone="neutral" icon="📍" />
        <SummaryCard
          label="Needs inspection"
          value={stats.needsInspection}
          tone="urgent"
          icon="🔎"
        />
        <SummaryCard
          label="Needs review"
          value={stats.needsReview}
          tone="warn"
          icon="📝"
        />
        <SummaryCard label="Reviewed" value={stats.reviewed} tone="ok" icon="✅" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* What needs attention */}
        <Card as="section">
          <h2 className="mb-3 text-lg font-bold text-slate-900">
            What needs attention
          </h2>
          {attention.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nothing outstanding — all sites are reviewed.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {attention.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => navigate(`/assessments/${a.id}`)}
                    className="flex w-full flex-col gap-1.5 rounded-xl border border-slate-200 p-3 text-left hover:border-forest-600 hover:bg-forest-50"
                  >
                    <span className="font-semibold text-slate-900">{a.siteName}</span>
                    <span className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={a.status} />
                      <PriorityBadge priority={a.priority} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Mini map */}
        <Card as="section" className="flex flex-col">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Site map</h2>
          <div className="h-72 overflow-hidden rounded-xl">
            <IncidentMap
              incident={selectedIncident}
              assessments={incidentAssessments}
              onSelect={(id) => navigate(`/assessments/${id}`)}
            />
          </div>
          <Button
            variant="secondary"
            className="mt-3 self-start"
            icon="🗺️"
            onClick={() => navigate('/map')}
          >
            Open full map
          </Button>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent activity */}
        <Card as="section">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Recent activity</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {recent.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <button
                    onClick={() => navigate(`/assessments/${a.id}`)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate font-medium text-slate-900">{a.siteName}</p>
                    <p className="text-xs text-slate-500">
                      Updated {formatDateTime(a.updatedAt)}
                    </p>
                  </button>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Incident info */}
        <Card as="section">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Incident info</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-slate-500">County</dt>
              <dd className="font-semibold text-slate-900">
                {selectedIncident.county}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Acres burned</dt>
              <dd className="font-semibold text-slate-900">
                {selectedIncident.acresBurned != null
                  ? Math.round(selectedIncident.acresBurned).toLocaleString()
                  : 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Discovered</dt>
              <dd className="font-semibold text-slate-900">
                {formatDate(selectedIncident.discoveredDate)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Controlled</dt>
              <dd className="font-semibold text-slate-900">
                {formatDate(selectedIncident.controlDate)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Fire out</dt>
              <dd className="font-semibold text-slate-900">
                {formatDate(selectedIncident.fireOutDate)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Source</dt>
              <dd className="font-semibold text-slate-900">
                {selectedIncident.source}
              </dd>
            </div>
          </dl>
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            Incident point is an approximate origin location from WA DNR. This
            app does not show a fire perimeter or burn area and does not imply any
            location is safe.
          </p>
        </Card>
      </div>
    </div>
  )
}
