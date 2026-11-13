'use client';
import { BrandLoader } from '../../../components/Brand';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { portalFetch, getPortalUser, freezeMessage } from '../../../lib/portalApi';
import { useT } from '../../../lib/useLang';

export default function StudentDashboard() {
  const t = useT();
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

  if (loading) return <BrandLoader label={t("Loading your dashboard…")} />;

  const totalPaid = payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', color: 'var(--ink)' }}>
          {t('Welcome back, {name}', { name: user?.profile?.fullName?.split(' ')[0] ?? t('Student') })} 👋
        </h1>
        <p style={{ color: 'var(--ink-faint)', marginTop: '6px' }}>{t("Here's your shuttle summary for this month.")}</p>
      </div>

      {/* Fare alert */}
      {fare?.assigned && (
        fare.status === 'PAID'
          ? <div className="p-alert green" style={{ marginBottom: '24px' }}>{t("✓ This month's fare is paid. Enjoy your rides!")}</div>
          : fare.frozen
            ? <div className="p-alert amber" style={{ marginBottom: '24px' }}><strong>{t('⚠ Your account is frozen this month.')}</strong> {freezeMessage(fare, t)} <Link href="/portal/student/fare">{t("View fare →")}</Link></div>
            : <div className="p-alert blue" style={{ marginBottom: '24px' }}>{t('Your {month} fare of LKR {amount} is due.', { month: fare.month, amount: fare.amountDue?.toLocaleString() })} <Link href="/portal/student/fare">{t("View fare →")}</Link></div>
      )}
      {!fare?.assigned && (
        <div className="p-alert amber" style={{ marginBottom: '24px' }}>{t("You're not assigned to a bus yet.")} <Link href="/portal/student/buses">{t("Find a bus →")}</Link></div>
      )}

      {/* Stats */}
      <div className="p-stats">
        <div className="p-stat">
          <div className="p-stat-label">{t("Current Fare")}</div>
          <div className={`p-stat-val ${fare?.status === 'PAID' ? 'green' : fare?.frozen ? 'amber' : 'blue'}`}>
            {fare?.status === 'PAID' ? t("PAID") : fare?.frozen ? t("FROZEN") : fare?.amountDue ? `${t('LKR')} ${fare.amountDue.toLocaleString()}` : '—'}
          </div>
        </div>
        <div className="p-stat">
          <div className="p-stat-label">{t("Total Paid")}</div>
          <div className="p-stat-val green">{t("LKR")} {totalPaid.toLocaleString()}</div>
        </div>
        <div className="p-stat">
          <div className="p-stat-label">{t("Payments Made")}</div>
          <div className="p-stat-val blue">{payments.length}</div>
        </div>
        <div className="p-stat">
          <div className="p-stat-label">{t("Assigned Bus")}</div>
          <div className="p-stat-val" style={{ fontSize: '16px', paddingTop: '4px' }}>{fare?.driverName ?? '—'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '20px' }}>
        {/* Recent payments */}
        <div className="p-card">
          <div className="p-card-title">{t("Recent Payments")}</div>
          {payments.length === 0
            ? <p style={{ color: 'var(--ink-faint)', fontSize: '14px' }}>{t("No payments yet.")}</p>
            : (
              <table className="p-table">
                <thead><tr><th>{t("Month")}</th><th>{t("Amount")}</th><th>{t("Status")}</th></tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td>{p.month ?? p.billingPeriod ?? '—'}</td>
                      <td style={{ fontWeight: 600 }}>{t("LKR")} {p.amount.toLocaleString()}</td>
                      <td><span className={`p-badge ${p.status === 'COMPLETED' ? 'green' : p.status === 'FAILED' ? 'red' : 'amber'}`}>{t(p.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          <div style={{ marginTop: '16px' }}>
            <Link href="/portal/student/payments" className="p-btn outline sm">{t("View all →")}</Link>
          </div>
        </div>

        {/* Notices */}
        <div className="p-card">
          <div className="p-card-title">{t("Latest Notices from Driver")}</div>
          {notices.length === 0
            ? <p style={{ color: 'var(--ink-faint)', fontSize: '14px' }}>{t("No notices posted.")}</p>
            : notices.map(n => (
              <div key={n.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: '14px', marginBottom: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>{n.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--ink-faint)', marginTop: '4px' }}>{n.content}</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-faint)', marginTop: '6px' }}>{new Date(n.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          <div style={{ marginTop: '8px' }}>
            <Link href="/portal/student/notices" className="p-btn outline sm">{t("View all →")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
