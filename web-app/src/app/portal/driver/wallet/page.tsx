'use client';
import { BrandLoader } from '../../../../components/Brand';
import { useEffect, useState } from 'react';
import { portalFetch } from '../../../../lib/portalApi';

interface PayoutReq {
  id: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note?: string;
  adminNote?: string;
  createdAt: string;
  payout?: {
    method: string;
    referenceNo?: string;
    createdAt: string;
  };
}

interface PaymentRecord {
  id: number;
  month: string;
  amount: number;
  adminCommission: number;
  status: string;
  paymentMethod: string;
  paymentDate: string;
  student?: {
    fullName: string;
  };
}

export default function DriverWalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [requests, setRequests] = useState<PayoutReq[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loadData = () => {
    Promise.all([
      portalFetch('/api/payout-requests/mine').then(r => r.json()).catch(() => ({ walletBalance: 0, requests: [] })),
      portalFetch('/api/payments/driver').then(r => r.json()).catch(() => ({ payments: [] }))
    ]).then(([mine, payRes]) => {
      setBalance(mine?.walletBalance ?? 0);
      setRequests(mine?.requests ?? []);
      setPayments(payRes?.payments ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(loadData, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setMsg({ ok: false, text: 'Please enter a valid withdrawal amount.' });
      return;
    }
    if (amt > balance) {
      setMsg({ ok: false, text: `Amount cannot exceed your current balance of LKR ${balance.toLocaleString()}` });
      return;
    }

    setSubmitting(true);
    try {
      const res = await portalFetch('/api/payout-requests', {
        method: 'POST',
        body: JSON.stringify({ amount: amt, note: withdrawNote })
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || 'Failed to submit withdrawal request.' });
      } else {
        setMsg({ ok: true, text: 'Withdrawal request submitted successfully! An administrator will review and disburse your funds.' });
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawNote('');
        loadData();
      }
    } catch {
      setMsg({ ok: false, text: 'Could not connect to the server.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this pending withdrawal request?')) return;
    setMsg(null);
    try {
      const res = await portalFetch(`/api/payout-requests/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || 'Could not cancel request.' });
      } else {
        setMsg({ ok: true, text: 'Withdrawal request cancelled.' });
        loadData();
      }
    } catch {
      setMsg({ ok: false, text: 'Failed to cancel request.' });
    }
  };

  if (loading) return <BrandLoader label="Loading wallet & payouts…" />;

  const totalWithdrawn = requests
    .filter(r => r.status === 'APPROVED')
    .reduce((s, r) => s + r.amount, 0);

  const pendingPayout = requests.find(r => r.status === 'PENDING');

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#10203a' }}>Earnings & Wallet</h1>
          <p className="p-badge blue" style={{ marginTop: '8px' }}>Online payments and payouts are coming soon</p>
          <p style={{ color: '#7a8699', marginTop: '6px' }}>
            Track in-app payments, platform commissions, and request payouts to your bank account.
          </p>
        </div>

        <button
          onClick={() => { setShowWithdrawModal(true); setMsg(null); }}
          disabled={balance <= 0 || !!pendingPayout}
          className="p-btn primary"
        >
          {pendingPayout ? 'Payout Pending Review' : 'Request Payout →'}
        </button>
      </div>

      {msg && (
        <div className={`p-alert ${msg.ok ? 'green' : 'red'}`}>
          {msg.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="p-stats">
        <div className="p-stat">
          <div className="p-stat-label">Available Balance</div>
          <div className="p-stat-val green">
            LKR {balance.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#7a8699', marginTop: '6px' }}>
            Ready for withdrawal
          </div>
        </div>

        <div className="p-stat">
          <div className="p-stat-label">Total Withdrawn</div>
          <div className="p-stat-val blue">
            LKR {totalWithdrawn.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#7a8699', marginTop: '6px' }}>
            Disbursed to date
          </div>
        </div>

        <div className="p-stat">
          <div className="p-stat-label">In-App Transactions</div>
          <div className="p-stat-val" style={{ color: '#10203a' }}>
            {payments.filter(p => p.status === 'COMPLETED').length}
          </div>
          <div style={{ fontSize: '12px', color: '#7a8699', marginTop: '6px' }}>
            Digital fare receipts
          </div>
        </div>
      </div>

      {/* Withdraw Modal / Inline Form */}
      {showWithdrawModal && (
        <div className="p-card" style={{ border: '2px solid #0e7c66', marginBottom: '28px', background: '#fcfdfd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '17px', color: '#10203a', fontWeight: 700 }}>Request a Payout</h3>
            <button
              onClick={() => setShowWithdrawModal(false)}
              style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#7a8699' }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="p-field">
              <label htmlFor="payout-amount">Withdrawal Amount (LKR)</label>
              <input
                id="payout-amount"
                type="number"
                step="any"
                min="100"
                max={balance}
                placeholder={`Max: ${balance}`}
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                required
              />
              <span style={{ fontSize: '12px', color: '#7a8699' }}>
                Your available balance: LKR {balance.toLocaleString()}
              </span>
            </div>

            <div className="p-field">
              <label htmlFor="payout-note">Bank Account Details / Note</label>
              <textarea
                id="payout-note"
                rows={3}
                placeholder="Bank Name, Branch, Account Number, Account Name"
                value={withdrawNote}
                onChange={e => setWithdrawNote(e.target.value)}
              />
              <span style={{ fontSize: '12px', color: '#7a8699' }}>
                Include bank account details so the administrator can transfer your funds.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="p-btn outline sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="p-btn primary sm"
              >
                {submitting ? 'Submitting…' : 'Submit Payout Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid: Payout Requests and In-App Payments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Payout Requests */}
        <div className="p-card">
          <div className="p-card-title">Payout Requests</div>
          {requests.length === 0 ? (
            <p style={{ color: '#7a8699', fontSize: '14px' }}>No payout requests submitted yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="p-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Details</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontSize: '13px', color: '#7a8699' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 700, color: '#10203a' }}>
                        LKR {r.amount.toLocaleString()}
                      </td>
                      <td>
                        <span className={`p-badge ${r.status === 'APPROVED' ? 'green' : r.status === 'REJECTED' ? 'red' : 'amber'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#40506b', maxWidth: '160px' }}>
                        {r.payout?.referenceNo ? `Ref: ${r.payout.referenceNo}` : r.note || '—'}
                      </td>
                      <td>
                        {r.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancelRequest(r.id)}
                            className="p-btn sm danger"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            Cancel
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

        {/* Digital Fare Earnings Breakdown */}
        <div className="p-card">
          <div className="p-card-title">Digital Fare Credits</div>
          {payments.length === 0 ? (
            <p style={{ color: '#7a8699', fontSize: '14px' }}>No online fare payments received yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="p-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Gross</th>
                    <th>Fee</th>
                    <th>Net Credited</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 10).map(p => {
                    const net = p.amount - (p.adminCommission || 0);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#10203a' }}>
                            {p.student?.fullName || `Student #${p.id}`}
                          </div>
                          <div style={{ fontSize: '11px', color: '#7a8699' }}>{p.month}</div>
                        </td>
                        <td style={{ fontSize: '13px', color: '#40506b' }}>
                          LKR {p.amount.toLocaleString()}
                        </td>
                        <td style={{ fontSize: '12px', color: '#e8912f' }}>
                          -LKR {(p.adminCommission || 0).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 700, color: '#0e7c66' }}>
                          +LKR {net.toLocaleString()}
                        </td>
                        <td style={{ fontSize: '12px', color: '#7a8699' }}>
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
