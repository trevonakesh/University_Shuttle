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
  paymentMethod: string;
  student: { fullName: string; studentId: string };
  driver: { fullName: string; busRegNumber: string; walletBalance: number };
};

type DriverEarning = {
  driverName: string;
  busReg: string;
  totalCollected: number;
  driverEarnings: number;
  adminFee: number;
  walletBalance: number;
  paymentCount: number;
};

export default function EarningsPage() {
  const [driverEarnings, setDriverEarnings] = useState<DriverEarning[]>([]);
  const [totalAdminRevenue, setTotalAdminRevenue] = useState(0);
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

        // Calculate earnings per driver
        const earningsMap = new Map<string, DriverEarning>();
        let adminRev = 0;
        
        data.forEach((p: Payment) => {
          if (p.status === 'COMPLETED') {
            const commission = p.adminCommission || 0;
            adminRev += commission;
            const driverEarned = p.amount - commission;
            const key = p.driver.fullName;
            if (earningsMap.has(key)) {
              const current = earningsMap.get(key)!;
              current.totalCollected += p.amount;
              current.driverEarnings += driverEarned;
              current.adminFee += commission;
              current.paymentCount += 1;
              current.walletBalance = p.driver.walletBalance; // ensure latest
            } else {
              earningsMap.set(key, {
                driverName: p.driver.fullName,
                busReg: p.driver.busRegNumber,
                totalCollected: p.amount,
                driverEarnings: driverEarned,
                adminFee: commission,
                walletBalance: p.driver.walletBalance,
                paymentCount: 1
              });
            }
          }
        });
        
        setTotalAdminRevenue(adminRev);
        
        setDriverEarnings(Array.from(earningsMap.values()));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Could not reach the backend. Is the API server running?');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading earnings...</div>;

  return (
    <div>
      <h1>Platform & Driver Earnings</h1>
      <p className="subtitle">Overview of platform revenue and driver net earnings.</p>

      {error && (
        <div className="glass-panel" style={{ marginBottom: '20px', color: 'var(--danger, #e5484d)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-panel" style={{ flex: 1, minWidth: '200px', border: '1px solid var(--accent)' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>
            Total Admin Earnings (10%)
          </h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent)' }}>
            Rs. {totalAdminRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Platform Revenue
          </div>
        </div>

        <div className="glass-panel" style={{ width: '100%' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>Bus Registration</th>
                <th>Payments</th>
                <th>Total Collected</th>
                <th>Platform Fee (10%)</th>
                <th>Driver Net (90%)</th>
                <th>Current Wallet Balance</th>
              </tr>
            </thead>
            <tbody>
              {driverEarnings.map((earning, idx) => (
                <tr key={idx}>
                  <td>{earning.driverName}</td>
                  <td>{earning.busReg}</td>
                  <td>{earning.paymentCount}</td>
                  <td style={{ fontWeight: 'bold' }}>Rs. {earning.totalCollected.toLocaleString()}</td>
                  <td style={{ color: 'var(--accent)' }}>Rs. {earning.adminFee.toLocaleString()}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>Rs. {earning.driverEarnings.toLocaleString()}</td>
                  <td style={{ color: 'var(--success)' }}>Rs. {(earning.walletBalance || 0).toLocaleString()}</td>
                </tr>
              ))}
              {driverEarnings.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>No earnings data available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
