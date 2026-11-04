// Assessments list: searchable table on desktop, cards on mobile.

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../store/DataContext'
import { Button, Card, EmptyState, inputClass } from '../components/ui'
import {
  DamageBadge,
  PriorityBadge,
  SourceBadge,
  StatusBadge,
  TypeBadge,
} from '../components/Badges'
import {
  STATUS_ORDER,
  formatDate,
  siteTypeLabel,
  statusLabel,
} from '../lib/labels'
import type { AssessmentStatus, SiteType } from '../types'

const siteTypes: SiteType[] = ['home', 'infrastructure', 'natural-resource']

export function AssessmentsPage() {
  const navigate = useNavigate()
  const { selectedIncident, incidentAssessments } = useData()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<SiteType | 'all'>('all')

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return incidentAssessments
      .filter((a) => {
        if (statusFilter !== 'all' && a.status !== statusFilter) return false
        if (typeFilter !== 'all' && a.type !== typeFilter) return false
        if (q && !`${a.id} ${a.siteName} ${a.address} ${a.assessorName}`.toLowerCase().includes(q))
          return false
        return true
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [incidentAssessments, search, statusFilter, typeFilter])

  if (!selectedIncident) {
    return <p className="text-slate-600">Select an incident first.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Assessments</h1>
        <Button icon="＋" onClick={() => navigate('/assessments/new')}>
          Add assessment
        </Button>
      </div>

      <Card className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="search" className="mb-1 block text-sm font-semibold text-slate-800">
            Search
          </label>
          <input
            id="search"
            type="search"
            placeholder="ID, site name, address, assessor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="sm:w-48">
          <label htmlFor="status" className="mb-1 block text-sm font-semibold text-slate-800">
            Status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AssessmentStatus | 'all')}
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
        <div className="sm:w-48">
          <label htmlFor="type" className="mb-1 block text-sm font-semibold text-slate-800">
            Type
          </label>
          <select
            id="type"
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
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="No assessments match"
          body="Try adjusting your search or filters, or add a new assessment."
          action={
            <Button icon="＋" onClick={() => navigate('/assessments/new')}>
              Add assessment
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-x-auto p-0 md:block">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Assessment records for {selectedIncident.name}
              </caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-4 py-3">ID</th>
                  <th scope="col" className="px-4 py-3">Site</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Damage</th>
                  <th scope="col" className="px-4 py-3">Priority</th>
                  <th scope="col" className="px-4 py-3">Inspected</th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr
                    key={a.id}
                    className="cursor-pointer border-b border-slate-100 hover:bg-forest-50"
                    onClick={() => navigate(`/assessments/${a.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{a.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{a.siteName}</p>
                      <p className="text-xs text-slate-500">{a.address}</p>
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={a.type} /></td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3"><DamageBadge damage={a.damage} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={a.priority} /></td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatDate(a.inspectionDate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-forest-700" aria-hidden="true">
                        Open ›
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => navigate(`/assessments/${a.id}`)}
                  className="w-full text-left"
                >
                  <Card className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{a.siteName}</p>
                        <p className="text-xs text-slate-500">{a.address}</p>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">{a.id}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <TypeBadge type={a.type} />
                      <StatusBadge status={a.status} />
                      <DamageBadge damage={a.damage} />
                      <SourceBadge
                        source={a.reportSource}
                        reviewed={a.status === 'reviewed'}
                      />
                    </div>
                  </Card>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
