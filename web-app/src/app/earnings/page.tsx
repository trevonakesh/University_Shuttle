'use client';
import { useEffect, useState } from 'react';
import { authFetch } from '../../lib/api';

type Payment = {
  id: number;
  amount: number;
  adminCommission: number;
  status: string;
  driver: { fullName: string };
};

type Driver = {
  id: number;
  fullName: string;
  busRegNumber: string | null;
  walletBalance: number;
  status: string;
};

type Payout = {
  id: number;
  amount: number;
  method: string;
  referenceNo: string | null;
  note: string | null;
  createdAt: string;
  driver: { fullName: string; busRegNumber: string | null };
};

type EarningStats = { totalCollected: number; adminFee: number; driverEarnings: number; paymentCount: number };

export default function EarningsPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<Map<string, EarningStats>>(new Map());
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [totalAdminRevenue, setTotalAdminRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payout modal state
  const [payoutDriver, setPayoutDriver] = useState<Driver | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [referenceNo, setReferenceNo] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      const [driversRes, paymentsRes, payoutsRes] = await Promise.all([
        authFetch('/api/admin/drivers'),
        authFetch('/api/admin/payments'),
        authFetch('/api/admin/payouts')
      ]);
      const driversData = await driversRes.json();
      const paymentsData = await paymentsRes.json();
      const payoutsData = await payoutsRes.json();

      if (Array.isArray(driversData)) setDrivers(driversData);
      if (Array.isArray(payoutsData)) setPayouts(payoutsData);

      if (Array.isArray(paymentsData)) {
        const map = new Map<string, EarningStats>();
        let adminRev = 0;
        paymentsData.forEach((p: Payment) => {
          if (p.status !== 'COMPLETED') return;
          const commission = p.adminCommission || 0;
          adminRev += commission;
          const cur = map.get(p.driver.fullName) ?? { totalCollected: 0, adminFee: 0, driverEarnings: 0, paymentCount: 0 };
          cur.totalCollected += p.amount;
          cur.adminFee += commission;
          cur.driverEarnings += p.amount - commission;
          cur.paymentCount += 1;
          map.set(p.driver.fullName, cur);
        });
        setStats(map);
        setTotalAdminRevenue(adminRev);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Could not reach the backend. Is the API server running?');
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const openPayout = (driver: Driver) => {
    setPayoutDriver(driver);
    setAmount(driver.walletBalance > 0 ? driver.walletBalance.toFixed(2) : '');
    setMethod('BANK_TRANSFER');
    setReferenceNo('');
    setNote('');
    setFormError(null);
  };

  const submitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutDriver) return;
    setFormError(null);
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/payouts', {
        method: 'POST',
        body: JSON.stringify({ driverId: payoutDriver.id, amount: Number(amount), method, referenceNo, note })
      });
      const data = await res.json();
      if (res.ok) {
        setPayoutDriver(null);
        loadAll();
      } else {
        setFormError(data.message ?? 'Payout failed.');
      }
    } catch {
      setFormError('Could not reach the backend.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading earnings...</div>;

  const totalOwed = drivers.reduce((sum, d) => sum + (d.walletBalance || 0), 0);
  const totalPaidOut = payouts.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <h1>Platform & Driver Earnings</h1>
      <p className="subtitle">Platform revenue, driver balances, and wallet payouts.</p>

      {error && (
        <div className="glass-panel" style={{ marginBottom: '20px', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ flex: 1, minWidth: '200px' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Total Admin Earnings (10%)</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>
            Rs. {totalAdminRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Platform Revenue</div>
        </div>
        <div className="glass-panel" style={{ flex: 1, minWidth: '200px' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Owed to Drivers</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--success)' }}>
            Rs. {totalOwed.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Sum of wallet balances</div>
        </div>
        <div className="glass-panel" style={{ flex: 1, minWidth: '200px' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Total Paid Out</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text)' }}>
            Rs. {totalPaidOut.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>{payouts.length} payouts</div>
        </div>
      </div>

      <h2>Driver Balances</h2>
      <div className="glass-panel" style={{ marginBottom: '32px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Bus Registration</th>
              <th>Payments</th>
              <th>Total Collected</th>
              <th>Platform Fee (10%)</th>
              <th>Driver Net (90%)</th>
              <th>Wallet Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(driver => {
              const s = stats.get(driver.fullName) ?? { totalCollected: 0, adminFee: 0, driverEarnings: 0, paymentCount: 0 };
              return (
                <tr key={driver.id}>
                  <td>{driver.fullName}</td>
                  <td>{driver.busRegNumber || '-'}</td>
                  <td>{s.paymentCount}</td>
                  <td style={{ fontWeight: 'bold' }}>Rs. {s.totalCollected.toLocaleString()}</td>
                  <td style={{ color: 'var(--primary)' }}>Rs. {s.adminFee.toLocaleString()}</td>
                  <td style={{ color: 'var(--success)' }}>Rs. {s.driverEarnings.toLocaleString()}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>Rs. {(driver.walletBalance || 0).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      disabled={(driver.walletBalance || 0) <= 0}
                      style={(driver.walletBalance || 0) <= 0 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                      onClick={() => openPayout(driver)}
                    >
                      Pay Out
                    </button>
                  </td>
                </tr>
              );
            })}
            {drivers.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center' }}>No drivers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2>Payout History</h2>
      <div className="glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Driver</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Note</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map(p => (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td>
                  <div>{p.driver.fullName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.driver.busRegNumber || '-'}</div>
                </td>
                <td style={{ fontWeight: 'bold', color: 'var(--danger)' }}>- Rs. {p.amount.toLocaleString()}</td>
                <td>{p.method.replace('_', ' ')}</td>
                <td>{p.referenceNo || '-'}</td>
                <td style={{ color: 'var(--text-muted)' }}>{p.note || '-'}</td>
                <td>{new Date(p.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {payouts.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>No payouts made yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {payoutDriver && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <form onSubmit={submitPayout} className="glass-panel" style={{ width: '420px', padding: '30px', backgroundColor: '#1e212b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2>Pay Out: {payoutDriver.fullName}</h2>
              <button type="button" onClick={() => setPayoutDriver(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            <p className="subtitle" style={{ marginBottom: '20px' }}>
              Wallet balance: <strong style={{ color: 'var(--success)' }}>Rs. {payoutDriver.walletBalance.toLocaleString()}</strong>
            </p>

            {formError && <div style={{ color: 'var(--danger)', marginBottom: '15px' }}>{formError}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label style={labelStyle}>
                Amount (LKR) *
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={payoutDriver.walletBalance}
                  value={amount}
                  required
                  onChange={e => setAmount(e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Method
                <select value={method} onChange={e => setMethod(e.target.value)} style={inputStyle}>
                  <option value="BANK_TRANSFER" style={{ color: 'black' }}>Bank Transfer</option>
                  <option value="CASH" style={{ color: 'black' }}>Cash</option>
                </select>
              </label>
              <label style={labelStyle}>
                Reference No (e.g. bank slip)
                <input value={referenceNo} onChange={e => setReferenceNo(e.target.value)} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Note
                <input value={note} onChange={e => setNote(e.target.value)} style={inputStyle} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '25px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setPayoutDriver(null)}>Cancel</button>
              <button type="submit" className="btn btn-success" disabled={saving}>
                {saving ? 'Processing…' : `Pay Rs. ${Number(amount || 0).toLocaleString()}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-muted)'
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--surface-border)',
  background: 'rgba(255,255,255,0.06)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '14px'
};
