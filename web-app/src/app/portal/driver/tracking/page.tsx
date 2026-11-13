'use client';
import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import LiveMap, { Point } from '../../../../components/LiveMap';
import { portalFetch } from '../../../../lib/portalApi';
import { openPortalSocket } from '../../../../lib/portalSocket';
import { useT } from '../../../../lib/useLang';

const SEND_GAP_MS = 2000; // the server accepts at most one position per second

const gpsError = (e: GeolocationPositionError): string =>
  e.code === e.PERMISSION_DENIED
    ? 'Location permission was denied. Allow location for this site in your browser settings and try again.'
    : 'Could not read your location. Check that location is turned on for this device.';

export default function DriverTrackingPage() {
  const t = useT();
  const [approved, setApproved] = useState<boolean | null>(null);
  const [sharing, setSharing] = useState(false);
  const [position, setPosition] = useState<Point | null>(null);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const watchRef = useRef<number | null>(null);
  const wakeRef = useRef<WakeLockSentinel | null>(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    portalFetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setApproved(d.user?.profile?.status === 'APPROVED'))
      .catch(() => setApproved(false));

    const socket = openPortalSocket();
    socket.on('connect', () => socket.emit('joinDriverRoom'));
    socketRef.current = socket;

    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      socket.emit('stopBroadcast');
      wakeRef.current?.release().catch(() => {});
      socket.disconnect();
    };
  }, []);

  const stop = () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    socketRef.current?.emit('stopBroadcast');
    wakeRef.current?.release().catch(() => {});
    wakeRef.current = null;
    setSharing(false);
  };

  const start = async () => {
    setError(null);
    if (!navigator.geolocation) {
      setError(t('This browser cannot share location. Please use the mobile app.'));
      return;
    }
    // Keeps the phone screen on, since a sleeping browser stops sending GPS.
    try {
      wakeRef.current = await navigator.wakeLock.request('screen');
    } catch {
      // Not supported everywhere; sharing still works while the screen is on.
    }
    lastSentRef.current = 0;
    watchRef.current = navigator.geolocation.watchPosition(
      p => {
        const { latitude, longitude, speed, heading } = p.coords;
        setPosition({ lat: latitude, lng: longitude });
        setSpeedKmh(speed && speed > 0 ? speed * 3.6 : 0);
        setSharing(true);

        const now = Date.now();
        if (now - lastSentRef.current < SEND_GAP_MS) return;
        lastSentRef.current = now;
        socketRef.current?.emit('updateLocation', {
          latitude,
          longitude,
          speed: speed ?? -1,
          heading: heading ?? undefined
        });
      },
      e => {
        setError(t(gpsError(e)));
        stop();
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20_000 }
    );
  };

  return (
    <div>
      <h1 style={{ fontSize: '26px', color: 'var(--ink)', marginBottom: '6px' }}>{t("Live Location")}</h1>
      <p style={{ color: 'var(--ink-faint)', marginBottom: '24px' }}>{t("Share your bus's position with your passengers.")}</p>

      {approved === false ? (
        <div className="p-alert amber">{t("Live location becomes available once an administrator approves your bus.")}</div>
      ) : (
        <div className="p-card">
          {error && <div className="p-alert red" style={{ marginBottom: '16px' }}>{t(error)}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div>
              <span className={`p-badge ${sharing ? 'green' : 'gray'}`}>{sharing ? t("SHARING LIVE") : t("NOT SHARING")}</span>
              <div style={{ fontSize: '14px', color: 'var(--ink-faint)', marginTop: '8px' }}>
                {sharing ? `${speedKmh.toFixed(0)} km/h. ${t('Keep this page open while you drive.')}` : t("Students can follow your bus while this is on.")}
              </div>
            </div>
            <button className={`p-btn ${sharing ? 'danger' : 'primary'}`} onClick={sharing ? stop : start} disabled={approved === null}>
              {sharing ? t("Stop Sharing") : t("Start Sharing")}
            </button>
          </div>
          <LiveMap bus={position} live={sharing} />
        </div>
      )}
    </div>
  );
}
