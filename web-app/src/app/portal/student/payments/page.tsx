'use client';
import { BrandLoader } from '../../../../components/Brand';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { portalFetch } from '../../../../lib/portalApi';
import { useLang, useT } from '../../../../lib/useLang';
import { formatDate } from '../../../../lib/i18n';

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
  const t = useT();
  const lang = useLang();
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

  if (loading) return <BrandLoader label={t("Loading your payments…")} />;

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
          <h1 style={{ fontSize: '26px', color: 'var(--ink)' }}>{t("Payment History")}</h1>
          <p style={{ color: 'var(--ink-faint)', marginTop: '6px' }}>{t("View all past monthly fare receipts and transaction records.")}</p>
        </div>
        {fare?.assigned && fare?.status !== 'PAID' && (
          <Link href="/portal/student/fare" className="p-btn primary">
            {t('Pay Current Fare (LKR {amount})', { amount: fare.amountDue?.toLocaleString() })} →
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="p-stats">
        <div className="p-stat">
          <div className="p-stat-label">{t("Total Amount Paid")}</div>
          <div className="p-stat-val green">{t("LKR")} {totalPaid.toLocaleString()}</div>
        </div>
        <div className="p-stat">
          <div className="p-stat-label">{t("Completed Transactions")}</div>
          <div className="p-stat-val blue">{payments.filter(p => p.status === 'COMPLETED').length}</div>
        </div>
        <div className="p-stat">
          <div className="p-stat-label">{t("Current Month Status")}</div>
          <div className={`p-stat-val ${fare?.status === 'PAID' ? 'green' : 'amber'}`}>
            {fare?.status === 'PAID' ? t("PAID") : fare?.frozen ? t("FROZEN") : t("UNPAID")}
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
            {tab === 'ALL' ? t('All') : lang === 'si' ? t(tab) : tab.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="p-card">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-faint)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '48px', height: '48px', margin: '0 auto 12px', stroke: 'var(--ink-faint)' }}>
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>{t("No payments found")}</div>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>{t('No transactions recorded on your account.')}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="p-table">
              <thead>
                <tr>
                  <th>{t("Billing Month")}</th>
                  <th>{t("Amount")}</th>
                  <th>{t("Payment Method")}</th>
                  <th>{t("Status")}</th>
                  <th>{t("Bus / Route")}</th>
                  <th>{t("Reference / Receipt")}</th>
                  <th>{t("Date & Time")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{p.month || t("Daily Ride")}</td>
                    <td style={{ fontWeight: 700, color: 'var(--green-ink)' }}>{t("LKR")} {p.amount.toLocaleString()}</td>
                    <td>
                      <span style={{ fontSize: '13px', background: 'var(--paper-2)', padding: '3px 8px', borderRadius: '6px', fontWeight: 500 }}>
                        {p.paymentMethod === 'PAYHERE' ? t("💳 PayHere Card") : p.paymentMethod === 'IN_APP' ? t("⚡ In-App") : p.paymentMethod === 'CASH' ? t("💵 Cash") : p.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span className={`p-badge ${p.status === 'COMPLETED' ? 'green' : p.status === 'FAILED' ? 'red' : 'amber'}`}>
                        {t(p.status)}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      {p.driver ? (
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{p.driver.fullName}</div>
                          <div style={{ color: 'var(--ink-faint)', fontSize: '12px' }}>{p.driver.busRegNumber} • {p.driver.routeName}</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--ink-soft)' }}>
                      {p.referenceNo || `TX-${p.id.toString().padStart(6, '0')}`}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--ink-faint)' }}>
                      {formatDate(p.paymentDate, lang, 'dayTime')}
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
