// Reusable Leaflet map. Renders the incident origin point (optional) and
// assessment-site markers. Supports click-to-add and marker selection.
// No perimeter / burn radius is drawn.

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Assessment, Incident } from '../types'
import { incidentIcon, siteIcon } from './mapIcons'
import { damageLabel, siteTypeLabel, statusLabel } from '../lib/labels'

interface IncidentMapProps {
  incident: Incident | null
  assessments: Assessment[]
  showIncident?: boolean
  showSites?: boolean
  selectedId?: string | null
  onSelect?: (id: string) => void
  onMapClick?: (lat: number, lon: number) => void
  className?: string
  interactive?: boolean
}

export function IncidentMap({
  incident,
  assessments,
  showIncident = true,
  showSites = true,
  selectedId,
  onSelect,
  onMapClick,
  className = '',
  interactive = true,
}: IncidentMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const clickCbRef = useRef(onMapClick)
  clickCbRef.current = onMapClick
  const selectCbRef = useRef(onSelect)
  selectCbRef.current = onSelect

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      center: [47.5, -120.5],
      zoom: 10,
      scrollWheelZoom: interactive,
      dragging: interactive,
      zoomControl: interactive,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    map.on('click', (e: L.LeafletMouseEvent) => {
      clickCbRef.current?.(e.latlng.lat, e.latlng.lng)
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [interactive])

  // Render markers when data/toggles change.
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()

    const bounds: L.LatLngExpression[] = []

    if (showIncident && incident?.lat != null && incident?.lon != null) {
      const m = L.marker([incident.lat, incident.lon], { icon: incidentIcon })
      m.bindPopup(
        `<strong>${escapeHtml(incident.name)}</strong><br/>Incident origin point (approx.)<br/>County: ${escapeHtml(
          incident.county,
        )}`,
      )
      m.addTo(layer)
      bounds.push([incident.lat, incident.lon])
    }

    if (showSites) {
      assessments.forEach((a) => {
        const marker = L.marker([a.lat, a.lon], { icon: siteIcon(a.type) })
        marker.bindPopup(
          `<strong>${escapeHtml(a.siteName)}</strong><br/>${escapeHtml(
            siteTypeLabel[a.type],
          )}<br/>Status: ${escapeHtml(statusLabel[a.status])}<br/>Damage: ${escapeHtml(
            damageLabel[a.damage],
          )}`,
        )
        marker.on('click', () => selectCbRef.current?.(a.id))
        if (a.id === selectedId) {
          marker.setZIndexOffset(1000)
        }
        marker.addTo(layer)
        bounds.push([a.lat, a.lon])
      })
    }

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds).pad(0.25), { maxZoom: 13 })
    }
    // Fix tiles when container size settled.
    setTimeout(() => map.invalidateSize(), 50)
  }, [incident, assessments, showIncident, showSites, selectedId])

  return (
    <div
      ref={containerRef}
      className={className}
      role="application"
      aria-label="Map of incident and assessment sites"
    />
  )
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&#39;'
    }
  })
}
