// Assessment detail: full record, reviewer workflow (approve / return with
// comment), status + timestamp history, and photo gallery.

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../store/DataContext'
import { Button, Card, inputClass } from '../components/ui'
import {
  DamageBadge,
  PriorityBadge,
  SourceBadge,
  StatusBadge,
  TypeBadge,
} from '../components/Badges'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  statusLabel,
} from '../lib/labels'

export function AssessmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAssessment, setStatus, removeAssessment, selectedIncident } = useData()
  const [reviewer, setReviewer] = useState('')
  const [comment, setComment] = useState('')

  const a = id ? getAssessment(id) : undefined

  if (!a) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-slate-600">Assessment not found.</p>
        <Button variant="secondary" onClick={() => navigate('/assessments')}>
          Back to assessments
        </Button>
      </div>
    )
  }

  const isResidentUnverified = a.reportSource === 'resident' && a.status !== 'reviewed'

  const submitForReview = () =>
    setStatus(a.id, 'needs-review', { by: a.assessorName || 'Field team' })

  const approve = () =>
    setStatus(a.id, 'reviewed', {
      by: reviewer.trim() || 'Reviewer',
      comment: comment.trim() || 'Approved.',
    })

  const returnToDraft = () =>
    setStatus(a.id, 'draft', {
      by: reviewer.trim() || 'Reviewer',
      comment: comment.trim() || 'Returned for revisions.',
    })

  const markInspected = () =>
    setStatus(a.id, 'draft', { by: a.assessorName || 'Field team' })

  const handleDelete = async () => {
    if (window.confirm('Delete this assessment? This cannot be undone.')) {
      await removeAssessment(a.id)
      navigate('/assessments')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-slate-500">{a.id}</p>
          <h1 className="text-2xl font-bold text-slate-900">{a.siteName}</h1>
          <p className="text-slate-600">{a.address}</p>
          <p className="mt-1 text-xs text-slate-500">
            {selectedIncident?.name} · {a.lat.toFixed(5)}, {a.lon.toFixed(5)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon="✏️" onClick={() => navigate(`/assessments/${a.id}/edit`)}>
            Edit
          </Button>
          <Button variant="ghost" className="text-urgent-700" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {isResidentUnverified && (
        <div className="rounded-xl bg-warn-100 px-4 py-3 text-sm font-semibold text-warn-700" role="note">
          ⚠ Unverified resident report — treat as unconfirmed until reviewed.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <TypeBadge type={a.type} />
        <StatusBadge status={a.status} />
        <DamageBadge damage={a.damage} />
        <PriorityBadge priority={a.priority} />
        <SourceBadge source={a.reportSource} reviewed={a.status === 'reviewed'} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        {/* Main details */}
        <div className="flex flex-col gap-5">
          <Card>
            <h2 className="mb-3 text-lg font-bold text-slate-900">Details</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Detail label="Assessor" value={a.assessorName || '—'} />
              <Detail label="Organization" value={a.organization || '—'} />
              <Detail label="Inspection date" value={formatDate(a.inspectionDate)} />
              <Detail
                label="Damage (preliminary)"
                value={<DamageBadge damage={a.damage} />}
              />
            </dl>
            <p className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
              Damage reflects a preliminary assessor observation, not an official
              determination.
            </p>
          </Card>

          <Card>
            <h2 className="mb-2 text-lg font-bold text-slate-900">Notes</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {a.notes || 'No notes recorded.'}
            </p>
            <h3 className="mb-1 mt-4 font-semibold text-slate-800">Follow-up</h3>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {a.followUp || 'None.'}
            </p>
          </Card>

          {/* Photos */}
          <Card>
            <h2 className="mb-3 text-lg font-bold text-slate-900">
              Photos ({a.photos.length})
            </h2>
            {a.photos.length === 0 ? (
              <p className="text-sm text-slate-500">No photos attached.</p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {a.photos.map((p) => (
                  <li key={p.id} className="flex flex-col gap-2">
                    <img
                      src={p.dataUrl}
                      alt={p.caption || 'Site photo'}
                      className="h-48 w-full rounded-lg object-cover ring-1 ring-black/5"
                    />
                    <p className="text-sm font-medium text-slate-800">
                      {p.caption || 'No caption'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Taken {formatDate(p.takenDate)}
                      {p.lat != null && p.lon != null
                        ? ` · GPS ${p.lat.toFixed(4)}, ${p.lon.toFixed(4)} (${p.gpsSource ?? 'manual'})`
                        : ' · No GPS'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Repair estimate */}
          <Card>
            <h2 className="mb-2 text-lg font-bold text-slate-900">Repair estimate</h2>
            {a.repairEstimate ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Detail
                  label="Documented amount"
                  value={formatCurrency(a.repairEstimate.amount)}
                />
                <Detail label="Source" value={a.repairEstimate.source} />
                <Detail label="Date" value={formatDate(a.repairEstimate.date)} />
                {a.repairEstimate.notes && (
                  <Detail label="Notes" value={a.repairEstimate.notes} />
                )}
              </dl>
            ) : (
              <p className="text-sm text-slate-500">
                No estimate documented. Cost is Unknown (not $0).
              </p>
            )}
          </Card>
        </div>

        {/* Sidebar: workflow + history */}
        <div className="flex flex-col gap-5">
          <Card>
            <h2 className="mb-3 text-lg font-bold text-slate-900">Workflow</h2>
            <p className="mb-3 text-sm text-slate-600">
              Current status: <strong>{statusLabel[a.status]}</strong>
            </p>

            {a.status === 'needs-inspection' && (
              <Button icon="🔎" className="w-full" onClick={markInspected}>
                Mark inspected (start draft)
              </Button>
            )}

            {a.status === 'draft' && (
              <Button icon="📤" className="w-full" onClick={submitForReview}>
                Submit for review
              </Button>
            )}

            {a.status === 'needs-review' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label htmlFor="reviewer" className="mb-1 block text-sm font-semibold text-slate-800">
                    Reviewer name
                  </label>
                  <input
                    id="reviewer"
                    className={inputClass}
                    value={reviewer}
                    onChange={(e) => setReviewer(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="comment" className="mb-1 block text-sm font-semibold text-slate-800">
                    Review comment
                  </label>
                  <textarea
                    id="comment"
                    rows={3}
                    className={inputClass}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Required when returning a record."
                  />
                </div>
                <Button icon="✅" className="w-full" onClick={approve}>
                  Approve (mark reviewed)
                </Button>
                <Button
                  variant="secondary"
                  icon="↩️"
                  className="w-full"
                  onClick={returnToDraft}
                >
                  Return to draft
                </Button>
              </div>
            )}

            {a.status === 'reviewed' && (
              <div className="rounded-xl bg-forest-50 p-3 text-sm text-forest-800">
                <p className="font-semibold">✓ Reviewed</p>
                {a.reviewedBy && <p>By {a.reviewedBy}</p>}
                {a.reviewComment && <p className="mt-1 italic">"{a.reviewComment}"</p>}
                <Button
                  variant="ghost"
                  className="mt-2 w-full"
                  onClick={() =>
                    setStatus(a.id, 'needs-review', { by: 'Reopened' })
                  }
                >
                  Reopen for review
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-bold text-slate-900">Status history</h2>
            <ol className="flex flex-col gap-3">
              {a.statusHistory.map((h, i) => (
                <li key={i} className="border-l-2 border-slate-200 pl-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {statusLabel[h.status]}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(h.at)}
                    {h.by ? ` · ${h.by}` : ''}
                  </p>
                  {h.comment && (
                    <p className="mt-0.5 text-xs italic text-slate-600">"{h.comment}"</p>
                  )}
                </li>
              ))}
            </ol>
            <p className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-400">
              Created {formatDateTime(a.createdAt)} · Updated {formatDateTime(a.updatedAt)}
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">{value}</dd>
    </div>
  )
}
