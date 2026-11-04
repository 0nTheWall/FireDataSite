// 3-step assessment form: Location → Observations & evidence → Review & save.
// Supports saving as draft, highlights missing info, and persists to IndexedDB.

import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useData } from '../store/DataContext'
import { Button, Card, Field, inputClass } from '../components/ui'
import {
  DAMAGE_ORDER,
  damageLabel,
  priorityLabel,
  reportSourceLabel,
  siteTypeLabel,
} from '../lib/labels'
import type {
  Assessment,
  DamageLevel,
  Photo,
  Priority,
  ReportSource,
  SiteType,
} from '../types'
import { fileToDataUrl, getCurrentPosition } from '../lib/photos'
import { uid } from '../lib/ids'

const siteTypes: SiteType[] = ['home', 'infrastructure', 'natural-resource']
const priorities: Priority[] = ['low', 'medium', 'high', 'urgent']
const sources: ReportSource[] = ['official', 'resident']

interface FormState {
  siteName: string
  address: string
  lat: string
  lon: string
  type: SiteType
  assessorName: string
  organization: string
  inspectionDate: string
  damage: DamageLevel
  priority: Priority
  reportSource: ReportSource
  notes: string
  followUp: string
  photos: Photo[]
  estimateAmount: string
  estimateSource: string
  estimateDate: string
  estimateNotes: string
}

const steps = ['Location', 'Observations & evidence', 'Review & save'] as const

export function AssessmentFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { selectedIncident, getAssessment, createAssessment, saveAssessment } = useData()

  const editing = id ? getAssessment(id) : undefined

  const [step, setStep] = useState(0)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(() => initForm(editing, searchParams))

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const missing = useMemo(() => computeMissing(form), [form])

  if (!selectedIncident) {
    return <p className="text-slate-600">Select an incident first.</p>
  }

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setPhotoError(null)
    try {
      const added: Photo[] = []
      for (const file of Array.from(files)) {
        const dataUrl = await fileToDataUrl(file)
        added.push({
          id: uid('ph-'),
          dataUrl,
          caption: '',
          takenDate: new Date().toISOString().slice(0, 10),
        })
      }
      update('photos', [...form.photos, ...added])
    } catch {
      setPhotoError('Could not read one or more images.')
    }
  }

  const updatePhoto = (pid: string, patch: Partial<Photo>) =>
    update(
      'photos',
      form.photos.map((p) => (p.id === pid ? { ...p, ...patch } : p)),
    )

  const removePhoto = (pid: string) =>
    update('photos', form.photos.filter((p) => p.id !== pid))

  const capturePhotoGps = async (pid: string) => {
    try {
      const pos = await getCurrentPosition()
      updatePhoto(pid, { lat: pos.lat, lon: pos.lon, gpsSource: 'device' })
    } catch {
      setPhotoError('Device GPS unavailable — enter coordinates manually.')
    }
  }

  const useMyLocation = async () => {
    try {
      const pos = await getCurrentPosition()
      update('lat', pos.lat.toFixed(6))
      update('lon', pos.lon.toFixed(6))
    } catch {
      setPhotoError('Device GPS unavailable — enter coordinates manually.')
    }
  }

  const buildRecord = (status: Assessment['status']): Assessment | null => {
    const lat = parseFloat(form.lat)
    const lon = parseFloat(form.lon)
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null
    const base = {
      incidentId: selectedIncident.id,
      siteName: form.siteName.trim() || 'Untitled site',
      address: form.address.trim(),
      lat,
      lon,
      type: form.type,
      assessorName: form.assessorName.trim(),
      organization: form.organization.trim(),
      inspectionDate: form.inspectionDate || undefined,
      status,
      damage: form.damage,
      notes: form.notes.trim(),
      followUp: form.followUp.trim(),
      priority: form.priority,
      reportSource: form.reportSource,
      photos: form.photos,
      repairEstimate:
        form.estimateSource.trim() || form.estimateAmount.trim()
          ? {
              amount:
                form.estimateAmount.trim() === ''
                  ? undefined
                  : Number(form.estimateAmount),
              source: form.estimateSource.trim() || 'Unspecified',
              date: form.estimateDate || new Date().toISOString().slice(0, 10),
              notes: form.estimateNotes.trim() || undefined,
            }
          : undefined,
      isDemo: editing?.isDemo ?? false,
    }
    return base as unknown as Assessment
  }

  const save = async (status: Assessment['status']) => {
    const record = buildRecord(status)
    if (!record) {
      setStep(0)
      setPhotoError('Valid coordinates are required to save.')
      return
    }
    if (editing) {
      await saveAssessment({
        ...editing,
        ...record,
        id: editing.id,
        statusHistory:
          editing.status === status
            ? editing.statusHistory
            : [
                ...editing.statusHistory,
                { status, at: new Date().toISOString(), by: record.assessorName || 'Field team' },
              ],
      })
      navigate(`/assessments/${editing.id}`)
    } else {
      const created = await createAssessment(record)
      navigate(`/assessments/${created.id}`)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {editing ? 'Edit assessment' : 'Add assessment'}
        </h1>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-2" aria-label="Form steps">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => setStep(i)}
              className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold ${
                i === step
                  ? 'border-forest-600 bg-forest-50 text-forest-800'
                  : 'border-slate-200 text-slate-600'
              }`}
              aria-current={i === step ? 'step' : undefined}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i === step ? 'bg-forest-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      {photoError && (
        <div className="rounded-xl bg-warn-100 px-4 py-3 text-sm text-warn-700" role="alert">
          {photoError}
        </div>
      )}

      {/* Step 1: Location */}
      {step === 0 && (
        <Card className="flex flex-col gap-4">
          <Field label="Site name" htmlFor="siteName" required missing={missing.siteName}>
            <input
              id="siteName"
              className={inputClass}
              value={form.siteName}
              onChange={(e) => update('siteName', e.target.value)}
            />
          </Field>
          <Field label="Address / location description" htmlFor="address">
            <input
              id="address"
              className={inputClass}
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Latitude" htmlFor="lat" required missing={missing.coords}>
              <input
                id="lat"
                inputMode="decimal"
                className={inputClass}
                value={form.lat}
                onChange={(e) => update('lat', e.target.value)}
                placeholder="47.5962"
              />
            </Field>
            <Field label="Longitude" htmlFor="lon" required missing={missing.coords}>
              <input
                id="lon"
                inputMode="decimal"
                className={inputClass}
                value={form.lon}
                onChange={(e) => update('lon', e.target.value)}
                placeholder="-120.6615"
              />
            </Field>
          </div>
          <Button variant="secondary" icon="📍" onClick={useMyLocation} type="button">
            Use my current location
          </Button>
          <Field label="Site type" htmlFor="type" required>
            <select
              id="type"
              className={inputClass}
              value={form.type}
              onChange={(e) => update('type', e.target.value as SiteType)}
            >
              {siteTypes.map((t) => (
                <option key={t} value={t}>
                  {siteTypeLabel[t]}
                </option>
              ))}
            </select>
          </Field>
        </Card>
      )}

      {/* Step 2: Observations & evidence */}
      {step === 1 && (
        <Card className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Assessor name" htmlFor="assessor" missing={missing.assessor}>
              <input
                id="assessor"
                className={inputClass}
                value={form.assessorName}
                onChange={(e) => update('assessorName', e.target.value)}
              />
            </Field>
            <Field label="Organization" htmlFor="org" missing={missing.org}>
              <input
                id="org"
                className={inputClass}
                value={form.organization}
                onChange={(e) => update('organization', e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Inspection date" htmlFor="inspDate" missing={missing.inspection}>
              <input
                id="inspDate"
                type="date"
                className={inputClass}
                value={form.inspectionDate}
                onChange={(e) => update('inspectionDate', e.target.value)}
              />
            </Field>
            <Field label="Report source" htmlFor="source">
              <select
                id="source"
                className={inputClass}
                value={form.reportSource}
                onChange={(e) => update('reportSource', e.target.value as ReportSource)}
              >
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {reportSourceLabel[s]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Damage (preliminary observation)"
              htmlFor="damage"
              hint="Preliminary assessor observation only — not an official determination."
            >
              <select
                id="damage"
                className={inputClass}
                value={form.damage}
                onChange={(e) => update('damage', e.target.value as DamageLevel)}
              >
                {DAMAGE_ORDER.map((d) => (
                  <option key={d} value={d}>
                    {damageLabel[d]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority" htmlFor="priority">
              <select
                id="priority"
                className={inputClass}
                value={form.priority}
                onChange={(e) => update('priority', e.target.value as Priority)}
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {priorityLabel[p]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Notes" htmlFor="notes">
            <textarea
              id="notes"
              rows={3}
              className={inputClass}
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
            />
          </Field>
          <Field label="Follow-up needed" htmlFor="followUp">
            <textarea
              id="followUp"
              rows={2}
              className={inputClass}
              value={form.followUp}
              onChange={(e) => update('followUp', e.target.value)}
            />
          </Field>

          {/* Photos */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Photos</p>
              <label className="cursor-pointer rounded-xl bg-forest-600 px-3 py-2 text-sm font-semibold text-white hover:bg-forest-700">
                ＋ Add photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => handlePhotoFiles(e.target.files)}
                />
              </label>
            </div>
            {form.photos.length === 0 ? (
              <p className="text-xs text-slate-500">No photos yet.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {form.photos.map((p) => (
                  <li key={p.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-2">
                    <img
                      src={p.dataUrl}
                      alt={p.caption || 'Site photo preview'}
                      className="h-32 w-full rounded-md object-cover"
                    />
                    <input
                      className={inputClass}
                      placeholder="Caption"
                      value={p.caption}
                      onChange={(e) => updatePhoto(p.id, { caption: e.target.value })}
                      aria-label="Photo caption"
                    />
                    <input
                      type="date"
                      className={inputClass}
                      value={p.takenDate}
                      onChange={(e) => updatePhoto(p.id, { takenDate: e.target.value })}
                      aria-label="Photo date"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className={inputClass}
                        placeholder="GPS lat"
                        inputMode="decimal"
                        value={p.lat ?? ''}
                        onChange={(e) =>
                          updatePhoto(p.id, {
                            lat: e.target.value === '' ? undefined : Number(e.target.value),
                            gpsSource: 'manual',
                          })
                        }
                        aria-label="Photo GPS latitude"
                      />
                      <input
                        className={inputClass}
                        placeholder="GPS lon"
                        inputMode="decimal"
                        value={p.lon ?? ''}
                        onChange={(e) =>
                          updatePhoto(p.id, {
                            lon: e.target.value === '' ? undefined : Number(e.target.value),
                            gpsSource: 'manual',
                          })
                        }
                        aria-label="Photo GPS longitude"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1 !py-1.5 !text-sm"
                        type="button"
                        onClick={() => capturePhotoGps(p.id)}
                      >
                        📍 Device GPS
                      </Button>
                      <Button
                        variant="ghost"
                        className="!py-1.5 !text-sm text-urgent-700"
                        type="button"
                        onClick={() => removePhoto(p.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Repair estimate (optional) */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-800">
              Repair estimate (optional)
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Amount (USD)"
                htmlFor="estAmount"
                hint="Leave blank if unknown — unknown is never recorded as $0."
              >
                <input
                  id="estAmount"
                  inputMode="numeric"
                  className={inputClass}
                  value={form.estimateAmount}
                  onChange={(e) => update('estimateAmount', e.target.value)}
                  placeholder="Unknown"
                />
              </Field>
              <Field label="Source" htmlFor="estSource">
                <input
                  id="estSource"
                  className={inputClass}
                  value={form.estimateSource}
                  onChange={(e) => update('estimateSource', e.target.value)}
                  placeholder="e.g. Contractor bid"
                />
              </Field>
            </div>
            <Field label="Estimate date" htmlFor="estDate">
              <input
                id="estDate"
                type="date"
                className={inputClass}
                value={form.estimateDate}
                onChange={(e) => update('estimateDate', e.target.value)}
              />
            </Field>
          </div>
        </Card>
      )}

      {/* Step 3: Review & save */}
      {step === 2 && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-900">Review</h2>
          {Object.values(missing).some(Boolean) && (
            <div className="rounded-xl bg-warn-100 px-4 py-3 text-sm text-warn-700">
              <p className="font-semibold">Some information is still missing:</p>
              <ul className="mt-1 list-inside list-disc">
                {missing.siteName && <li>Site name</li>}
                {missing.coords && <li>Coordinates</li>}
                {missing.assessor && <li>Assessor name</li>}
                {missing.org && <li>Organization</li>}
                {missing.inspection && <li>Inspection date</li>}
              </ul>
              <p className="mt-1">You can still save as a draft and complete it later.</p>
            </div>
          )}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Review label="Site name" value={form.siteName} />
            <Review label="Type" value={siteTypeLabel[form.type]} />
            <Review label="Address" value={form.address} />
            <Review label="Coordinates" value={`${form.lat}, ${form.lon}`} />
            <Review label="Assessor" value={form.assessorName} />
            <Review label="Organization" value={form.organization} />
            <Review label="Inspection date" value={form.inspectionDate} />
            <Review label="Damage (preliminary)" value={damageLabel[form.damage]} />
            <Review label="Priority" value={priorityLabel[form.priority]} />
            <Review label="Report source" value={reportSourceLabel[form.reportSource]} />
            <Review label="Photos" value={String(form.photos.length)} />
            <Review
              label="Estimate"
              value={
                form.estimateAmount
                  ? `$${form.estimateAmount} (${form.estimateSource || 'source unspecified'})`
                  : form.estimateSource
                    ? `Unknown amount (${form.estimateSource})`
                    : 'None'
              }
            />
          </dl>
          <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
            <Button variant="secondary" icon="💾" onClick={() => save('draft')}>
              Save as draft
            </Button>
            <Button icon="📤" onClick={() => save('needs-review')}>
              Save &amp; submit for review
            </Button>
          </div>
        </Card>
      )}

      {/* Step navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          ‹ Back
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
            Next ›
          </Button>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">{value || '—'}</dd>
    </>
  )
}

function initForm(
  editing: Assessment | undefined,
  searchParams: URLSearchParams,
): FormState {
  if (editing) {
    return {
      siteName: editing.siteName,
      address: editing.address,
      lat: String(editing.lat),
      lon: String(editing.lon),
      type: editing.type,
      assessorName: editing.assessorName,
      organization: editing.organization,
      inspectionDate: editing.inspectionDate ?? '',
      damage: editing.damage,
      priority: editing.priority,
      reportSource: editing.reportSource,
      notes: editing.notes,
      followUp: editing.followUp,
      photos: editing.photos,
      estimateAmount:
        editing.repairEstimate?.amount != null
          ? String(editing.repairEstimate.amount)
          : '',
      estimateSource: editing.repairEstimate?.source ?? '',
      estimateDate: editing.repairEstimate?.date ?? '',
      estimateNotes: editing.repairEstimate?.notes ?? '',
    }
  }
  return {
    siteName: '',
    address: '',
    lat: searchParams.get('lat') ?? '',
    lon: searchParams.get('lon') ?? '',
    type: 'home',
    assessorName: '',
    organization: '',
    inspectionDate: '',
    damage: 'unknown',
    priority: 'medium',
    reportSource: 'official',
    notes: '',
    followUp: '',
    photos: [],
    estimateAmount: '',
    estimateSource: '',
    estimateDate: '',
    estimateNotes: '',
  }
}

function computeMissing(form: FormState) {
  return {
    siteName: form.siteName.trim() === '',
    coords: Number.isNaN(parseFloat(form.lat)) || Number.isNaN(parseFloat(form.lon)),
    assessor: form.assessorName.trim() === '',
    org: form.organization.trim() === '',
    inspection: form.inspectionDate === '',
  }
}
