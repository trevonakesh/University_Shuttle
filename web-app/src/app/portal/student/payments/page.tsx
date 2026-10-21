'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { portalFetch } from '../../../../lib/portalApi';

interface Payment {
  id: number;
  month?: string;
  amount: number;
  paymentMethod: string;
  status: string;
  referenceNo?: string;
  paymentDate: string;
  driver?: {
    fullName: string;
    busRegNumber: string;
    routeName: string;
  };
}

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fare, setFare] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'FAILED'>('ALL');

  useEffect(() => {
    Promise.all([
      portalFetch('/api/payments/student').then(r => r.json()),
      portalFetch('/api/fares/me').then(r => r.json())
    ]).then(([payData, fareData]) => {
      setPayments(Array.isArray(payData?.payments) ? payData.payments : []);
      setFare(fareData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#7a8699', padding: '40px 0' }}>Loading your payments…</div>;

  const totalPaid = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  const filtered = filter === 'ALL'
    ? payments
    : payments.filter(p => p.status === filter);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#10203a' }}>Payment History</h1>
          <p style={{ color: '#7a8699', marginTop: '6px' }}>View all past monthly fare receipts and transaction records.</p>
        </div>
        {fare?.assigned && fare?.status !== 'PAID' && (
          <Link href="/portal/student/fare" className="p-btn primary">
            Pay Current Fare (LKR {fare.amountDue?.toLocaleString()}) →
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="p-stats">
        <div className="p-stat">
          <div className="p-stat-label">Total Amount Paid</div>
          <div className="p-stat-val green">LKR {totalPaid.toLocaleString()}</div>
        </div>
        <div className="p-stat">
          <div className="p-stat-label">Completed Transactions</div>
          <div className="p-stat-val blue">{payments.filter(p => p.status === 'COMPLETED').length}</div>
        </div>
        <div className="p-stat">
          <div className="p-stat-label">Current Month Status</div>
          <div className={`p-stat-val ${fare?.status === 'PAID' ? 'green' : 'amber'}`}>
            {fare?.status === 'PAID' ? 'PAID' : fare?.frozen ? 'FROZEN' : 'UNPAID'}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['ALL', 'COMPLETED', 'PENDING', 'FAILED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`p-btn sm ${filter === tab ? 'primary' : 'outline'}`}
            style={{ textTransform: 'capitalize' }}
          >
            {tab.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="p-card">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7a8699' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '48px', height: '48px', margin: '0 auto 12px', stroke: '#abb6c6' }}>
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#10203a' }}>No payments found</div>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>There are no {filter.toLowerCase()} transactions recorded on your account.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="p-table">
              <thead>
                <tr>
                  <th>Billing Month</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Bus / Route</th>
                  <th>Reference / Receipt</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: '#10203a' }}>{p.month || 'Daily Ride'}</td>
                    <td style={{ fontWeight: 700, color: '#0e7c66' }}>LKR {p.amount.toLocaleString()}</td>
                    <td>
                      <span style={{ fontSize: '13px', background: '#eef2f6', padding: '3px 8px', borderRadius: '6px', fontWeight: 500 }}>
                        {p.paymentMethod === 'PAYHERE' ? '💳 PayHere Card' : p.paymentMethod === 'IN_APP' ? '⚡ In-App' : p.paymentMethod === 'CASH' ? '💵 Cash' : p.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span className={`p-badge ${p.status === 'COMPLETED' ? 'green' : p.status === 'FAILED' ? 'red' : 'amber'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      {p.driver ? (
                        <div>
                          <div style={{ fontWeight: 500, color: '#10203a' }}>{p.driver.fullName}</div>
                          <div style={{ color: '#7a8699', fontSize: '12px' }}>{p.driver.busRegNumber} • {p.driver.routeName}</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#40506b' }}>
                      {p.referenceNo || `TX-${p.id.toString().padStart(6, '0')}`}
                    </td>
                    <td style={{ fontSize: '13px', color: '#7a8699' }}>
                      {new Date(p.paymentDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
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
