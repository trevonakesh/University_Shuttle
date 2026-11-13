'use client';
import { BrandLoader } from '../../../../components/Brand';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { portalFetch, freezeMessage } from '../../../../lib/portalApi';
import { useLang, useT } from '../../../../lib/useLang';

export default function StudentFarePage() {
  const t = useT();
  const lang = useLang();
  const [fare, setFare] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payResult, setPayResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadFare = () => {
    portalFetch('/api/fares/me').then(r => r.json()).then(data => {
      setFare(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(loadFare, []);

  const pay = async () => {
    setPaying(true);
    setPayResult(null);
    try {
      const res = await portalFetch('/api/payments/initiate', { method: 'POST', body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok) { setPayResult({ ok: false, msg: data.error ?? 'Payment failed.' }); return; }
      if (data.mode === 'PAYHERE' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setPayResult({ ok: true, msg: 'Payment recorded successfully! Your fare is now paid.' });
        loadFare();
      }
    } catch { setPayResult({ ok: false, msg: 'Could not reach the server.' }); }
    finally { setPaying(false); }
  };

  if (loading) return <BrandLoader label={t("Loading fare details…")} />;

  return (
    <div>
      <h1 style={{ fontSize: '26px', color: 'var(--ink)', marginBottom: '6px' }}>{t("My Fare")}</h1>
      <p style={{ color: 'var(--ink-faint)', marginBottom: '28px' }}>{t("Current month fare status and payment.")}</p>

      {payResult && (
        <div className={`p-alert ${payResult.ok ? 'green' : 'red'}`}>{t(payResult.msg)}</div>
      )}

      {!fare?.assigned ? (
        <div className="p-card">
          <div className="p-alert amber">{t("You are not assigned to a bus yet.")} <Link href="/portal/student/buses" style={{ fontWeight: 600, textDecoration: 'underline' }}>{t("Find a bus")}</Link></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Status card */}
          <div className="p-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div className="p-card-title">{t("Current Month:")} {fare.month}</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-.02em' }}>
                  {t("LKR")} {fare.amountDue?.toLocaleString() ?? '—'}
                </div>
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`p-badge ${fare.status === 'PAID' ? 'green' : fare.status === 'EXEMPT' ? 'gray' : 'amber'}`}>
                    {t(fare.status)}
                  </span>
                  {fare.frozen && <span className="p-badge red">{t("FROZEN")}</span>}
                  <span style={{ fontSize: '13px', color: 'var(--ink-faint)' }}>{t('Due by the {day} of the month', { day: lang === 'si' ? t('{n}th', { n: fare.dueDay }) : `${fare.dueDay}${fare.dueDay === 1 ? 'st' : fare.dueDay === 2 ? 'nd' : fare.dueDay === 3 ? 'rd' : 'th'}` })}</span>
                </div>
              </div>
              {fare.status !== 'PAID' && fare.onlinePayments && (
                <button className="p-btn primary" onClick={pay} disabled={paying} style={{ fontSize: '16px', padding: '14px 28px' }}>
                  {paying ? t("Processing…") : t("Pay Now")}
                </button>
              )}
            </div>

            {fare.frozen && (
              <div className="p-alert amber" style={{ marginTop: '16px' }}>{freezeMessage(fare, t)}</div>
            )}

            {fare.status !== 'PAID' && !fare.frozen && !fare.onlinePayments && (
              <div className="p-alert blue" style={{ marginTop: '16px' }}>
                {t("Online payments are coming soon. For now, hand your fare to your driver and they will mark it as paid.")}
              </div>
            )}

            {fare.status === 'PAID' && (
              <div className="p-alert green" style={{ marginTop: '16px' }}>
                {t("✓ This month's fare is fully paid. See you on the bus!")}
              </div>
            )}
          </div>

          {/* Driver info */}
          <div className="p-card">
            <div className="p-card-title">{t("Your Assigned Bus")}</div>
            <div className="p-info-grid">
              <div className="p-info-item">
                <span>{t("Driver")}</span>
                <span>{fare.driverName ?? '—'}</span>
              </div>
              <div className="p-info-item">
                <span>{t("Payment Method")}</span>
                <span>{fare.onlinePayments ? t("Online (Credit/Debit card via PayHere)") : t("Cash to your driver")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
