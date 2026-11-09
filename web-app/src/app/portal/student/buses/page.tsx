'use client';
import { useEffect, useState } from 'react';
import { API_BASE, portalFetch } from '../../../../lib/portalApi';

type Notice = { ok: boolean; msg: string } | null;

export default function FindABusPage() {
  const [buses, setBuses] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const load = () => Promise.all([
    portalFetch('/api/buses').then(r => r.json()),
    portalFetch('/api/requests/student').then(r => r.json())
  ]).then(([b, r]) => {
    setBuses(b.buses ?? []);
    setRequests(r.requests ?? []);
  }).catch(() => setNotice({ ok: false, msg: 'Could not load buses. Please try again.' }))
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const active = requests.find(r => r.status === 'PENDING' || r.status === 'APPROVED');

  const requestSeat = async (driverId: number) => {
    setBusyId(driverId);
    setNotice(null);
    try {
      const res = await portalFetch('/api/requests', { method: 'POST', body: JSON.stringify({ driverId, paymentPlan: 'MONTHLY' }) });
      const data = await res.json();
      setNotice(res.ok ? { ok: true, msg: 'Seat request sent. Your driver will review it.' } : { ok: false, msg: data.error ?? 'Could not send the request.' });
      if (res.ok) await load();
    } catch {
      setNotice({ ok: false, msg: 'Could not reach the server.' });
    } finally {
      setBusyId(null);
    }
  };

  const leave = async (request: any) => {
    const approved = request.status === 'APPROVED';
    if (!window.confirm(approved ? 'Leave this bus? You will need to request a seat again if you change your mind.' : 'Cancel this seat request?')) return;
    setBusyId(request.driverId);
    setNotice(null);
    try {
      const res = await portalFetch(`/api/requests/${request.id}`, { method: 'DELETE' });
      setNotice(res.ok ? { ok: true, msg: approved ? 'You have left the bus.' : 'Request cancelled.' } : { ok: false, msg: 'Could not update your seat. Please try again.' });
      if (res.ok) await load();
    } catch {
      setNotice({ ok: false, msg: 'Could not reach the server.' });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div style={{ color: '#7a8699' }}>Loading buses…</div>;

  return (
    <div>
      <h1 style={{ fontSize: '26px', color: '#10203a', marginBottom: '6px' }}>Find a Bus</h1>
      <p style={{ color: '#7a8699', marginBottom: '24px' }}>Approved buses going to your university.</p>

      {notice && <div className={`p-alert ${notice.ok ? 'green' : 'red'}`} style={{ marginBottom: '20px' }}>{notice.msg}</div>}

      {buses.length === 0 ? (
        <div className="p-card"><div className="p-alert amber">No approved buses serve your destination yet. Please check back soon.</div></div>
      ) : (
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
          {buses.map(bus => {
            const mine = active?.driverId === bus.id ? active : null;
            return (
              <div key={bus.id} className="p-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {bus.busPhotoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${API_BASE}${bus.busPhotoUrl}`} alt={`${bus.routeName ?? 'Bus'} photo`} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '10px' }} />
                )}
                <div>
                  <h3 style={{ fontSize: '17px', color: '#10203a', margin: 0 }}>{bus.routeName ?? 'Route'}</h3>
                  <div style={{ fontSize: '13px', color: '#7a8699', marginTop: '4px' }}>{bus.startingPoint ?? '—'} → {bus.destination ?? '—'}</div>
                </div>
                <div className="p-info-grid">
                  <div className="p-info-item"><span>Driver</span><span>{bus.fullName}</span></div>
                  <div className="p-info-item"><span>Bus</span><span>{bus.busRegNumber ?? '—'}</span></div>
                  <div className="p-info-item"><span>Seats</span><span>{bus.busCapacity ?? '—'}</span></div>
                  <div className="p-info-item"><span>Schedule</span><span>{bus.scheduleType ?? '—'}</span></div>
                  <div className="p-info-item"><span>Pickup</span><span>{bus.pickupTime ?? '—'}</span></div>
                  <div className="p-info-item"><span>Drop</span><span>{bus.dropTime ?? '—'}</span></div>
                  <div className="p-info-item"><span>Monthly fare</span><span>LKR {bus.monthlyFee ?? '—'}</span></div>
                </div>
                <div style={{ marginTop: 'auto' }}>
                  {mine ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span className={`p-badge ${mine.status === 'APPROVED' ? 'green' : 'amber'}`}>{mine.status === 'APPROVED' ? 'YOUR BUS' : 'REQUESTED'}</span>
                      <button className="p-btn outline sm" disabled={busyId === bus.id} onClick={() => leave(mine)}>
                        {mine.status === 'APPROVED' ? 'Leave Bus' : 'Cancel Request'}
                      </button>
                    </div>
                  ) : (
                    <button className="p-btn primary" style={{ width: '100%' }} disabled={Boolean(active) || busyId === bus.id} onClick={() => requestSeat(bus.id)}>
                      {busyId === bus.id ? 'Sending…' : active ? 'You already have a bus' : 'Request a Seat'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
