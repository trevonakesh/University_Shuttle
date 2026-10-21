'use client';
import { useEffect, useState } from 'react';
import { portalFetch, API_BASE, getPortalToken } from '../../../../lib/portalApi';

export default function StudentFarePage() {
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

  if (loading) return <div style={{ color: '#7a8699' }}>Loading fare details…</div>;

  return (
    <div>
      <h1 style={{ fontSize: '26px', color: '#10203a', marginBottom: '6px' }}>My Fare</h1>
      <p style={{ color: '#7a8699', marginBottom: '28px' }}>Current month fare status and payment.</p>

      {payResult && (
        <div className={`p-alert ${payResult.ok ? 'green' : 'red'}`}>{payResult.msg}</div>
      )}

      {!fare?.assigned ? (
        <div className="p-card">
          <div className="p-alert amber">You are not assigned to a bus yet. Please request a seat via the mobile app or contact the admin.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Status card */}
          <div className="p-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div className="p-card-title">Current Month: {fare.month}</div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#10203a', letterSpacing: '-.02em' }}>
                  LKR {fare.amountDue?.toLocaleString() ?? '—'}
                </div>
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`p-badge ${fare.status === 'PAID' ? 'green' : fare.status === 'EXEMPT' ? 'gray' : 'amber'}`}>
                    {fare.status}
                  </span>
                  {fare.frozen && <span className="p-badge red">FROZEN</span>}
                  <span style={{ fontSize: '13px', color: '#7a8699' }}>Due by {fare.dueDay}{fare.dueDay === 1 ? 'st' : fare.dueDay === 2 ? 'nd' : fare.dueDay === 3 ? 'rd' : 'th'} of the month</span>
                </div>
              </div>
              {fare.status !== 'PAID' && (
                <button className="p-btn primary" onClick={pay} disabled={paying} style={{ fontSize: '16px', padding: '14px 28px' }}>
                  {paying ? 'Processing…' : 'Pay Now'}
                </button>
              )}
            </div>

            {fare.freezeReason && (
              <div className="p-alert amber" style={{ marginTop: '16px' }}>{fare.freezeReason}</div>
            )}

            {fare.status === 'PAID' && (
              <div className="p-alert green" style={{ marginTop: '16px' }}>
                ✓ This month&apos;s fare is fully paid. See you on the bus!
              </div>
            )}
          </div>

          {/* Driver info */}
          <div className="p-card">
            <div className="p-card-title">Your Assigned Bus</div>
            <div className="p-info-grid">
              <div className="p-info-item">
                <span>Driver</span>
                <span>{fare.driverName ?? '—'}</span>
              </div>
              <div className="p-info-item">
                <span>Payment Method</span>
                <span>Online (Credit/Debit card via PayHere)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
