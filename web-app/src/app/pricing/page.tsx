'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import SiteChrome from '../../components/SiteChrome';
import { plans, business, type Plan } from '../../lib/business';

// Set NEXT_PUBLIC_PAYPAL_CLIENT_ID to your PayPal (sandbox or live) client ID
// to enable real PayPal checkout. Without it the page runs a clearly-labelled
// demonstration instead of taking a payment.
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? '';

declare global {
  interface Window { paypal?: any }
}

export default function PricingPage() {
  const [selected, setSelected] = useState<Plan>(plans.find(p => p.featured) ?? plans[0]);
  const [sdkReady, setSdkReady] = useState(false);
  const [order, setOrder] = useState<{ id: string; plan: string; demo: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const buttonBox = useRef<HTMLDivElement>(null);

  const payable = selected.price > 0;

  // Load the PayPal JS SDK once, only when a client ID is configured.
  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) return;
    if (window.paypal) { setSdkReady(true); return; }
    const s = document.createElement('script');
    s.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=AUD`;
    s.onload = () => setSdkReady(true);
    s.onerror = () => setError('PayPal could not be loaded. Check your connection and try again.');
    document.body.appendChild(s);
  }, []);

  // Render the PayPal buttons for the selected plan.
  useEffect(() => {
    if (!sdkReady || !payable || !buttonBox.current || !window.paypal) return;
    buttonBox.current.innerHTML = '';
    try {
      window.paypal.Buttons({
        style: { layout: 'vertical', shape: 'rect', color: 'gold', label: 'paypal' },
        createOrder: (_: unknown, actions: any) =>
          actions.order.create({
            purchase_units: [{
              description: `${business.name} — ${selected.name}`,
              amount: { value: selected.price.toFixed(2), currency_code: 'AUD' }
            }]
          }),
        onApprove: async (_: unknown, actions: any) => {
          const details = await actions.order.capture();
          setOrder({ id: details.id, plan: selected.name, demo: false });
        },
        onError: () => setError('The payment could not be completed. No money was taken.')
      }).render(buttonBox.current);
    } catch {
      setError('PayPal checkout could not start.');
    }
  }, [sdkReady, selected, payable]);

  if (order) {
    return (
      <SiteChrome>
        <section className="section">
          <div className="wrap-narrow">
            <div className="success-box" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 46, lineHeight: 1 }}>✓</div>
              <h1 style={{ fontSize: '1.8rem', marginTop: 16 }}>
                {order.demo ? 'Demonstration complete' : 'Payment received'}
              </h1>
              <p style={{ color: 'var(--ink-soft)', marginTop: 12 }}>
                {order.demo
                  ? 'This was a simulated checkout — no money changed hands.'
                  : `Thank you. Your ${order.plan} is now active.`}
              </p>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 13.5, marginTop: 18 }}>
                Order reference <b>{order.id}</b>
              </p>
              <p style={{ color: 'var(--ink-soft)', fontSize: 14.5, marginTop: 18 }}>
                A receipt has been sent to your email. Open the Uni Shuttle app to
                choose your bus and start tracking.
              </p>
              <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 26 }}>
                <button className="btn-ghost" onClick={() => { setOrder(null); setError(null); }}>
                  Back to plans
                </button>
                <Link href="/" className="btn-cta">Go to homepage</Link>
              </div>
            </div>
          </div>
        </section>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome>
      <section className="page-head">
        <div className="wrap">
          <span className="eyebrow">Plans &amp; payment</span>
          <h1>Simple fares, paid online</h1>
          <p>
            One fixed price per student. No booking fees, no surge pricing, and
            your fare is locked for the life of your plan.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="price-grid">
            {plans.map(plan => {
              const isSel = plan.id === selected.id;
              return (
                <article key={plan.id} className={`price-card${plan.featured ? ' featured' : ''}`}>
                  {plan.featured && <span className="price-flag">Most popular</span>}
                  <h3 style={{ fontSize: '1.2rem' }}>{plan.name}</h3>
                  <div className="price-amount">
                    {plan.price > 0 ? (
                      <>
                        <span className="cur">$</span>
                        <b>{plan.price}</b>
                        <span className="per">{plan.unit}</span>
                      </>
                    ) : (
                      <b style={{ fontSize: '2.1rem' }}>Free to join</b>
                    )}
                  </div>
                  {plan.savings && <span className="price-save">{plan.savings}</span>}
                  {plan.price === 0 && <span className="price-save">10% commission per fare</span>}
                  <p style={{ color: 'var(--ink-soft)', fontSize: 14.6, marginTop: 14 }}>{plan.blurb}</p>
                  <ul className="ticks">
                    {plan.features.map(f => <li key={f}>{f}</li>)}
                  </ul>
                  <div className="price-foot">
                    {plan.price > 0 ? (
                      <button
                        className={isSel ? 'btn-cta' : 'btn-ghost'}
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => {
                          setSelected(plan);
                          setError(null);
                          document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                      >
                        {isSel ? 'Selected — checkout below' : 'Choose this plan'}
                      </button>
                    ) : (
                      <Link href="/contact" className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                        Apply as an operator
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* ---------------- checkout ---------------- */}
          <div id="checkout" style={{ marginTop: 58, scrollMarginTop: 90 }}>
            <div className="section-head" style={{ marginBottom: 26 }}>
              <span className="eyebrow">Secure checkout</span>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.1rem)' }}>Pay for your pass</h2>
            </div>

            <div className="grid-2" style={{ alignItems: 'start' }}>
              <div className="pay-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</div>
                    <div style={{ color: 'var(--ink-faint)', fontSize: 13.5 }}>{selected.unit}</div>
                  </div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                    ${selected.price.toFixed(2)}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', fontSize: 14.5, color: 'var(--ink-soft)' }}>
                  <span>GST included</span>
                  <span>Currency: AUD</span>
                </div>

                {error && (
                  <div className="notice-box" style={{ marginBottom: 16, background: '#fdecec', borderColor: '#f3c9c9', color: '#8f2f2f' }}>
                    {error}
                  </div>
                )}

                {PAYPAL_CLIENT_ID ? (
                  <>
                    <div ref={buttonBox} style={{ minHeight: 52 }} />
                    {!sdkReady && !error && (
                      <p style={{ color: 'var(--ink-faint)', fontSize: 14 }}>Loading PayPal…</p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="notice-box" style={{ marginBottom: 16 }}>
                      <b>Demonstration mode.</b> No PayPal account is connected, so
                      checkout is simulated and no payment is taken. Set
                      <code style={{ fontFamily: 'var(--mono)', fontSize: 12.5 }}> NEXT_PUBLIC_PAYPAL_CLIENT_ID </code>
                      to enable live PayPal checkout.
                    </div>
                    <button
                      className="btn-cta"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() =>
                        setOrder({
                          id: 'DEMO-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
                          plan: selected.name,
                          demo: true
                        })
                      }
                    >
                      Simulate PayPal checkout
                    </button>
                  </>
                )}

                <div className="pay-methods">
                  <span className="pay-chip">
                    <svg viewBox="0 0 24 24" fill="#003087" aria-hidden="true"><path d="M7.6 20.5H4.9c-.3 0-.5-.3-.4-.6L7 4.1c.1-.4.4-.6.8-.6h5.5c3.2 0 5 1.6 4.6 4.5-.5 3.4-3 5-6.2 5H9.4c-.4 0-.7.3-.8.7l-.6 6c-.1.5-.2.8-.4.8z" /></svg>
                    PayPal
                  </span>
                  <span className="pay-chip">Visa</span>
                  <span className="pay-chip">Mastercard</span>
                  <span className="pay-chip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>
                    Secure
                  </span>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1.05rem' }}>What happens next</h3>
                <ol style={{ margin: '14px 0 0', paddingLeft: 20, color: 'var(--ink-soft)', fontSize: 14.6, display: 'grid', gap: 10 }}>
                  <li>Your payment is processed securely by PayPal — we never see your card details.</li>
                  <li>You get an emailed receipt and your pass activates immediately.</li>
                  <li>Open the Uni Shuttle app, pick a verified bus on your route, and request a seat.</li>
                  <li>Your operator confirms, and you can track the bus from the next trip onwards.</li>
                </ol>
                <div className="notice-box" style={{ marginTop: 20 }}>
                  Student passes renew monthly. Cancel any time before your renewal
                  date from the app — no cancellation fee.
                </div>
                <p style={{ fontSize: 13.6, color: 'var(--ink-faint)', marginTop: 18 }}>
                  Questions about billing? <Link href="/contact" style={{ color: 'var(--signal-dk)', fontWeight: 600 }}>Contact our team</Link> — we reply within one business day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
