// Map page: incident + site toggles, search, filters, legend, detail panel,
// and click-to-add-assessment. No burn radius / perimeter is drawn.

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../store/DataContext'
import { IncidentMap } from '../components/IncidentMap'
import { Button, Card, inputClass } from '../components/ui'
import {
  DamageBadge,
  PriorityBadge,
  SourceBadge,
  StatusBadge,
  TypeBadge,
} from '../components/Badges'
import {
  DAMAGE_ORDER,
  STATUS_ORDER,
  damageLabel,
  formatDate,
  siteTypeIcon,
  siteTypeLabel,
  statusLabel,
} from '../lib/labels'
import type { DamageLevel, SiteType, AssessmentStatus } from '../types'

const siteTypes: SiteType[] = ['home', 'infrastructure', 'natural-resource']

export function MapPage() {
  const navigate = useNavigate()
  const { selectedIncident, incidentAssessments } = useData()

  const [showIncident, setShowIncident] = useState(true)
  const [showSites, setShowSites] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<SiteType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | 'all'>('all')
  const [damageFilter, setDamageFilter] = useState<DamageLevel | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pendingCoord, setPendingCoord] = useState<{ lat: number; lon: number } | null>(
    null,
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return incidentAssessments.filter((a) => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (damageFilter !== 'all' && a.damage !== damageFilter) return false
      if (q && !`${a.siteName} ${a.address}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [incidentAssessments, search, typeFilter, statusFilter, damageFilter])

  const selected = filtered.find((a) => a.id === selectedId) ?? null

  if (!selectedIncident) {
    return <p className="text-slate-600">Select an incident to view the map.</p>
  }

  const addHere = () => {
    if (!pendingCoord) return
    navigate(
      `/assessments/new?lat=${pendingCoord.lat.toFixed(6)}&lon=${pendingCoord.lon.toFixed(6)}`,
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-slate-900">Map</h1>

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        {/* Map + controls */}
        <div className="flex flex-col gap-3">
          {/* Controls */}
          <Card className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={showIncident}
                  onChange={(e) => setShowIncident(e.target.checked)}
                  className="h-4 w-4 accent-urgent-600"
                />
                🔥 Incident point
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={showSites}
                  onChange={(e) => setShowSites(e.target.checked)}
                  className="h-4 w-4 accent-forest-600"
                />
                📍 Assessment sites
              </label>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label htmlFor="map-search" className="sr-only">
                  Search sites
                </label>
                <input
                  id="map-search"
                  type="search"
                  placeholder="Search site name or address"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="f-type" className="sr-only">
                    Filter by type
                  </label>
                  <select
                    id="f-type"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as SiteType | 'all')}
                    className={inputClass}
                  >
                    <option value="all">All types</option>
                    {siteTypes.map((t) => (
                      <option key={t} value={t}>
                        {siteTypeLabel[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="f-status" className="sr-only">
                    Filter by status
                  </label>
                  <select
                    id="f-status"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as AssessmentStatus | 'all')
                    }
                    className={inputClass}
                  >
                    <option value="all">All statuses</option>
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="f-damage" className="sr-only">
                    Filter by damage
                  </label>
                  <select
                    id="f-damage"
                    value={damageFilter}
                    onChange={(e) =>
                      setDamageFilter(e.target.value as DamageLevel | 'all')
                    }
                    className={inputClass}
                  >
                    <option value="all">All damage</option>
                    {DAMAGE_ORDER.map((d) => (
                      <option key={d} value={d}>
                        {damageLabel[d]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Showing {filtered.length} of {incidentAssessments.length} sites. Click
              the map to add an assessment at that location.
            </p>
          </Card>

          {/* Map */}
          <div className="h-[28rem] overflow-hidden rounded-2xl ring-1 ring-black/5 lg:h-[34rem]">
            <IncidentMap
              incident={selectedIncident}
              assessments={filtered}
              showIncident={showIncident}
              showSites={showSites}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMapClick={(lat, lon) => setPendingCoord({ lat, lon })}
            />
          </div>

          {pendingCoord && (
            <Card className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-700">
                Selected location: {pendingCoord.lat.toFixed(5)},{' '}
                {pendingCoord.lon.toFixed(5)}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setPendingCoord(null)}>
                  Clear
                </Button>
                <Button icon="＋" onClick={addHere}>
                  Add assessment here
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right column: legend + detail panel */}
        <div className="flex flex-col gap-4">
          <Card as="section">
            <h2 className="mb-2 text-lg font-bold text-slate-900">Legend</h2>
            <ul className="flex flex-col gap-2 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <span aria-hidden="true">🔥</span> Incident origin point (approx.)
              </li>
              {siteTypes.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span aria-hidden="true">{siteTypeIcon[t]}</span>
                  {siteTypeLabel[t]} site
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
              No fire perimeter or burn radius is shown. Marker positions do not
              imply any area is safe.
            </p>
          </Card>

          <Card as="section">
            <h2 className="mb-2 text-lg font-bold text-slate-900">Site details</h2>
            {!selected ? (
              <p className="text-sm text-slate-500">
                Select a marker to see details here.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    {selected.siteName}
                  </p>
                  <p className="text-sm text-slate-600">{selected.address}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <TypeBadge type={selected.type} />
                  <StatusBadge status={selected.status} />
                  <DamageBadge damage={selected.damage} />
                  <PriorityBadge priority={selected.priority} />
                  <SourceBadge
                    source={selected.reportSource}
                    reviewed={selected.status === 'reviewed'}
                  />
                </div>
                <dl className="text-sm text-slate-700">
                  <div className="flex justify-between py-1">
                    <dt className="text-slate-500">Assessor</dt>
                    <dd>{selected.assessorName || '—'}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-slate-500">Inspection date</dt>
                    <dd>{formatDate(selected.inspectionDate)}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-slate-500">Photos</dt>
                    <dd>{selected.photos.length}</dd>
                  </div>
                </dl>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/assessments/${selected.id}`)}
                >
                  Open full record
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
