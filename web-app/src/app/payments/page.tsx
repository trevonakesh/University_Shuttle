'use client';
import { useEffect, useState } from 'react';
import { API_BASE } from '../../lib/api';

type Payment = {
  id: number;
  amount: number;
  adminCommission: number;
  month: string;
  status: string;
  paymentDate: string;
  paymentMethod: string;
  student: { fullName: string; studentId: string };
  driver: { fullName: string; busRegNumber: string };
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/payments`)
      .then(res => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        return res.json();
      })
      .then(raw => {
        if (!Array.isArray(raw)) {
          console.error('Expected array of payments, got:', raw);
          setError('Unexpected response from the server.');
          setLoading(false);
          return;
        }
        const data = raw;
        setPayments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Could not reach the backend. Is the API server running?');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading payments...</div>;

  return (
    <div>
      <h1>Platform Payments</h1>
      <p className="subtitle">Overview of all transactions and driver earnings.</p>

      {error && (
        <div className="glass-panel" style={{ marginBottom: '20px', color: 'var(--danger, #e5484d)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Recent Transactions</h2>
        <select
          value={selectedDriver}
          onChange={(e) => setSelectedDriver(e.target.value)}
          style={{ padding: '10px 15px', borderRadius: '8px', background: 'var(--bg-glass)', color: 'var(--text)', border: '1px solid var(--border)', outline: 'none' }}
        >
          <option value="All" style={{ color: 'black' }}>All Drivers</option>
          {Array.from(new Set(payments.map(p => p.driver.fullName))).map(driver => (
            <option key={driver} value={driver} style={{ color: 'black' }}>{driver}</option>
          ))}
        </select>
      </div>

      <div className="glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Student</th>
              <th>Driver</th>
              <th>Month</th>
              <th>Total Amount</th>
              <th>Admin Earns</th>
              <th>Driver Earns</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {(selectedDriver === 'All' ? payments : payments.filter(p => p.driver.fullName === selectedDriver)).map(payment => (
              <tr key={payment.id}>
                <td>#{payment.id}</td>
                <td>
                  <div>{payment.student.fullName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{payment.student.studentId}</div>
                </td>
                <td>
                  <div>{payment.driver.fullName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{payment.driver.busRegNumber}</div>
                </td>
                <td>{payment.month}</td>
                <td style={{ fontWeight: 'bold' }}>Rs. {payment.amount}</td>
                <td style={{ color: 'var(--accent)' }}>Rs. {payment.adminCommission || 0}</td>
                <td style={{ color: 'var(--success)' }}>Rs. {payment.amount - (payment.adminCommission || 0)}</td>
                <td>{payment.paymentMethod}</td>
                <td>
                  <span className={`badge ${payment.status.toLowerCase()}`}>
                    {payment.status}
                  </span>
                </td>
                <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
              </tr>
            ))}
            {(selectedDriver === 'All' ? payments : payments.filter(p => p.driver.fullName === selectedDriver)).length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center' }}>No payments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
