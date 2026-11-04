// Central data store for AfterFire.
// - Loads incidents + assessments from IndexedDB on startup.
// - Fetches real incidents from WA DNR (best-effort; app works offline).
// - Seeds the fictional demo fire + sample sites on first run.
// - Exposes CRUD and reviewer-workflow actions. All writes persist to IndexedDB.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  Assessment,
  AssessmentStatus,
  Incident,
} from '../types'
import * as db from '../services/db'
import { fetchDnrIncidents } from '../services/dnr'
import {
  DEMO_INCIDENT_ID,
  buildDemoAssessments,
  demoIncident,
} from '../services/demoData'
import { newAssessmentId } from '../lib/ids'

interface DataState {
  loading: boolean
  incidents: Incident[]
  assessments: Assessment[]
  selectedIncidentId: string | null
  dnrStatus: 'idle' | 'loading' | 'ok' | 'error'
  dnrError?: string
}

interface DataContextValue extends DataState {
  selectedIncident: Incident | null
  /** Assessments for the selected incident. */
  incidentAssessments: Assessment[]
  usingDemoData: boolean
  selectIncident: (id: string) => void
  refreshDnr: () => Promise<void>
  saveAssessment: (a: Assessment) => Promise<void>
  createAssessment: (
    partial: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'> & {
      statusHistory?: Assessment['statusHistory']
    },
  ) => Promise<Assessment>
  removeAssessment: (id: string) => Promise<void>
  setStatus: (
    id: string,
    status: AssessmentStatus,
    opts?: { by?: string; comment?: string },
  ) => Promise<void>
  resetDemoData: () => Promise<void>
  getAssessment: (id: string) => Assessment | undefined
  getIncident: (id: string) => Incident | undefined
}

const DataContext = createContext<DataContextValue | null>(null)

const SELECTED_KEY = 'selectedIncidentId'
const SEEDED_KEY = 'demoSeeded'

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({
    loading: true,
    incidents: [],
    assessments: [],
    selectedIncidentId: null,
    dnrStatus: 'idle',
  })
  const didInit = useRef(false)

  const persistSelected = useCallback((id: string | null) => {
    void db.setMeta(SELECTED_KEY, id)
  }, [])

  // Initial load.
  // NOTE: guarded by a ref so React 18 StrictMode's double-invoke in dev runs
  // this once. We intentionally do NOT abort on unmount before committing
  // state — doing so (combined with the ref guard) would leave the app stuck
  // on the loading screen. Any failure still clears `loading` via try/catch so
  // the app never hangs.
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    ;(async () => {
      try {
        const [incidents, assessments, seeded, savedSelected] = await Promise.all([
          db.getAllIncidents(),
          db.getAllAssessments(),
          db.getMeta<boolean>(SEEDED_KEY),
          db.getMeta<string>(SELECTED_KEY),
        ])

        let allIncidents = incidents
        let allAssessments = assessments

        // Seed demo data once.
        if (!seeded) {
          const demoAssessments = buildDemoAssessments()
          await db.putIncident(demoIncident)
          await db.putAssessments(demoAssessments)
          await db.setMeta(SEEDED_KEY, true)
          // Avoid duplicating if somehow present.
          if (!allIncidents.find((i) => i.id === demoIncident.id)) {
            allIncidents = [...allIncidents, demoIncident]
          }
          allAssessments = [...allAssessments, ...demoAssessments]
        }

        const selected =
          savedSelected && allIncidents.find((i) => i.id === savedSelected)
            ? savedSelected
            : allIncidents.find((i) => i.id === DEMO_INCIDENT_ID)
              ? DEMO_INCIDENT_ID
              : (allIncidents[0]?.id ?? null)

        setState((s) => ({
          ...s,
          loading: false,
          incidents: allIncidents,
          assessments: allAssessments,
          selectedIncidentId: selected,
        }))
      } catch (err) {
        // IndexedDB unavailable (e.g. private mode) or seeding failed.
        // Fall back to in-memory demo data so the app still works.
        // eslint-disable-next-line no-console
        console.error('AfterFire init failed, using in-memory demo data:', err)
        const demoAssessments = buildDemoAssessments()
        setState((s) => ({
          ...s,
          loading: false,
          incidents: [demoIncident],
          assessments: demoAssessments,
          selectedIncidentId: DEMO_INCIDENT_ID,
        }))
      }

      // Best-effort DNR fetch after initial render.
      void refreshDnrInternal()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshDnrInternal = useCallback(async () => {
    setState((s) => ({ ...s, dnrStatus: 'loading', dnrError: undefined }))
    const result = await fetchDnrIncidents({ minAcres: 500, limit: 150 })
    if (!result.ok) {
      setState((s) => ({ ...s, dnrStatus: 'error', dnrError: result.error }))
      return
    }
    // Persist and merge (demo + any manual incidents kept).
    await db.putIncidents(result.incidents)
    setState((s) => {
      const byId = new Map<string, Incident>()
      s.incidents.forEach((i) => byId.set(i.id, i))
      result.incidents.forEach((i) => byId.set(i.id, i))
      return {
        ...s,
        dnrStatus: 'ok',
        incidents: Array.from(byId.values()),
      }
    })
  }, [])

  const selectIncident = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, selectedIncidentId: id }))
      persistSelected(id)
    },
    [persistSelected],
  )

  const saveAssessment = useCallback(async (a: Assessment) => {
    const updated = { ...a, updatedAt: new Date().toISOString() }
    await db.putAssessment(updated)
    setState((s) => ({
      ...s,
      assessments: s.assessments.some((x) => x.id === updated.id)
        ? s.assessments.map((x) => (x.id === updated.id ? updated : x))
        : [...s.assessments, updated],
    }))
  }, [])

  const createAssessment = useCallback<DataContextValue['createAssessment']>(
    async (partial) => {
      const nowIso = new Date().toISOString()
      let created: Assessment | null = null
      setState((s) => {
        const id = newAssessmentId(s.assessments.map((a) => a.id))
        created = {
          ...partial,
          id,
          createdAt: nowIso,
          updatedAt: nowIso,
          statusHistory:
            partial.statusHistory ?? [
              { status: partial.status, at: nowIso, by: partial.assessorName || 'Field team' },
            ],
        } as Assessment
        return { ...s, assessments: [...s.assessments, created] }
      })
      // created is assigned synchronously inside setState updater.
      if (created) await db.putAssessment(created)
      return created as unknown as Assessment
    },
    [],
  )

  const removeAssessment = useCallback(async (id: string) => {
    await db.deleteAssessment(id)
    setState((s) => ({
      ...s,
      assessments: s.assessments.filter((a) => a.id !== id),
    }))
  }, [])

  const setStatus = useCallback<DataContextValue['setStatus']>(
    async (id, status, opts) => {
      const nowIso = new Date().toISOString()
      let toSave: Assessment | null = null
      setState((s) => {
        const assessments = s.assessments.map((a) => {
          if (a.id !== id) return a
          const entry = {
            status,
            at: nowIso,
            by: opts?.by,
            comment: opts?.comment,
          }
          const updated: Assessment = {
            ...a,
            status,
            updatedAt: nowIso,
            statusHistory: [...a.statusHistory, entry],
            reviewComment:
              status === 'reviewed' || status === 'draft'
                ? opts?.comment ?? a.reviewComment
                : a.reviewComment,
            reviewedBy: status === 'reviewed' ? opts?.by ?? a.reviewedBy : a.reviewedBy,
          }
          toSave = updated
          return updated
        })
        return { ...s, assessments }
      })
      if (toSave) await db.putAssessment(toSave)
    },
    [],
  )

  const resetDemoData = useCallback(async () => {
    // Remove existing demo assessments, re-seed fresh ones.
    const fresh = buildDemoAssessments()
    setState((s) => {
      const nonDemo = s.assessments.filter((a) => a.incidentId !== DEMO_INCIDENT_ID)
      return { ...s, assessments: [...nonDemo, ...fresh] }
    })
    const current = await db.getAllAssessments()
    await Promise.all(
      current
        .filter((a) => a.incidentId === DEMO_INCIDENT_ID)
        .map((a) => db.deleteAssessment(a.id)),
    )
    await db.putIncident(demoIncident)
    await db.putAssessments(fresh)
  }, [])

  const selectedIncident = useMemo(
    () => state.incidents.find((i) => i.id === state.selectedIncidentId) ?? null,
    [state.incidents, state.selectedIncidentId],
  )

  const incidentAssessments = useMemo(
    () => state.assessments.filter((a) => a.incidentId === state.selectedIncidentId),
    [state.assessments, state.selectedIncidentId],
  )

  const usingDemoData = selectedIncident?.isDemo ?? false

  const getAssessment = useCallback(
    (id: string) => state.assessments.find((a) => a.id === id),
    [state.assessments],
  )
  const getIncident = useCallback(
    (id: string) => state.incidents.find((i) => i.id === id),
    [state.incidents],
  )

  const value: DataContextValue = {
    ...state,
    selectedIncident,
    incidentAssessments,
    usingDemoData,
    selectIncident,
    refreshDnr: refreshDnrInternal,
    saveAssessment,
    createAssessment,
    removeAssessment,
    setStatus,
    resetDemoData,
    getAssessment,
    getIncident,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
