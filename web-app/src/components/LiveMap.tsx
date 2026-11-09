'use client';
import { useEffect, useRef } from 'react';
import type { CircleMarker, Map as LeafletMap, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface Point { lat: number; lng: number }

const COLOMBO: Point = { lat: 6.9271, lng: 79.8612 };
const LIVE = '#0e7c66';
const OFFLINE = '#7a8699';

const busIcon = (color: string) => `
  <div style="width:38px;height:38px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="13" rx="2.5"/><path d="M3 10.5h18"/><path d="M7 17v2.2M17 17v2.2"/>
    </svg>
  </div>`;

// OpenStreetMap view with a bus marker and, optionally, the viewer's position.
// Leaflet touches `window`, so it is loaded in the browser only.
export default function LiveMap({ bus, live, me }: { bus: Point | null; live: boolean; me?: Point | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const latest = useRef({ bus, live, me });
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    latest.current = { bus, live, me };
    syncRef.current();
  }, [bus, live, me]);

  useEffect(() => {
    let map: LeafletMap | null = null;
    let cancelled = false;

    import('leaflet').then(({ default: L }) => {
      if (cancelled || !containerRef.current) return;
      const created = L.map(containerRef.current).setView([COLOMBO.lat, COLOMBO.lng], 12);
      map = created;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(created);

      let busMarker: Marker | null = null;
      let meMarker: CircleMarker | null = null;
      let centred = false;

      syncRef.current = () => {
        const { bus: b, live: isLive, me: viewer } = latest.current;
        if (b) {
          const icon = L.divIcon({ html: busIcon(isLive ? LIVE : OFFLINE), className: '', iconSize: [38, 38], iconAnchor: [19, 19] });
          if (busMarker) busMarker.setLatLng([b.lat, b.lng]).setIcon(icon);
          else busMarker = L.marker([b.lat, b.lng], { icon }).addTo(created);
          if (centred) created.panTo([b.lat, b.lng]);
          else {
            created.setView([b.lat, b.lng], 15);
            centred = true;
          }
        }
        if (viewer) {
          if (meMarker) meMarker.setLatLng([viewer.lat, viewer.lng]);
          else meMarker = L.circleMarker([viewer.lat, viewer.lng], { radius: 8, color: '#fff', weight: 2, fillColor: '#2563eb', fillOpacity: 1 }).addTo(created);
        }
      };
      syncRef.current();
    });

    return () => {
      cancelled = true;
      syncRef.current = () => {};
      map?.remove();
    };
  }, []);

  // z-index keeps the map's own layers underneath the portal's sidebar.
  return <div ref={containerRef} style={{ height: '460px', borderRadius: '14px', overflow: 'hidden', position: 'relative', zIndex: 0 }} />;
}
