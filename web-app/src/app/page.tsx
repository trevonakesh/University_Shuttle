import Link from 'next/link';
import SiteChrome from '../components/SiteChrome';
import { business, services } from '../lib/business';

export const metadata = {
  title: 'Uni Shuttle — Prepaid university bus travel, tracked live',
  description:
    'Reserve a seat on a verified university bus, pay one fixed monthly fare online, and track your bus in real time. Uni Shuttle also gives bus operators a complete fare and passenger management system.'
};

const Icon = ({ d }: { d: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

export default function HomePage() {
  return (
    <SiteChrome>
      {/* ---------------- hero ---------------- */}
      <section className="hero">
        <div className="wrap hero-inner">
          <div>
            <span className="eyebrow">For students &amp; bus operators</span>
            <h1 style={{ marginTop: 18 }}>
              Never wonder <span className="hl">where your bus is</span> again.
            </h1>
            <p className="hero-lead">
              Reserve a seat on a verified university bus, pay one fixed fare online,
              and watch your ride approach in real time. No cash, no group chats,
              no guessing.
            </p>
            <div className="hero-actions">
              <Link href="/pricing" className="btn-cta">
                See plans &amp; pay online
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
              <Link href="/services" className="btn-ghost">Explore services</Link>
            </div>

            <div className="hero-trust">
              <div><b>1,200+</b><span>Seats booked</span></div>
              <div><b>38</b><span>Verified operators</span></div>
              <div><b>6</b><span>Campuses served</span></div>
              <div><b>4.8★</b><span>Student rating</span></div>
            </div>
          </div>

          {/* live route illustration */}
          <div className="route-card" aria-label="Example live bus route">
            <div className="route-card-head">
              <span className="route-badge">ROUTE 04 · NA-4521</span>
              <span className="live-dot"><i />LIVE</span>
            </div>
            <ul className="stops">
              <li className="stop">
                <span className="stop-dot" />
                <span>
                  <span className="stop-name">Homagama Town</span><br />
                  <span className="stop-time">Departed 6:45 AM</span>
                </span>
              </li>
              <li className="stop is-bus">
                <span className="stop-dot">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="12" rx="2" /><path d="M4 11h16" /></svg>
                </span>
                <span>
                  <span className="stop-name">Approaching Pannipitiya</span><br />
                  <span className="stop-time">32 km/h · 1.4 km away</span>
                </span>
                <span className="stop-eta">4 MIN</span>
              </li>
              <li className="stop">
                <span className="stop-dot" />
                <span>
                  <span className="stop-name">Maharagama</span><br />
                  <span className="stop-time">Scheduled 7:12 AM</span>
                </span>
                <span className="stop-eta">11 MIN</span>
              </li>
              <li className="stop">
                <span className="stop-dot" />
                <span>
                  <span className="stop-name">NSBM Green University</span><br />
                  <span className="stop-time">Scheduled 7:40 AM</span>
                </span>
                <span className="stop-eta">38 MIN</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------- services ---------------- */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">What we offer</span>
            <h2>One platform for the whole journey</h2>
            <p>
              Students get a reliable ride they can see coming. Operators get the
              admin work handled — fares, passengers and payouts in one place.
            </p>
          </div>

          <div className="grid-3">
            {services.slice(0, 6).map((s, i) => (
              <article className="card" key={s.title}>
                <div className={`card-icon${i % 2 ? ' amber' : ''}`}>
                  <Icon d={
                    i === 0 ? <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M3 10.5h18M7 17v2M17 17v2" /></>
                    : i === 1 ? <><path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></>
                    : i === 2 ? <><path d="M9 11l3 3 7-7" /><path d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9" /></>
                    : i === 3 ? <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 14h3M8 17h6" /></>
                    : i === 4 ? <><rect x="2.5" y="6" width="19" height="12" rx="2.5" /><path d="M2.5 10h19" /><path d="M6.5 14.5h3" /></>
                    : <><path d="M12 3l8 3.5v5c0 4.6-3.2 8.6-8 9.5-4.8-.9-8-4.9-8-9.5v-5L12 3z" /><path d="M9.2 12l2 2 3.8-4" /></>
                  } />
                </div>
                <span className="tag">{s.audience}</span>
                <h3 style={{ marginTop: 12 }}>{s.title}</h3>
                <p>{s.description}</p>
              </article>
            ))}
          </div>

          <div style={{ marginTop: 34 }}>
            <Link href="/services" className="btn-ghost">See all services in detail</Link>
          </div>
        </div>
      </section>

      {/* ---------------- how it works ---------------- */}
      <section className="section section-tint">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>Booked in four steps</h2>
            <p>From download to your first tracked ride — usually the same day.</p>
          </div>

          <div className="steps">
            <div className="step done">
              <h3>Create your profile</h3>
              <p>Tell us your university and where you need to be picked up.</p>
            </div>
            <div className="step done">
              <h3>Pick a verified bus</h3>
              <p>Browse operators serving your campus, with routes, times and fares shown upfront.</p>
            </div>
            <div className="step done">
              <h3>Pay online</h3>
              <p>Pay your fixed fare securely by PayPal or card. Your receipt is stored in the app.</p>
            </div>
            <div className="step done">
              <h3>Track and travel</h3>
              <p>Follow your bus live each morning and get an arrival time for your stop.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- operators ---------------- */}
      <section className="section">
        <div className="wrap">
          <div className="grid-2" style={{ alignItems: 'center', gap: 52 }}>
            <div>
              <span className="eyebrow">For bus operators</span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.3vw, 2.4rem)', marginTop: 16 }}>
                Stop chasing fares in a notebook
              </h2>
              <p style={{ color: 'var(--ink-soft)', marginTop: 15, fontSize: '1.04rem' }}>
                Uni Shuttle gives you a live passenger list, a monthly fare ledger
                that tracks every student, and automatic online collection. Cash
                still works — record it in a tap and it lands in the same ledger.
              </p>
              <ul className="ticks" style={{ marginTop: 22 }}>
                <li>Free to join — we take 10% only when you get paid</li>
                <li>Paid, unpaid and not-travelling lists at a glance</li>
                <li>Earnings wallet with payouts on request</li>
                <li>Verified operator badge once your documents are approved</li>
              </ul>
              <div className="hero-actions" style={{ marginTop: 28 }}>
                <Link href="/contact" className="btn-cta">Become a partner</Link>
                <Link href="/pricing" className="btn-ghost">See operator plan</Link>
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 15 }}>July fare tracker</strong>
                <span className="tag">32 seats</span>
              </div>
              {[
                { n: 'Amaya Jayasuriya', s: 'Paid · Card', c: 'var(--signal)' },
                { n: 'Dinuka Rathnayake', s: 'Unpaid · Overdue', c: '#c4453f' },
                { n: 'Tharindu Bandara', s: 'Not travelling', c: 'var(--ink-faint)' },
                { n: 'Senaya Wickramasinghe', s: 'Paid · Cash', c: 'var(--signal)' }
              ].map(r => (
                <div key={r.n} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 26px', borderBottom: '1px solid var(--line-soft, #eef1f6)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: r.c, flex: 'none' }} />
                  <span style={{ fontWeight: 600, fontSize: 14.5 }}>{r.n}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--ink-faint)', fontFamily: 'var(--mono)' }}>{r.s}</span>
                </div>
              ))}
              <div style={{ padding: '18px 26px', background: 'var(--paper-2)', display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--ink-soft)' }}>Collected this month</span>
                <strong style={{ fontVariantNumeric: 'tabular-nums' }}>$117 / $156</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="section section-tint" style={{ textAlign: 'center' }}>
        <div className="wrap-narrow">
          <span className="eyebrow" style={{ justifyContent: 'center' }}>Ready when you are</span>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.6vw, 2.6rem)', marginTop: 16 }}>
            Get your semester sorted today
          </h2>
          <p style={{ color: 'var(--ink-soft)', marginTop: 15, fontSize: '1.05rem' }}>
            Choose a plan, pay securely online, and ride with a verified operator
            from tomorrow morning.
          </p>
          <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 28 }}>
            <Link href="/pricing" className="btn-cta">View plans</Link>
            <a href={`mailto:${business.email}`} className="btn-ghost">Email our team</a>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
