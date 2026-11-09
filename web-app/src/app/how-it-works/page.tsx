import Link from 'next/link';
import SiteChrome from '../../components/SiteChrome';
import RouteNetwork from '../../components/RouteNetwork';
import { rules, getCommissionPercent } from '../../lib/business';

export const metadata = {
  title: 'How it works | UniShuttle',
  description:
    'How UniShuttle works for students and bus drivers: seat requests, daily rides, attendance polls, monthly fares, live tracking and more.'
};

export default async function HowItWorksPage() {
  const commissionPercent = await getCommissionPercent();
  return (
    <SiteChrome>
      <section className="page-head">
        <RouteNetwork />
        <div className="wrap">
          <span className="eyebrow">How it works</span>
          <h1>How UniShuttle works</h1>
          <p>
            Students and drivers can use the UniShuttle app or this website. Here is
            what each of them can do, and how fares work.
          </p>
        </div>
      </section>

      {/* ---------------- students ---------------- */}
      <section className="section" id="students">
        <div className="wrap reveal">
          <div className="section-head">
            <span className="eyebrow">For students</span>
            <h2>Getting a seat and travelling</h2>
          </div>

          <div className="steps">
            <div className="step done">
              <h3>Register</h3>
              <p>Sign up with your name, university, faculty, pickup point, destination and an emergency contact.</p>
            </div>
            <div className="step done">
              <h3>Choose a bus</h3>
              <p>Browse admin-approved buses. Each shows its route, pickup time, number of seats and monthly fee.</p>
            </div>
            <div className="step done">
              <h3>Request a seat</h3>
              <p>Send a seat request. You will see when the driver accepts or rejects it.</p>
            </div>
            <div className="step done">
              <h3>Travel</h3>
              <p>Answer the driver’s attendance polls, read their notices, and track the bus live on a map.</p>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: 46 }}>
            <div className="card">
              <h3>Daily rides</h3>
              <p>
                Need the bus for just one day? Book a daily ride for a specific date:
                round trip, to university only, or from university only. The fare is
                the driver’s daily rate, and you pay the driver in cash when you travel.
              </p>
            </div>
            <div className="card">
              <h3>Live tracking</h3>
              <p>
                When the driver starts sharing their location, your map shows the
                bus moving in real time. If you open the map later, you still see
                its latest position straight away.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- fares ---------------- */}
      <section className="section section-tint" id="fares">
        <div className="wrap reveal">
          <div className="section-head">
            <span className="eyebrow">Fares &amp; payments</span>
            <h2>Monthly fares are due by the {rules.fareDueDay}th</h2>
            <p>
              Each driver sets their own monthly and daily fees. Pay your driver in
              cash and they record it. Online card payments are coming soon.
            </p>
          </div>

          <div className="grid-3">
            <div className="card">
              <span className="tag">From the {rules.reminderFromDay}th</span>
              <h3 style={{ marginTop: 12 }}>Reminders</h3>
              <p>If this month’s fare is still unpaid, the app reminds you to pay before the {rules.fareDueDay}th.</p>
            </div>
            <div className="card">
              <span className="tag">After the {rules.fareDueDay}th</span>
              <h3 style={{ marginTop: 12 }}>Account frozen</h3>
              <p>
                An unpaid account is frozen: you can’t request seats or answer polls.
                Hand the fare to your driver and it unfreezes as soon as they mark it paid.
              </p>
            </div>
            <div className="card">
              <span className="tag">Grace period</span>
              <h3 style={{ marginTop: 12 }}>Joined late in the month?</h3>
              <p>
                If your seat was approved after the {rules.fareDueDay}th, you still owe
                that month’s fare but your account isn’t frozen for it.
              </p>
            </div>
          </div>

          <div className="notice-box" style={{ marginTop: 26 }}>
            <strong>Not travelling this month?</strong> Your driver can mark you as
            “not travelling”. Your account is then frozen for that month only and
            unfreezes automatically next month, or as soon as your driver marks the
            fare paid. An approved daily ride also unlocks your account for that day.
          </div>
        </div>
      </section>

      {/* ---------------- drivers ---------------- */}
      <section className="section" id="drivers">
        <div className="wrap reveal">
          <div className="section-head">
            <span className="eyebrow">For drivers</span>
            <h2>Running your bus service</h2>
          </div>

          <div className="steps">
            <div className="step done">
              <h3>Register your bus</h3>
              <p>Provide your NIC, driving licence, vehicle registration, bus photo, bank details, route, schedule and fees.</p>
            </div>
            <div className="step done">
              <h3>Get verified</h3>
              <p>An admin checks your documents. Your app updates the moment you are approved.</p>
            </div>
            <div className="step done">
              <h3>Accept students</h3>
              <p>Accept or reject seat and daily ride requests, and manage your passenger list.</p>
            </div>
            <div className="step done">
              <h3>Run your route</h3>
              <p>Send attendance polls, post notices, and share your live location while driving.</p>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: 46 }}>
            <div className="card">
              <h3>Fare tracker</h3>
              <ul className="ticks">
                <li>See every passenger as paid, unpaid or not travelling for each month</li>
                <li>Mark cash payments yourself</li>
                <li>Your passenger list stays up to date for every month</li>
              </ul>
            </div>
            <div className="card">
              <span className="tag soon">Coming soon</span>
              <h3 style={{ marginTop: 12 }}>Wallet &amp; payouts</h3>
              <ul className="ticks">
                <li>Online fare payments credited to your wallet</li>
                <li>The platform keeps a {commissionPercent}% commission</li>
                <li>Request a payout; it is paid once an admin approves it</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- admin ---------------- */}
      <section className="section section-tint">
        <div className="wrap reveal">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="eyebrow">Behind the scenes</span>
            <h2>The UniShuttle admin team</h2>
            <p>
              Our admins verify driver registrations, manage student and driver
              accounts, keep an eye on fares and answer
              messages sent through this website.
            </p>
          </div>
          <div className="hero-actions" style={{ marginTop: 28 }}>
            <Link href="/contact" className="btn-cta">Contact us</Link>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
