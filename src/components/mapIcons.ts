// Leaflet divIcons for AfterFire map markers.
// Distinct shapes/emoji per site type + an incident marker.
// We intentionally draw NO burn radius or perimeter — DNR gives points only,
// and implying a boundary or "safe" area would be misleading.

import L from 'leaflet'
import type { SiteType } from '../types'

function pin(color: string, emoji: string, ring = '#ffffff'): L.DivIcon {
  return L.divIcon({
    className: 'afterfire-pin',
    html: `
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:30px;height:30px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};box-shadow:0 1px 4px rgba(0,0,0,.4);
        border:2px solid ${ring};">
        <span style="transform:rotate(45deg);font-size:14px;line-height:1;">${emoji}</span>
      </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
    popupAnchor: [0, -28],
  })
}

const siteIcons: Record<SiteType, L.DivIcon> = {
  home: pin('#1f7a43', '🏠'),
  infrastructure: pin('#2563eb', '🛠️'),
  'natural-resource': pin('#15803d', '🌲'),
}

export function siteIcon(type: SiteType): L.DivIcon {
  return siteIcons[type]
}

// Incident (fire origin point) marker — distinct red diamond-ish marker.
export const incidentIcon: L.DivIcon = L.divIcon({
  className: 'afterfire-incident',
  html: `
    <div style="
      display:flex;align-items:center;justify-content:center;
      width:34px;height:34px;border-radius:8px;
      background:#b91c1c;box-shadow:0 1px 5px rgba(0,0,0,.45);
      border:2px solid #ffffff;">
      <span style="font-size:17px;line-height:1;">🔥</span>
    </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
})
