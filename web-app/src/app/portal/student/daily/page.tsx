'use client';
import { BrandLoader } from '../../../../components/Brand';
import { useEffect, useState } from 'react';
import { colomboToday, portalFetch } from '../../../../lib/portalApi';

const TRIPS: Record<string, string> = {
  ROUND_TRIP: 'Round trip',
  TO_UNI_ONLY: 'To university only',
  FROM_UNI_ONLY: 'From university only'
};
const BOOKING_WINDOW_DAYS = 30;

const addDays = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export default function DailyRidesPage() {
  const today = colomboToday();
  const [buses, setBuses] = useState<any[]>([]);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState('');
  const [date, setDate] = useState(today);
  const [tripType, setTripType] = useState('ROUND_TRIP');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadRides = () => portalFetch('/api/daily-rides/student').then(r => r.json()).then(d => setRides(Array.isArray(d) ? d : []));

  useEffect(() => {
    Promise.all([
      portalFetch('/api/buses').then(r => r.json()),
      portalFetch('/api/fares/me').then(r => r.json()),
      loadRides()
    ]).then(([b, fare]) => {
      setBuses(b.buses ?? []);
      if (fare?.driverId) setDriverId(String(fare.driverId));
    }).catch(() => setNotice({ ok: false, msg: 'Could not load your rides. Please try again.' }))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await portalFetch('/api/daily-rides', { method: 'POST', body: JSON.stringify({ driverId: Number(driverId), date, tripType }) });
      const data = await res.json();
      setNotice(res.ok ? { ok: true, msg: 'Ride requested. Your driver will review it.' } : { ok: false, msg: data.message ?? data.error ?? 'Could not request the ride.' });
      if (res.ok) await loadRides();
    } catch {
      setNotice({ ok: false, msg: 'Could not reach the server.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <BrandLoader label="Loading daily rides…" />;

  return (
    <div>
      <h1 style={{ fontSize: '26px', color: '#10203a', marginBottom: '6px' }}>Daily Rides</h1>
      <p style={{ color: '#7a8699', marginBottom: '24px' }}>Book a single day of travel. Pay your driver in cash when you travel.</p>

      {notice && <div className={`p-alert ${notice.ok ? 'green' : 'red'}`} style={{ marginBottom: '20px' }}>{notice.msg}</div>}

      <div className="p-card" style={{ marginBottom: '20px' }}>
        <div className="p-card-title">Request a Ride</div>
        {buses.length === 0 ? (
          <div className="p-alert amber">No approved buses serve your destination yet.</div>
        ) : (
          <form onSubmit={submit} style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', alignItems: 'end' }}>
            <div className="p-field">
              <label htmlFor="bus">Bus</label>
              <select id="bus" value={driverId} onChange={e => setDriverId(e.target.value)} required>
                <option value="">Select a bus</option>
                {buses.map(b => <option key={b.id} value={b.id}>{b.routeName ?? 'Route'} ({b.busRegNumber ?? b.fullName})</option>)}
              </select>
            </div>
            <div className="p-field">
              <label htmlFor="date">Date</label>
              <input id="date" type="date" value={date} min={today} max={addDays(today, BOOKING_WINDOW_DAYS)} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="p-field">
              <label htmlFor="trip">Trip</label>
              <select id="trip" value={tripType} onChange={e => setTripType(e.target.value)}>
                {Object.entries(TRIPS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <button type="submit" className="p-btn primary" disabled={saving}>{saving ? 'Sending…' : 'Request Ride'}</button>
          </form>
        )}
      </div>

      <div className="p-card">
        <div className="p-card-title">My Requests</div>
        {rides.length === 0 ? (
          <p style={{ color: '#7a8699', fontSize: '14px' }}>You haven&apos;t requested any daily rides yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="p-table">
              <thead><tr><th>Date</th><th>Bus</th><th>Trip</th><th>Fare</th><th>Status</th></tr></thead>
              <tbody>
                {rides.map(r => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{r.driver?.routeName ?? r.driver?.fullName ?? '—'}</td>
                    <td>{TRIPS[r.tripType] ?? r.tripType}</td>
                    <td>{r.fareAmount ? `LKR ${r.fareAmount.toLocaleString()}` : '—'}</td>
                    <td><span className={`p-badge ${r.status === 'APPROVED' ? 'green' : r.status === 'REJECTED' ? 'red' : 'amber'}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
