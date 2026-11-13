'use client';
import { BrandLoader } from '../../../../components/Brand';
import { useEffect, useState } from 'react';
import { portalFetch } from '../../../../lib/portalApi';
import { useT } from '../../../../lib/useLang';

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
  const t = useT();
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
      setMsg({ ok: false, text: t('Please enter a valid withdrawal amount.') });
      return;
    }
    if (amt > balance) {
      setMsg({ ok: false, text: t('Amount cannot exceed your current balance of LKR {amount}', { amount: balance.toLocaleString() }) });
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
        setMsg({ ok: false, text: t(data.error || 'Failed to submit withdrawal request.') });
      } else {
        setMsg({ ok: true, text: t('Withdrawal request submitted successfully! An administrator will review and disburse your funds.') });
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawNote('');
        loadData();
      }
    } catch {
      setMsg({ ok: false, text: t('Could not connect to the server.') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (id: number) => {
    if (!confirm(t('Are you sure you want to cancel this pending withdrawal request?'))) return;
    setMsg(null);
    try {
      const res = await portalFetch(`/api/payout-requests/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: t(data.error || 'Could not cancel request.') });
      } else {
        setMsg({ ok: true, text: t('Withdrawal request cancelled.') });
        loadData();
      }
    } catch {
      setMsg({ ok: false, text: t('Failed to cancel request.') });
    }
  };

  if (loading) return <BrandLoader label={t("Loading wallet & payouts…")} />;

  const totalWithdrawn = requests
    .filter(r => r.status === 'APPROVED')
    .reduce((s, r) => s + r.amount, 0);

  const pendingPayout = requests.find(r => r.status === 'PENDING');

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: 'var(--ink)' }}>{t("Earnings & Wallet")}</h1>
          <p className="p-badge blue" style={{ marginTop: '8px' }}>{t("Online payments and payouts are coming soon")}</p>
          <p style={{ color: 'var(--ink-faint)', marginTop: '6px' }}>
            {t("Track in-app payments, platform commissions, and request payouts to your bank account.")}
          </p>
        </div>

        <button
          onClick={() => { setShowWithdrawModal(true); setMsg(null); }}
          disabled={balance <= 0 || !!pendingPayout}
          className="p-btn primary"
        >
          {pendingPayout ? t("Payout Pending Review") : t("Request Payout →")}
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
          <div className="p-stat-label">{t("Available Balance")}</div>
          <div className="p-stat-val green">
            {t("LKR")} {balance.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '6px' }}>
            {t("Ready for withdrawal")}
          </div>
        </div>

        <div className="p-stat">
          <div className="p-stat-label">{t("Total Withdrawn")}</div>
          <div className="p-stat-val blue">
            {t("LKR")} {totalWithdrawn.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '6px' }}>
            {t("Disbursed to date")}
          </div>
        </div>

        <div className="p-stat">
          <div className="p-stat-label">{t("In-App Transactions")}</div>
          <div className="p-stat-val" style={{ color: 'var(--ink)' }}>
            {payments.filter(p => p.status === 'COMPLETED').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '6px' }}>
            {t("Digital fare receipts")}
          </div>
        </div>
      </div>

      {/* Withdraw Modal / Inline Form */}
      {showWithdrawModal && (
        <div className="p-card" style={{ border: '2px solid var(--green-ink)', marginBottom: '28px', background: 'var(--paper)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '17px', color: 'var(--ink)', fontWeight: 700 }}>{t("Request a Payout")}</h3>
            <button
              onClick={() => setShowWithdrawModal(false)}
              style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--ink-faint)' }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="p-field">
              <label htmlFor="payout-amount">{t("Withdrawal Amount (LKR)")}</label>
              <input
                id="payout-amount"
                type="number"
                step="any"
                min="100"
                max={balance}
                placeholder={`${t('Max')}: ${balance}`}
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                required
              />
              <span style={{ fontSize: '12px', color: 'var(--ink-faint)' }}>
                {t("Your available balance: LKR")} {balance.toLocaleString()}
              </span>
            </div>

            <div className="p-field">
              <label htmlFor="payout-note">{t("Bank Account Details / Note")}</label>
              <textarea
                id="payout-note"
                rows={3}
                placeholder={t("Bank Name, Branch, Account Number, Account Name")}
                value={withdrawNote}
                onChange={e => setWithdrawNote(e.target.value)}
              />
              <span style={{ fontSize: '12px', color: 'var(--ink-faint)' }}>
                {t("Include bank account details so the administrator can transfer your funds.")}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="p-btn outline sm"
              >
                {t("Cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="p-btn primary sm"
              >
                {submitting ? t("Submitting…") : t("Submit Payout Request")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid: Payout Requests and In-App Payments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))', gap: '24px' }}>
        {/* Payout Requests */}
        <div className="p-card">
          <div className="p-card-title">{t("Payout Requests")}</div>
          {requests.length === 0 ? (
            <p style={{ color: 'var(--ink-faint)', fontSize: '14px' }}>{t("No payout requests submitted yet.")}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="p-table">
                <thead>
                  <tr>
                    <th>{t("Date")}</th>
                    <th>{t("Amount")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Details")}</th>
                    <th>{t("Action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontSize: '13px', color: 'var(--ink-faint)' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--ink)' }}>
                        {t("LKR")} {r.amount.toLocaleString()}
                      </td>
                      <td>
                        <span className={`p-badge ${r.status === 'APPROVED' ? 'green' : r.status === 'REJECTED' ? 'red' : 'amber'}`}>
                          {t(r.status)}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--ink-soft)', maxWidth: '160px' }}>
                        {r.payout?.referenceNo ? `${t('Ref')}: ${r.payout.referenceNo}` : r.note || '—'}
                      </td>
                      <td>
                        {r.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancelRequest(r.id)}
                            className="p-btn sm danger"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            {t("Cancel")}
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
          <div className="p-card-title">{t("Digital Fare Credits")}</div>
          {payments.length === 0 ? (
            <p style={{ color: 'var(--ink-faint)', fontSize: '14px' }}>{t("No online fare payments received yet.")}</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="p-table">
                <thead>
                  <tr>
                    <th>{t("Student")}</th>
                    <th>{t("Gross")}</th>
                    <th>{t("Fee")}</th>
                    <th>{t("Net Credited")}</th>
                    <th>{t("Date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 10).map(p => {
                    const net = p.amount - (p.adminCommission || 0);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                            {p.student?.fullName || `${t('Student')} #${p.id}`}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>{p.month}</div>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
                          {t("LKR")} {p.amount.toLocaleString()}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--amber)' }}>
                          {t("-LKR")} {(p.adminCommission || 0).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--green-ink)' }}>
                          {t("+LKR")} {net.toLocaleString()}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--ink-faint)' }}>
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
