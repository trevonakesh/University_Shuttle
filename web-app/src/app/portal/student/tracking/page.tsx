'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Socket } from 'socket.io-client';
import LiveMap, { Point } from '../../../../components/LiveMap';
import { portalFetch, colomboToday, freezeMessage } from '../../../../lib/portalApi';
import { openPortalSocket } from '../../../../lib/portalSocket';

const STALE_AFTER_MS = 30_000;
const TYPICAL_SPEED_KMH = 25; // Sri Lankan urban traffic, used when the bus isn't moving

const distanceKm = (a: Point, b: Point): number => {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

export default function StudentTrackingPage() {
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [frozenText, setFrozenText] = useState<string | null>(null);
  const [denied, setDenied] = useState<string | null>(null);
  const [bus, setBus] = useState<Point | null>(null);
  const [speedKmh, setSpeedKmh] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [offline, setOffline] = useState(false);
  const [me, setMe] = useState<Point | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Work out which bus this student may follow: their seat, or today's approved daily ride.
  useEffect(() => {
    Promise.all([
      portalFetch('/api/fares/me').then(r => r.json()),
      portalFetch('/api/requests/student').then(r => r.json()),
      portalFetch('/api/daily-rides/student').then(r => r.json())
    ]).then(([fare, seats, rides]) => {
      if (fare?.frozen) setFrozenText(freezeMessage(fare));
      const seat = (seats.requests ?? []).find((r: any) => r.status === 'APPROVED');
      const today = colomboToday();
      const ride = Array.isArray(rides) ? rides.find((r: any) => r.status === 'APPROVED' && r.date === today) : null;
      setDriverId(seat?.driverId ?? ride?.driverId ?? null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (driverId === null || frozenText) return;
    const socket: Socket = openPortalSocket();
    socket.on('connect', () => socket.emit('joinStudentRoom', String(driverId)));
    socket.on('busLocationUpdate', (d: any) => {
      if (typeof d?.latitude !== 'number' || typeof d?.longitude !== 'number') return;
      setBus({ lat: d.latitude, lng: d.longitude });
      setSpeedKmh(typeof d.speed === 'number' && d.speed > 0 ? d.speed * 3.6 : null);
      setLastUpdate(Date.now());
      setOffline(false);
    });
    socket.on('busOffline', () => setOffline(true));
    socket.on('trackingDenied', (d: any) => setDenied(d?.message ?? 'You cannot track this bus.'));
    return () => { socket.disconnect(); };
  }, [driverId, frozenText]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Optional: only used to show distance and arrival time.
  useEffect(() => {
    if (driverId === null || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      p => setMe({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 10_000 }
    );
  }, [driverId]);

  if (loading) return <div style={{ color: '#7a8699' }}>Loading tracking…</div>;

  const isLive = !offline && lastUpdate !== null && now - lastUpdate < STALE_AFTER_MS;
  const km = isLive && bus && me ? distanceKm(me, bus) : null;
  const eta = km !== null ? Math.round((km / (speedKmh && speedKmh > 5 ? speedKmh : TYPICAL_SPEED_KMH)) * 60) : null;
  const seenSecs = lastUpdate !== null ? Math.max(0, Math.round((now - lastUpdate) / 1000)) : null;

  return (
    <div>
      <h1 style={{ fontSize: '26px', color: '#10203a', marginBottom: '6px' }}>Live Tracking</h1>
      <p style={{ color: '#7a8699', marginBottom: '24px' }}>See where your bus is right now.</p>

      {frozenText ? (
        <div className="p-alert red">{frozenText} <Link href="/portal/student/fare" style={{ fontWeight: 600, textDecoration: 'underline' }}>View fare</Link></div>
      ) : driverId === null ? (
        <div className="p-alert amber">
          You need an approved seat, or an approved daily ride today, to track a bus.{' '}
          <Link href="/portal/student/buses" style={{ fontWeight: 600, textDecoration: 'underline' }}>Find a bus</Link>
        </div>
      ) : denied ? (
        <div className="p-alert red">{denied}</div>
      ) : (
        <div className="p-card">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span className={`p-badge ${isLive ? 'green' : 'gray'}`}>{isLive ? 'LIVE' : 'OFFLINE'}</span>
            <span style={{ fontSize: '14px', color: '#7a8699' }}>
              {isLive
                ? `Updated ${seenSecs! < 5 ? 'just now' : `${seenSecs}s ago`}`
                : lastUpdate !== null ? 'The bus has stopped sharing its location.' : 'Waiting for the driver to start sharing their location…'}
            </span>
          </div>
          <LiveMap bus={bus} live={isLive} me={me} />
          <div className="p-stats" style={{ marginTop: '16px', marginBottom: 0 }}>
            <div className="p-stat"><div className="p-stat-label">Arrives in</div><div className="p-stat-val">{eta === null ? '--' : eta < 1 ? 'Now' : `${eta} min`}</div></div>
            <div className="p-stat"><div className="p-stat-label">Distance</div><div className="p-stat-val">{km === null ? '--' : `${km.toFixed(1)} km`}</div></div>
            <div className="p-stat"><div className="p-stat-label">Speed</div><div className="p-stat-val">{isLive && speedKmh !== null ? `${speedKmh.toFixed(0)} km/h` : '--'}</div></div>
          </div>
          {!me && isLive && (
            <p style={{ fontSize: '13px', color: '#7a8699', marginTop: '12px' }}>Allow location access in your browser to see distance and arrival time.</p>
          )}
        </div>
      )}
    </div>
  );
}
