// App shell: header with incident selector + demo badge, left sidebar on
// desktop, compact top nav on mobile.

import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useData } from '../store/DataContext'
import { DemoBadge } from './Badges'
import { formatDate } from '../lib/labels'

const navItems = [
  { to: '/', label: 'Overview', icon: '🏔️', end: true },
  { to: '/map', label: 'Map', icon: '🗺️' },
  { to: '/assessments', label: 'Assessments', icon: '📋' },
  { to: '/reports', label: 'Reports', icon: '📄' },
]

function IncidentSelector() {
  const { incidents, selectedIncidentId, selectIncident, dnrStatus } = useData()
  // Demo incidents first, then real DNR incidents alphabetically.
  const sorted = [...incidents].sort((a, b) => {
    if (a.isDemo !== b.isDemo) return a.isDemo ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="incident-select" className="sr-only">
        Select incident
      </label>
      <select
        id="incident-select"
        value={selectedIncidentId ?? ''}
        onChange={(e) => selectIncident(e.target.value)}
        className="max-w-[16rem] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 sm:max-w-xs"
      >
        {sorted.map((i) => (
          <option key={i.id} value={i.id}>
            {i.isDemo ? '★ ' : ''}
            {i.name} — {i.county}
            {i.acresBurned != null ? ` (${Math.round(i.acresBurned).toLocaleString()} ac)` : ''}
          </option>
        ))}
      </select>
      <span className="text-[11px] text-slate-500">
        {dnrStatus === 'loading' && 'Loading live WA DNR incidents…'}
        {dnrStatus === 'ok' && 'Live WA DNR incidents loaded'}
        {dnrStatus === 'error' && 'DNR offline — demo + saved data only'}
      </span>
    </div>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { usingDemoData, selectedIncident } = useData()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-[500] border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <span aria-hidden="true" className="text-xl">
              ☰
            </span>
          </button>
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl">
              🔥
            </span>
            <div className="leading-tight">
              <p className="text-lg font-bold text-forest-800">AfterFire</p>
              <p className="hidden text-[11px] text-slate-500 sm:block">
                WA wildfire recovery assessments
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <IncidentSelector />
            {usingDemoData && <DemoBadge />}
          </div>
        </div>
        {/* Mobile nav */}
        {mobileNavOpen && (
          <nav className="border-t border-slate-200 px-2 py-2 md:hidden" aria-label="Primary">
            <ul className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-xl px-3 py-2.5 text-base font-semibold ${
                        isActive
                          ? 'bg-forest-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`
                    }
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-[1400px]">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 p-4 md:block">
          <nav aria-label="Primary">
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-semibold transition ${
                        isActive
                          ? 'bg-forest-600 text-white'
                          : 'text-slate-700 hover:bg-forest-50'
                      }`
                    }
                  >
                    <span aria-hidden="true" className="text-lg">
                      {item.icon}
                    </span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          {selectedIncident && (
            <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Current incident</p>
              <p className="mt-1">{selectedIncident.name}</p>
              <p className="mt-1">{selectedIncident.county} County</p>
              <p className="mt-0.5">
                Discovered {formatDate(selectedIncident.discoveredDate)}
              </p>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
