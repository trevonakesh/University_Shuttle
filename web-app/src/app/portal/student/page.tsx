'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { portalFetch, getPortalUser, freezeMessage } from '../../../lib/portalApi';

export default function StudentDashboard() {
  const [fare, setFare] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getPortalUser();

  useEffect(() => {
    Promise.all([
      portalFetch('/api/fares/me').then(r => r.json()),
      portalFetch('/api/payments/student').then(r => r.json()),
      portalFetch('/api/notices/student').then(r => r.json()),
    ]).then(([fareData, payData, noticeData]) => {
      setFare(fareData);
      setPayments(Array.isArray(payData?.payments) ? payData.payments.slice(0, 5) : []);
      setNotices(Array.isArray(noticeData?.notices) ? noticeData.notices.slice(0, 3) : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#7a8699', padding: '40px 0' }}>Loading your dashboard…</div>;

  const totalPaid = payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', color: '#10203a' }}>
          Welcome back, {user?.profile?.fullName?.split(' ')[0] ?? 'Student'} 👋
        </h1>
        <p style={{ color: '#7a8699', marginTop: '6px' }}>Here&apos;s your shuttle summary for this month.</p>
      </div>

      {/* Fare alert */}
      {fare?.assigned && (
        fare.status === 'PAID'
          ? <div className="p-alert green" style={{ marginBottom: '24px' }}>✓ This month&apos;s fare is <strong>paid</strong>. Enjoy your rides!</div>
          : fare.frozen
            ? <div className="p-alert amber" style={{ marginBottom: '24px' }}>⚠ Your account is <strong>frozen</strong> this month. {freezeMessage(fare)} <Link href="/portal/student/fare">View fare →</Link></div>
            : <div className="p-alert blue" style={{ marginBottom: '24px' }}>Your <strong>{fare.month}</strong> fare of <strong>LKR {fare.amountDue?.toLocaleString()}</strong> is due. <Link href="/portal/student/fare">View fare →</Link></div>
      )}
      {!fare?.assigned && (
        <div className="p-alert amber" style={{ marginBottom: '24px' }}>You&apos;re not assigned to a bus yet. <Link href="/portal/student/buses">Find a bus →</Link></div>
      )}

      {/* Stats */}
      <div className="p-stats">
        <div className="p-stat">
          <div className="p-stat-label">Current Fare</div>
          <div className={`p-stat-val ${fare?.status === 'PAID' ? 'green' : fare?.frozen ? 'amber' : 'blue'}`}>
            {fare?.status === 'PAID' ? 'PAID' : fare?.frozen ? 'FROZEN' : fare?.amountDue ? `LKR ${fare.amountDue.toLocaleString()}` : '—'}
          </div>
        </div>
        <div className="p-stat">
          <div className="p-stat-label">Total Paid</div>
          <div className="p-stat-val green">LKR {totalPaid.toLocaleString()}</div>
        </div>
        <div className="p-stat">
          <div className="p-stat-label">Payments Made</div>
          <div className="p-stat-val blue">{payments.length}</div>
        </div>
        <div className="p-stat">
          <div className="p-stat-label">Assigned Bus</div>
          <div className="p-stat-val" style={{ fontSize: '16px', paddingTop: '4px' }}>{fare?.driverName ?? '—'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Recent payments */}
        <div className="p-card">
          <div className="p-card-title">Recent Payments</div>
          {payments.length === 0
            ? <p style={{ color: '#7a8699', fontSize: '14px' }}>No payments yet.</p>
            : (
              <table className="p-table">
                <thead><tr><th>Month</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td>{p.month ?? p.billingPeriod ?? '—'}</td>
                      <td style={{ fontWeight: 600 }}>LKR {p.amount.toLocaleString()}</td>
                      <td><span className={`p-badge ${p.status === 'COMPLETED' ? 'green' : p.status === 'FAILED' ? 'red' : 'amber'}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          <div style={{ marginTop: '16px' }}>
            <Link href="/portal/student/payments" className="p-btn outline sm">View all →</Link>
          </div>
        </div>

        {/* Notices */}
        <div className="p-card">
          <div className="p-card-title">Latest Notices from Driver</div>
          {notices.length === 0
            ? <p style={{ color: '#7a8699', fontSize: '14px' }}>No notices posted.</p>
            : notices.map(n => (
              <div key={n.id} style={{ borderBottom: '1px solid #dde3ec', paddingBottom: '14px', marginBottom: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#10203a' }}>{n.title}</div>
                <div style={{ fontSize: '13px', color: '#7a8699', marginTop: '4px' }}>{n.content}</div>
                <div style={{ fontSize: '11px', color: '#7a8699', marginTop: '6px' }}>{new Date(n.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          <div style={{ marginTop: '8px' }}>
            <Link href="/portal/student/notices" className="p-btn outline sm">View all →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
