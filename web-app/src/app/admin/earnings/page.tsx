'use client';
import { useEffect, useState } from 'react';
import { authFetch } from '../../../lib/api';

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

type PayoutRequest = {
  id: number;
  amount: number;
  note: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  driver: {
    id: number;
    fullName: string;
    busRegNumber: string | null;
    walletBalance: number;
    bankName: string | null;
    accNumber: string | null;
    accHolder: string | null;
    user: { email: string; phone: string };
  };
  payout: { method: string; referenceNo: string | null; createdAt: string } | null;
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
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [reviewing, setReviewing] = useState<PayoutRequest | null>(null);
  const [reviewMethod, setReviewMethod] = useState('BANK_TRANSFER');
  const [reviewRef, setReviewRef] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [totalAdminRevenue, setTotalAdminRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Commission rate state
  const [commissionRate, setCommissionRate] = useState<number>(0.10);
  const [commissionInput, setCommissionInput] = useState<string>('10');
  const [commissionSaving, setCommissionSaving] = useState(false);
  const [commissionError, setCommissionError] = useState<string | null>(null);
  const [commissionSuccess, setCommissionSuccess] = useState(false);

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
      const [driversRes, paymentsRes, payoutsRes, requestsRes, commissionRes] = await Promise.all([
        authFetch('/api/admin/drivers'),
        authFetch('/api/admin/payments'),
        authFetch('/api/admin/payouts'),
        authFetch('/api/admin/payout-requests'),
        authFetch('/api/admin/settings/commission')
      ]);
      const requestsData = await requestsRes.json();
      if (Array.isArray(requestsData)) setRequests(requestsData);
      const driversData = await driversRes.json();
      const paymentsData = await paymentsRes.json();
      const payoutsData = await payoutsRes.json();
      const commissionData = await commissionRes.json();

      if (Array.isArray(driversData)) setDrivers(driversData);
      if (Array.isArray(payoutsData)) setPayouts(payoutsData);
      if (typeof commissionData?.commissionRate === 'number') {
        setCommissionRate(commissionData.commissionRate);
        setCommissionInput(String(+(commissionData.commissionRate * 100).toFixed(4)));
      }

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

  const saveCommissionRate = async () => {
    const pct = parseFloat(commissionInput);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      setCommissionError('Enter a percentage between 0 and 100.');
      return;
    }
    setCommissionError(null);
    setCommissionSuccess(false);
    setCommissionSaving(true);
    try {
      const rate = pct / 100;
      const res = await authFetch('/api/admin/settings/commission', {
        method: 'PATCH',
        body: JSON.stringify({ commissionRate: rate })
      });
      const data = await res.json();
      if (res.ok) {
        setCommissionRate(data.commissionRate);
        setCommissionSuccess(true);
        setTimeout(() => setCommissionSuccess(false), 3000);
      } else {
        setCommissionError(data.message ?? 'Failed to update commission rate.');
      }
    } catch {
      setCommissionError('Could not reach the backend.');
    } finally {
      setCommissionSaving(false);
    }
  };

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

  const openReview = (r: PayoutRequest) => {
    setReviewing(r);
    setReviewMethod('BANK_TRANSFER');
    setReviewRef('');
    setReviewNote('');
    setReviewError(null);
  };

  const submitReview = async (action: 'APPROVE' | 'REJECT') => {
    if (!reviewing) return;
    if (action === 'REJECT' && !reviewNote.trim()) {
      setReviewError('Please give the driver a reason for the rejection.');
      return;
    }
    setReviewError(null);
    setReviewBusy(true);
    try {
      const res = await authFetch(`/api/admin/payout-requests/${reviewing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action,
          method: reviewMethod,
          referenceNo: reviewRef,
          adminNote: reviewNote
        })
      });
      const data = await res.json();
      if (res.ok) {
        setReviewing(null);
        loadAll();
      } else {
        setReviewError(data.error ?? data.message ?? 'Review failed.');
      }
    } catch {
      setReviewError('Could not reach the backend.');
    } finally {
      setReviewBusy(false);
    }
  };

  if (loading) return <div>Loading earnings...</div>;

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const reviewedRequests = requests.filter(r => r.status !== 'PENDING');

  const totalOwed = drivers.reduce((sum, d) => sum + (d.walletBalance || 0), 0);
  const totalPaidOut = payouts.reduce((sum, p) => sum + p.amount, 0);
  const commissionPct = +(commissionRate * 100).toFixed(4);

  return (
    <div>
      <h1>Platform & Driver Earnings</h1>
      <p className="subtitle">Platform revenue, driver balances, and wallet payouts.</p>

      {error && (
        <div className="glass-panel" style={{ marginBottom: '20px', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* ── Commission Settings ── */}
      <div className="glass-panel" style={{ marginBottom: '32px', padding: '24px' }}>
        <h2 style={{ marginBottom: '6px', fontSize: '18px' }}>Platform Commission Rate</h2>
        <p className="subtitle" style={{ marginBottom: '20px' }}>
          Currently charging <strong style={{ color: 'var(--primary)' }}>{commissionPct}%</strong> of every fare.
          Set to <strong>0%</strong> to disable the commission entirely.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
            <input
              id="commission-input"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={commissionInput}
              onChange={e => { setCommissionInput(e.target.value); setCommissionError(null); setCommissionSuccess(false); }}
              style={{
                width: '90px', padding: '10px 12px',
                background: 'rgba(255,255,255,0.06)', color: 'var(--text)',
                border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '16px',
                fontWeight: 600
              }}
            />
            <span style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', fontSize: '16px', fontWeight: 600 }}>%</span>
          </div>
          <button
            id="commission-save-btn"
            className="btn btn-primary"
            onClick={saveCommissionRate}
            disabled={commissionSaving}
            style={{ minWidth: '120px' }}
          >
            {commissionSaving ? 'Saving…' : 'Save Rate'}
          </button>
          {commissionSuccess && (
            <span style={{ color: 'var(--success)', fontSize: '14px', fontWeight: 500 }}>✓ Commission rate updated!</span>
          )}
          {commissionError && (
            <span style={{ color: 'var(--danger)', fontSize: '14px' }}>{commissionError}</span>
          )}
        </div>
        <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
          ⚠ Changing this rate affects <em>new payments only</em>. Past payments retain the rate at which they were charged.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ flex: 1, minWidth: '200px' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Total Admin Earnings ({commissionPct}%)</h3>
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

      <h2>
        Withdrawal Requests
        {pendingRequests.length > 0 && (
          <span style={{
            marginLeft: '10px', fontSize: '12px', fontWeight: 700, padding: '3px 10px',
            borderRadius: '20px', background: 'rgba(245,158,11,.2)', color: '#fcd34d'
          }}>
            {pendingRequests.length} awaiting review
          </span>
        )}
      </h2>
      <div className="glass-panel" style={{ marginBottom: '32px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Requested</th>
              <th>Amount</th>
              <th>Wallet</th>
              <th>Bank details</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...pendingRequests, ...reviewedRequests].map(r => (
              <tr key={r.id}>
                <td>
                  <div>{r.driver.fullName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.driver.busRegNumber ?? '-'}</div>
                </td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td style={{ fontWeight: 'bold' }}>Rs. {r.amount.toLocaleString()}</td>
                <td style={{ color: 'var(--success)' }}>Rs. {(r.driver.walletBalance || 0).toLocaleString()}</td>
                <td style={{ fontSize: '12px' }}>
                  {r.driver.bankName
                    ? <>{r.driver.bankName}<br /><span style={{ color: 'var(--text-muted)' }}>{r.driver.accNumber} · {r.driver.accHolder}</span></>
                    : <span style={{ color: 'var(--text-muted)' }}>Not provided</span>}
                </td>
                <td>
                  <span className={`badge ${r.status === 'PENDING' ? 'pending' : r.status === 'APPROVED' ? 'approved' : 'rejected'}`}>
                    {r.status}
                  </span>
                  {r.adminNote && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                      {r.adminNote}
                    </div>
                  )}
                </td>
                <td>
                  {r.status === 'PENDING'
                    ? <button className="btn btn-primary" onClick={() => openReview(r)}>Review</button>
                    : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : '—'}
                      </span>}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>No withdrawal requests yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {reviewing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div className="glass-panel" style={{ width: '460px', padding: '30px', backgroundColor: '#1e212b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h2>Review Payout Request</h2>
              <button onClick={() => setReviewing(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gap: '6px', marginBottom: '18px', fontSize: '14px' }}>
              <div><strong>{reviewing.driver.fullName}</strong> · {reviewing.driver.user?.phone ?? reviewing.driver.user?.email}</div>
              <div>Requesting <strong style={{ color: 'var(--success)' }}>Rs. {reviewing.amount.toLocaleString()}</strong> of Rs. {reviewing.driver.walletBalance.toLocaleString()} available</div>
              {reviewing.driver.bankName && (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  {reviewing.driver.bankName} · {reviewing.driver.accNumber} · {reviewing.driver.accHolder}
                </div>
              )}
              {reviewing.note && (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>“{reviewing.note}”</div>
              )}
            </div>

            {reviewError && <div style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '13px' }}>{reviewError}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label style={labelStyle}>
                Payment method
                <select value={reviewMethod} onChange={e => setReviewMethod(e.target.value)} style={inputStyle}>
                  <option value="BANK_TRANSFER" style={{ color: 'black' }}>Bank Transfer</option>
                  <option value="CASH" style={{ color: 'black' }}>Cash</option>
                </select>
              </label>
              <label style={labelStyle}>
                Reference No (bank slip)
                <input value={reviewRef} onChange={e => setReviewRef(e.target.value)} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Note to driver {`(required when rejecting)`}
                <input value={reviewNote} onChange={e => setReviewNote(e.target.value)} style={inputStyle} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setReviewing(null)} disabled={reviewBusy}>Cancel</button>
              <button className="btn btn-danger" onClick={() => submitReview('REJECT')} disabled={reviewBusy}>Reject</button>
              <button className="btn btn-success" onClick={() => submitReview('APPROVE')} disabled={reviewBusy}>
                {reviewBusy ? 'Working…' : `Approve & Pay Rs. ${reviewing.amount.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <h2>Driver Balances</h2>
      <div className="glass-panel" style={{ marginBottom: '32px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Bus Registration</th>
              <th>Payments</th>
              <th>Total Collected</th>
              <th>Platform Fee ({commissionPct}%)</th>
              <th>Driver Net ({+(100 - commissionPct).toFixed(4)}%)</th>
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
