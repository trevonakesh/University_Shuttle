'use client';
import { BrandLoader } from '../../../../components/Brand';
import { useEffect, useState } from 'react';
import { portalFetch } from '../../../../lib/portalApi';

export default function DriverRequestsPage() {
  const [activeTab, setActiveTab] = useState<'SEATS' | 'DAILY'>('SEATS');
  const [seatRequests, setSeatRequests] = useState<any[]>([]);
  const [dailyRides, setDailyRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loadRequests = () => {
    setLoading(true);
    Promise.all([
      portalFetch('/api/requests/driver').then(r => r.json()).catch(() => []),
      portalFetch('/api/daily-rides/driver').then(r => r.json()).catch(() => []),
    ]).then(([seats, dailies]) => {
      setSeatRequests(Array.isArray(seats) ? seats : (seats?.requests ?? []));
      setDailyRides(Array.isArray(dailies) ? dailies : (dailies?.dailyRides ?? []));
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(loadRequests, []);

  // Update monthly seat request
  const handleSeatAction = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setActingId(id);
    setMsg(null);
    try {
      const res = await portalFetch(`/api/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || 'Failed to update seat request.' });
      } else {
        setMsg({ ok: true, text: `Seat request marked as ${status}.` });
        loadRequests();
      }
    } catch {
      setMsg({ ok: false, text: 'Network error updating seat request.' });
    } finally {
      setActingId(null);
    }
  };

  // Update daily ride request
  const handleDailyAction = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setActingId(id);
    setMsg(null);
    try {
      const res = await portalFetch(`/api/daily-rides/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || 'Failed to update daily ride request.' });
      } else {
        setMsg({ ok: true, text: `Daily ride request marked as ${status}.` });
        loadRequests();
      }
    } catch {
      setMsg({ ok: false, text: 'Network error updating daily ride request.' });
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <BrandLoader label="Loading requests…" />;

  const pendingSeats = seatRequests.filter(s => s.status === 'PENDING');
  const pendingDailies = dailyRides.filter(d => d.status === 'PENDING');

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', color: '#10203a' }}>Passenger Requests</h1>
        <p style={{ color: '#7a8699', marginTop: '6px' }}>
          Review and approve students requesting monthly shuttle seats or one-time daily rides.
        </p>
      </div>

      {msg && (
        <div className={`p-alert ${msg.ok ? 'green' : 'red'}`}>
          {msg.text}
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #dde3ec', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('SEATS')}
          style={{
            padding: '12px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'SEATS' ? '3px solid #0e7c66' : '3px solid transparent',
            color: activeTab === 'SEATS' ? '#0e7c66' : '#7a8699',
            fontWeight: 700,
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Monthly Seat Applications
          {pendingSeats.length > 0 && (
            <span style={{ background: '#e8912f', color: '#fff', fontSize: '11px', padding: '2px 7px', borderRadius: '12px' }}>
              {pendingSeats.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('DAILY')}
          style={{
            padding: '12px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'DAILY' ? '3px solid #0e7c66' : '3px solid transparent',
            color: activeTab === 'DAILY' ? '#0e7c66' : '#7a8699',
            fontWeight: 700,
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Daily Ride Requests
          {pendingDailies.length > 0 && (
            <span style={{ background: '#2563eb', color: '#fff', fontSize: '11px', padding: '2px 7px', borderRadius: '12px' }}>
              {pendingDailies.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Monthly Seat Requests */}
      {activeTab === 'SEATS' && (
        <div>
          <div className="p-card">
            {seatRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7a8699' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#10203a' }}>No seat applications</div>
                <p style={{ fontSize: '14px', marginTop: '4px' }}>Students who apply to join your shuttle route will show up here.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="p-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Pickup Point</th>
                      <th>Phone</th>
                      <th>Applied Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seatRequests.map(r => (
                      <tr key={r.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#10203a' }}>
                            {r.student?.fullName || `Student #${r.studentId}`}
                          </div>
                          <div style={{ fontSize: '12px', color: '#7a8699' }}>ID: #{r.studentId}</div>
                        </td>
                        <td style={{ color: '#40506b', fontSize: '13px' }}>
                          {r.student?.pickupPoint || r.pickupPoint || '—'}
                        </td>
                        <td style={{ fontSize: '13px' }}>
                          {r.student?.user?.phone ? (
                            <a href={`tel:${r.student.user.phone}`} style={{ color: '#2563eb' }}>
                              {r.student.user.phone}
                            </a>
                          ) : '—'}
                        </td>
                        <td style={{ fontSize: '13px', color: '#7a8699' }}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <span className={`p-badge ${r.status === 'APPROVED' ? 'green' : r.status === 'REJECTED' ? 'red' : 'amber'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {r.status === 'PENDING' ? (
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                onClick={() => handleSeatAction(r.id, 'APPROVED')}
                                disabled={actingId === r.id}
                                className="p-btn sm primary"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleSeatAction(r.id, 'REJECTED')}
                                disabled={actingId === r.id}
                                className="p-btn sm danger"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSeatAction(r.id, r.status === 'APPROVED' ? 'REJECTED' : 'APPROVED')}
                              disabled={actingId === r.id}
                              className="p-btn sm outline"
                              style={{ fontSize: '12px' }}
                            >
                              {r.status === 'APPROVED' ? 'Revoke Seat' : 'Re-Approve'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Daily Ride Requests */}
      {activeTab === 'DAILY' && (
        <div>
          <div className="p-card">
            {dailyRides.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7a8699' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#10203a' }}>No daily ride requests</div>
                <p style={{ fontSize: '14px', marginTop: '4px' }}>Single-day ad-hoc passenger bookings will appear here.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="p-table">
                  <thead>
                    <tr>
                      <th>Passenger</th>
                      <th>Ride Date</th>
                      <th>Pickup Point</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRides.map(ride => (
                      <tr key={ride.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#10203a' }}>
                            {ride.student?.fullName || `Passenger #${ride.studentId}`}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: '#0e7c66' }}>
                          {ride.date}
                        </td>
                        <td style={{ color: '#40506b', fontSize: '13px' }}>
                          {ride.pickupPoint || 'Default stop'}
                        </td>
                        <td style={{ fontSize: '13px' }}>
                          {ride.student?.user?.phone ? (
                            <a href={`tel:${ride.student.user.phone}`} style={{ color: '#2563eb' }}>
                              {ride.student.user.phone}
                            </a>
                          ) : '—'}
                        </td>
                        <td>
                          <span className={`p-badge ${ride.status === 'APPROVED' ? 'green' : ride.status === 'REJECTED' ? 'red' : 'amber'}`}>
                            {ride.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {ride.status === 'PENDING' ? (
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                onClick={() => handleDailyAction(ride.id, 'APPROVED')}
                                disabled={actingId === ride.id}
                                className="p-btn sm primary"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleDailyAction(ride.id, 'REJECTED')}
                                disabled={actingId === ride.id}
                                className="p-btn sm danger"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#7a8699' }}>Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
