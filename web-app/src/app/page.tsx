import Link from 'next/link';
import SiteChrome from '../components/SiteChrome';
import { rules } from '../lib/business';

export const metadata = {
  title: 'UniShuttle: university bus travel in Sri Lanka',
  description:
    'UniShuttle connects university students with private bus operators in Sri Lanka. Request a seat, answer attendance polls, pay your fare in-app with PayHere and track your bus live.'
};

const Icon = ({ d }: { d: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const features = [
  {
    audience: 'Students',
    title: 'Find a bus and request a seat',
    description: 'Browse admin-verified buses with their route, pickup time, seats and monthly fee. Request a seat and see in the app when the driver accepts.',
    icon: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M3 10.5h18M7 17v2M17 17v2" /></>
  },
  {
    audience: 'Students',
    title: 'Live bus tracking',
    description: 'When your driver starts sharing their location, the bus appears on a map in your app and moves in real time.',
    icon: <><path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></>
  },
  {
    audience: 'Students',
    title: 'Pay fares in the app',
    description: 'Pay your monthly fare or a single daily ride through PayHere, and see your full payment history.',
    icon: <><rect x="2.5" y="6" width="19" height="12" rx="2.5" /><path d="M2.5 10h19" /><path d="M6.5 14.5h3" /></>
  },
  {
    audience: 'Drivers',
    title: 'Passengers and attendance polls',
    description: 'Accept or reject seat requests, manage your passenger list, and ask “Are you coming tomorrow?” to see who will travel.',
    icon: <><path d="M9 11l3 3 7-7" /><path d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9" /></>
  },
  {
    audience: 'Drivers',
    title: 'Monthly fare tracker',
    description: 'See who has paid, who has not, and who is not travelling this month. Record cash payments in a tap.',
    icon: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 14h3M8 17h6" /></>
  },
  {
    audience: 'Drivers',
    title: 'Wallet and payouts',
    description: 'In-app payments go to your wallet, minus the platform commission. Request a payout whenever you need it.',
    icon: <><path d="M12 3l8 3.5v5c0 4.6-3.2 8.6-8 9.5-4.8-.9-8-4.9-8-9.5v-5L12 3z" /><path d="M9.2 12l2 2 3.8-4" /></>
  }
];

export default function HomePage() {
  return (
    <SiteChrome>
      {/* ---------------- hero ---------------- */}
      <section className="hero">
        <div className="wrap hero-inner">
          <div>
            <span className="eyebrow">For university students &amp; bus operators in Sri Lanka</span>
            <h1 style={{ marginTop: 18 }}>
              Your university bus, <span className="hl">organised in one app</span>.
            </h1>
            <p className="hero-lead">
              UniShuttle replaces phone calls and group chats. Students request a
              seat, answer daily attendance polls, pay their fare and track the bus
              live. Drivers manage passengers, fares and notices in one place.
            </p>
            <div className="hero-actions">
              <Link href="/how-it-works" className="btn-cta">
                See how it works
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
              <Link href="/contact" className="btn-ghost">Contact us</Link>
            </div>
          </div>

          {/* example of the student's tracking view */}
          <div className="route-card" aria-label="Example of a bus route in the app">
            <div className="route-card-head">
              <span className="route-badge">EXAMPLE ROUTE</span>
              <span className="live-dot"><i />LIVE</span>
            </div>
            <ul className="stops">
              <li className="stop">
                <span className="stop-dot" />
                <span>
                  <span className="stop-name">Starting point</span><br />
                  <span className="stop-time">Set by the driver</span>
                </span>
              </li>
              <li className="stop is-bus">
                <span className="stop-dot">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="12" rx="2" /><path d="M4 11h16" /></svg>
                </span>
                <span>
                  <span className="stop-name">Bus is on the way</span><br />
                  <span className="stop-time">Live GPS from the driver’s phone</span>
                </span>
              </li>
              <li className="stop">
                <span className="stop-dot" />
                <span>
                  <span className="stop-name">Your pickup point</span><br />
                  <span className="stop-time">Saved in your profile</span>
                </span>
              </li>
              <li className="stop">
                <span className="stop-dot" />
                <span>
                  <span className="stop-name">University</span><br />
                  <span className="stop-time">Driver’s destination</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------- features ---------------- */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">What the app does</span>
            <h2>One platform for students, drivers and admins</h2>
            <p>
              Students and drivers use the UniShuttle mobile app. An admin verifies
              every driver before their bus is listed.
            </p>
          </div>

          <div className="grid-3">
            {features.map((f, i) => (
              <article className="card" key={f.title}>
                <div className={`card-icon${i % 2 ? ' amber' : ''}`}>
                  <Icon d={f.icon} />
                </div>
                <span className="tag">{f.audience}</span>
                <h3 style={{ marginTop: 12 }}>{f.title}</h3>
                <p>{f.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- steps ---------------- */}
      <section className="section section-tint">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Getting started</span>
            <h2>From sign-up to your first ride</h2>
          </div>

          <div className="steps">
            <div className="step done">
              <h3>Create your profile</h3>
              <p>Register as a student with your university and pickup point.</p>
            </div>
            <div className="step done">
              <h3>Request a seat</h3>
              <p>Choose a verified bus and a monthly or daily plan. The driver accepts your request.</p>
            </div>
            <div className="step done">
              <h3>Pay your fare</h3>
              <p>Pay in the app with PayHere, or hand cash to your driver, who records it.</p>
            </div>
            <div className="step done">
              <h3>Track and travel</h3>
              <p>Answer the driver’s attendance poll and follow the bus live on the map.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- drivers ---------------- */}
      <section className="section">
        <div className="wrap">
          <div className="grid-2" style={{ alignItems: 'center', gap: 52 }}>
            <div>
              <span className="eyebrow">For bus operators</span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3.3vw, 2.4rem)', marginTop: 16 }}>
                Stop chasing fares in a notebook
              </h2>
              <p style={{ color: 'var(--ink-soft)', marginTop: 15, fontSize: '1.04rem' }}>
                Register with your NIC, driving licence, vehicle registration and bus
                photo. Once an admin approves you, students can find your bus and
                request seats.
              </p>
              <ul className="ticks" style={{ marginTop: 22 }}>
                <li>You set your own monthly and daily fees</li>
                <li>The platform keeps {rules.commissionPercent}% of in-app payments; the rest goes to your wallet</li>
                <li>Paid, unpaid and not-travelling students at a glance</li>
                <li>Post notices to all your passengers</li>
              </ul>
              <div className="hero-actions" style={{ marginTop: 28 }}>
                <Link href="/how-it-works#drivers" className="btn-cta">How it works for drivers</Link>
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 15 }}>Fare tracker (example)</strong>
                <span className="tag">This month</span>
              </div>
              {[
                { n: 'Student A', s: 'Paid · In-app', c: 'var(--signal)' },
                { n: 'Student B', s: 'Unpaid', c: '#c4453f' },
                { n: 'Student C', s: 'Not travelling', c: 'var(--ink-faint)' },
                { n: 'Student D', s: 'Paid · Cash', c: 'var(--signal)' }
              ].map(r => (
                <div key={r.n} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 26px', borderBottom: '1px solid var(--line-soft, #eef1f6)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: r.c, flex: 'none' }} />
                  <span style={{ fontWeight: 600, fontSize: 14.5 }}>{r.n}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--ink-faint)', fontFamily: 'var(--mono)' }}>{r.s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="section section-tint" style={{ textAlign: 'center' }}>
        <div className="wrap-narrow">
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.6vw, 2.6rem)' }}>
            Questions about UniShuttle?
          </h2>
          <p style={{ color: 'var(--ink-soft)', marginTop: 15, fontSize: '1.05rem' }}>
            Whether you are a student looking for a bus or an operator who wants to
            join, send us a message.
          </p>
          <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 28 }}>
            <Link href="/contact" className="btn-cta">Contact us</Link>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
