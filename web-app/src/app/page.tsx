import Link from 'next/link';
import SiteChrome from '../components/SiteChrome';
import RouteNetwork from '../components/RouteNetwork';
import { getCommissionPercent } from '../lib/business';

export const metadata = {
  title: 'UniShuttle: university bus travel in Sri Lanka',
  description:
    'UniShuttle connects university students with private bus operators in Sri Lanka. Request a seat, answer attendance polls, pay your fare to your driver and track your bus live.'
};

const Icon = ({ d }: { d: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const features = [
  {
    audience: 'Students',
    title: 'Find a bus, request a seat',
    description: 'Browse admin-verified buses with their route, pickup time, seats and monthly fee.',
    icon: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M3 10.5h18M7 17v2M17 17v2" /></>
  },
  {
    audience: 'Students',
    title: 'Monthly fare tracking',
    description: 'Pay your driver in cash and they record it, so your full payment history is always in one place.',
    icon: <><rect x="2.5" y="6" width="19" height="12" rx="2.5" /><path d="M2.5 10h19" /><path d="M6.5 14.5h3" /></>
  },
  {
    audience: 'Drivers',
    title: 'Passengers and polls',
    description: 'Accept seat requests, manage your passenger list, and ask “Are you coming tomorrow?”',
    icon: <><path d="M9 11l3 3 7-7" /><path d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9" /></>
  },
  {
    audience: 'Drivers',
    title: 'Monthly fare tracker',
    description: 'See who has paid, who has not, and who is not travelling. Record cash payments in a tap.',
    icon: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 14h3M8 17h6" /></>
  }
];

const ticker = ['Seat requests', 'Live GPS tracking', 'Attendance polls', 'Monthly fare tracker', 'Daily rides', 'Driver notices', 'Verified buses'];

const fareRows = [
  { name: 'Student A', status: 'Paid · Cash', color: 'var(--signal)' },
  { name: 'Student B', status: 'Unpaid', color: '#ff7b72' },
  { name: 'Student C', status: 'Not travelling', color: 'var(--ink-faint)' },
  { name: 'Student D', status: 'Paid · Cash', color: 'var(--signal)' }
];

const arrow = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export default async function HomePage() {
  const commissionPercent = await getCommissionPercent();
  return (
    <SiteChrome>
      {/* ---------------- hero ---------------- */}
      <section className="hero">
        <RouteNetwork />
        <div className="wrap hero-inner">
          <div>
            <span className="eyebrow">For university students &amp; bus operators in Sri Lanka</span>
            <h1>
              Your university bus, <span className="hl">live in one app</span>.
            </h1>
            <p className="hero-lead">
              UniShuttle replaces phone calls and group chats. Request a seat, answer
              attendance polls and follow your bus on the map. Drivers manage
              passengers, fares and notices in one place.
            </p>
            <div className="hero-actions">
              <Link href="/signup" className="btn-cta">Get started {arrow}</Link>
              <Link href="/how-it-works" className="btn-ghost">See how it works</Link>
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
                  <span className="stop-time">Live GPS from the driver</span>
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
            <div className="telemetry">
              <div><span>Arrives in</span><b className="mint">8 min</b></div>
              <div><span>Distance</span><b>3.2 km</b></div>
              <div><span>Speed</span><b>32 km/h</b></div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- ticker ---------------- */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[...ticker, ...ticker].map((item, i) => <span key={i}>{item}</span>)}
        </div>
      </div>

      {/* ---------------- features ---------------- */}
      <section className="section">
        <div className="wrap reveal">
          <div className="section-head">
            <span className="eyebrow">What it does</span>
            <h2>One platform for students, drivers and admins</h2>
            <p>
              Use the UniShuttle app or this website. An admin verifies every driver
              before their bus is listed.
            </p>
          </div>

          <div className="bento">
            <article className="card span-2">
              <div>
                <span className="tag">Students</span>
                <h3 style={{ marginTop: 14 }}>Watch your bus move, live</h3>
                <p>
                  When your driver starts sharing their location, the bus appears on
                  your map and moves in real time, with distance and arrival time to you.
                </p>
              </div>
              <div className="radar" aria-hidden="true"><i /></div>
            </article>

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

            <article className="card span-3">
              <div className="card-icon amber">
                <Icon d={<><path d="M12 3l8 3.5v5c0 4.6-3.2 8.6-8 9.5-4.8-.9-8-4.9-8-9.5v-5L12 3z" /><path d="M9.2 12l2 2 3.8-4" /></>} />
              </div>
              <div>
                <span className="tag soon">Coming soon</span>
                <h3 style={{ marginTop: 10, marginBottom: 6 }}>Online payments and driver payouts</h3>
                <p>Pay your fare by card in the app, with earnings going straight to the driver’s wallet.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ---------------- steps ---------------- */}
      <section className="section section-tint">
        <div className="wrap reveal">
          <div className="section-head">
            <span className="eyebrow">Getting started</span>
            <h2>From sign-up to your first ride</h2>
          </div>

          <div className="steps">
            <div className="step">
              <h3>Create your profile</h3>
              <p>Register as a student with your university and pickup point.</p>
            </div>
            <div className="step">
              <h3>Request a seat</h3>
              <p>Choose a verified bus and send a request. The driver accepts it.</p>
            </div>
            <div className="step">
              <h3>Pay your fare</h3>
              <p>Hand cash to your driver, who records it. Online card payments are coming soon.</p>
            </div>
            <div className="step">
              <h3>Track and travel</h3>
              <p>Answer the driver’s attendance poll and follow the bus live on the map.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- drivers ---------------- */}
      <section className="section">
        <div className="wrap reveal">
          <div className="grid-2" style={{ alignItems: 'center', gap: 52 }}>
            <div>
              <span className="eyebrow">For bus operators</span>
              <h2 className="h2-side">Stop chasing fares in a notebook</h2>
              <p style={{ color: 'var(--ink-soft)', marginTop: 15, fontSize: '1.04rem' }}>
                Register with your NIC, driving licence, vehicle registration and bus
                photo. Once an admin approves you, students can find your bus and
                request seats.
              </p>
              <ul className="ticks" style={{ marginTop: 22 }}>
                <li>You set your own monthly and daily fees</li>
                <li>The platform keeps a {commissionPercent}% commission on fares</li>
                <li>Paid, unpaid and not-travelling students at a glance</li>
                <li>Post notices to all your passengers</li>
              </ul>
              <div className="hero-actions" style={{ marginTop: 28 }}>
                <Link href="/signup" className="btn-cta">Register your bus {arrow}</Link>
                <Link href="/how-it-works#drivers" className="btn-ghost">How it works</Link>
              </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
              <div className="fare-head">
                <strong style={{ fontSize: 15 }}>Fare tracker (example)</strong>
                <span className="tag">This month</span>
              </div>
              {fareRows.map(r => (
                <div className="fare-row" key={r.name}>
                  <i style={{ color: r.color }} />
                  <b>{r.name}</b>
                  <span>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap reveal">
          <div className="cta-panel">
            <RouteNetwork />
            <div>
              <h2>Ready when your bus is</h2>
              <p>
                Whether you are a student looking for a bus or an operator who wants
                to join, it takes a few minutes to get set up.
              </p>
              <div className="hero-actions">
                <Link href="/signup" className="btn-cta">Create an account {arrow}</Link>
                <Link href="/contact" className="btn-ghost">Contact us</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
